#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const beforeRef = process.argv[2] || process.env.GITHUB_EVENT_BEFORE || 'HEAD~1';
const afterRef = process.argv[3] || 'HEAD';

if (/^0+$/.test(beforeRef)) {
  console.log('No previous commit available. Skipping event redirect alias automation.');
  process.exit(0);
}

function runGit(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function normalizeAlias(value) {
  let slug = value.trim();
  if (!slug) return null;

  slug = slug.replace(/^https?:\/\/[^/]+/i, '');
  slug = slug.replace(/\\/g, '/');
  slug = slug.replace(/^\/+/, '').replace(/\/+$/, '');
  slug = slug.replace(/^events\/+/, '');

  return slug || null;
}

function parseAliasToken(value) {
  const withoutComment = value.replace(/\s+#.*$/, '').trim();
  const unquoted = withoutComment.replace(/^['"]/, '').replace(/['"]$/, '').trim();
  return normalizeAlias(unquoted);
}

function eventPathToSlug(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const prefix = 'src/content/events/';
  if (!normalized.startsWith(prefix) || !normalized.endsWith('.md')) return null;
  return normalizeAlias(normalized.slice(prefix.length, -3));
}

function ensureRedirectAlias(filePath, oldSlug) {
  const content = readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!frontmatterMatch) {
    console.warn(`Skipping ${filePath}: no frontmatter block found.`);
    return false;
  }

  const lines = frontmatterMatch[1].split(/\r?\n/);
  const body = content.slice(frontmatterMatch[0].length);
  const normalizedOldSlug = normalizeAlias(oldSlug);
  if (!normalizedOldSlug) return false;

  const redirectFieldIndex = lines.findIndex((line) => /^redirect_from:\s*/.test(line));
  let changed = false;

  if (redirectFieldIndex === -1) {
    lines.push('redirect_from:');
    lines.push(`  - ${normalizedOldSlug}`);
    changed = true;
  } else {
    const fieldMatch = lines[redirectFieldIndex].match(/^redirect_from:\s*(.*)$/);
    const remainder = (fieldMatch?.[1] ?? '').trim();

    if (!remainder) {
      const aliases = [];
      let scan = redirectFieldIndex + 1;
      while (scan < lines.length && /^\s*-\s+/.test(lines[scan])) {
        const alias = parseAliasToken(lines[scan].replace(/^\s*-\s+/, ''));
        if (alias) aliases.push(alias);
        scan += 1;
      }

      if (!aliases.includes(normalizedOldSlug)) {
        lines.splice(scan, 0, `  - ${normalizedOldSlug}`);
        changed = true;
      }
    } else if (remainder.startsWith('[') && remainder.endsWith(']')) {
      const aliases = remainder
        .slice(1, -1)
        .split(',')
        .map((token) => parseAliasToken(token))
        .filter(Boolean);

      if (!aliases.includes(normalizedOldSlug)) {
        const merged = [...new Set([...aliases, normalizedOldSlug])];
        lines.splice(redirectFieldIndex, 1, 'redirect_from:', ...merged.map((alias) => `  - ${alias}`));
        changed = true;
      }
    } else {
      const alias = parseAliasToken(remainder);
      if (alias !== normalizedOldSlug) {
        const merged = [...new Set([alias, normalizedOldSlug].filter(Boolean))];
        lines.splice(redirectFieldIndex, 1, 'redirect_from:', ...merged.map((value) => `  - ${value}`));
        changed = true;
      }
    }
  }

  if (!changed) return false;

  const updated = `---\n${lines.join('\n')}\n---\n${body}`;
  writeFileSync(filePath, updated, 'utf8');
  return true;
}

const diffOutput = runGit([
  'diff',
  '--name-status',
  '--find-renames',
  beforeRef,
  afterRef,
  '--',
  'src/content/events'
]);

if (!diffOutput) {
  console.log('No event file changes detected.');
  process.exit(0);
}

const renameRows = diffOutput
  .split('\n')
  .map((row) => row.trim())
  .filter(Boolean)
  .map((row) => row.split('\t'))
  .filter((columns) => columns[0]?.startsWith('R') && columns.length >= 3)
  .map((columns) => ({ oldPath: columns[1], newPath: columns[2] }));

if (renameRows.length === 0) {
  console.log('No event file renames detected.');
  process.exit(0);
}

let updatedCount = 0;

for (const rename of renameRows) {
  const oldSlug = eventPathToSlug(rename.oldPath);
  const newSlug = eventPathToSlug(rename.newPath);
  if (!oldSlug || !newSlug || oldSlug === newSlug) continue;

  const changed = ensureRedirectAlias(rename.newPath, oldSlug);
  if (changed) {
    updatedCount += 1;
    console.log(`Added redirect alias "${oldSlug}" to ${rename.newPath}`);
  } else {
    console.log(`Alias "${oldSlug}" already present in ${rename.newPath}`);
  }
}

if (updatedCount === 0) {
  console.log('No redirect aliases needed.');
}
