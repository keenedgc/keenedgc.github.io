#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

errors=0
today="$(date +%F)"

fail() {
  echo "ERROR: $1"
  errors=$((errors + 1))
}

search_lines() {
  local pattern="$1"
  shift
  if [[ $# -eq 0 ]]; then
    return 1
  fi

  if command -v rg >/dev/null 2>&1; then
    rg -n -e "$pattern" "$@"
  else
    grep -nHE -- "$pattern" "$@"
  fi
}

search_quiet() {
  local pattern="$1"
  local file="$2"

  if command -v rg >/dev/null 2>&1; then
    rg -q -e "$pattern" "$file"
  else
    grep -qE -- "$pattern" "$file"
  fi
}

print_matches_and_fail() {
  local message="$1"
  local pattern="$2"
  shift 2
  if [[ $# -eq 0 ]]; then
    return
  fi

  local matches
  matches="$(search_lines "$pattern" "$@" 2>/dev/null || true)"
  if [[ -n "$matches" ]]; then
    echo "$matches"
    fail "$message"
  fi
}

check_required_front_matter() {
  local file="$1"
  shift
  local field
  for field in "$@"; do
    if ! search_quiet "^[[:space:]]*${field}:[[:space:]]*.+$" "$file"; then
      fail "${file} is missing required front matter field: ${field}"
    fi
  done
}

find_markdown_files() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    return 0
  fi

  find "$dir" -maxdepth 1 -type f -name "*.md" ! -name "_index.md" | sort
}

echo "Running content QA checks..."

print_matches_and_fail "Replace membership signup placeholder URL in src/content/site/membership.md." \
  "signup_link:[[:space:]]*['\"]?#['\"]?[[:space:]]*$" \
  src/content/site/membership.md

print_matches_and_fail "Replace placeholder registration links in event content." \
  "registration_link:[[:space:]]*['\"]?#['\"]?[[:space:]]*$" \
  src/content/events/*.md

if [[ ! -d src/content/events ]]; then
  fail "Missing required directory: src/content/events"
fi

while IFS= read -r file; do
  check_required_front_matter "$file" title date event_type location

  event_type="$(sed -n 's/^[[:space:]]*event_type:[[:space:]]*//p' "$file" | head -n 1 | tr -d "\"'")"
  event_date="$(sed -n 's/^[[:space:]]*date:[[:space:]]*//p' "$file" | head -n 1 | tr -d "\"'" | cut -c1-10)"
  league_weekday="$(sed -n 's/^[[:space:]]*weekday:[[:space:]]*//p' "$file" | head -n 1 | tr -d "\"'")"
  league_day="$(sed -n 's/^[[:space:]]*day:[[:space:]]*//p' "$file" | head -n 1 | tr -d "\"'")"
  league_time="$(sed -n 's/^[[:space:]]*time:[[:space:]]*//p' "$file" | head -n 1 | tr -d "\"'")"
  season_start="$(sed -n 's/^[[:space:]]*season_start:[[:space:]]*//p' "$file" | head -n 1 | tr -d "\"'" | cut -c1-10)"
  season_end="$(sed -n 's/^[[:space:]]*season_end:[[:space:]]*//p' "$file" | head -n 1 | tr -d "\"'" | cut -c1-10)"

  if [[ -z "$event_date" || ! "$event_date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    fail "${file} has an invalid or missing YYYY-MM-DD date."
    continue
  fi

  if [[ "$event_type" == "League" ]]; then
    if [[ -z "$league_time" ]]; then
      fail "${file} is missing league time. Add a value like '5:00 PM'."
    fi

    if [[ -z "$league_weekday" && -z "$league_day" ]]; then
      fail "${file} is missing league weekday/day for recurring display."
    fi

    if [[ -z "$season_start" || ! "$season_start" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
      fail "${file} is missing a valid season_start (YYYY-MM-DD) for recurring display."
      continue
    fi

    if [[ -z "$season_end" || ! "$season_end" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
      fail "${file} is missing a valid season_end (YYYY-MM-DD) for recurring display."
      continue
    fi

    if [[ "$season_start" > "$season_end" ]]; then
      fail "${file} has season_start after season_end (${season_start} > ${season_end})."
    fi

    if [[ "$season_end" < "$today" ]]; then
      echo "NOTE: ${file} has season_end in the past (${season_end})."
    fi
  fi
done < <(find_markdown_files src/content/events)

if [[ ! -d src/content/courses ]]; then
  fail "Missing required directory: src/content/courses"
fi

while IFS= read -r file; do
  check_required_front_matter "$file" title location holes difficulty
done < <(find_markdown_files src/content/courses)

while IFS= read -r file; do
  check_required_front_matter "$file" title date author
done < <(find_markdown_files src/content/news)

if (( errors > 0 )); then
  echo "Content QA failed with ${errors} issue(s)."
  exit 1
fi

echo "Content QA passed."
