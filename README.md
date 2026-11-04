# Keene Disc Golf Club Website

Astro-powered, content-driven website for Keene Disc Golf Club. Thanks to Kokanee Disc Golf Club.

## Quick Start

```bash
npm install
npm run dev
npm run build
```

Then open `http://localhost:4321`.

The site is deployed as a static build to GitHub Pages and includes:
- Club pages and announcements
- Courses and event listings
- Recurring league next-occurrence logic
- FullCalendar views (events page + homepage mini calendar)
- Sveltia CMS admin editing at `/admin`

## Tech Stack

- [Astro 5](https://astro.build/)
- TypeScript (strict config)
- Tailwind CSS + typography plugin
- React island integration (`@astrojs/react`)
- FullCalendar (`@fullcalendar/react`, `@fullcalendar/daygrid`)
- Markdown content via Astro content collections
- Sveltia CMS (GitHub backend)

## Project Structure

```text
.
├─ .github/workflows/deploy.yml      # CI + GitHub Pages deployment
├─ public/
│  ├─ admin/                         # Sveltia CMS app + config
│  └─ images/                        # Static assets and uploads
├─ scripts/
│  ├─ qa-content.sh                  # Content QA checks (CI uses this)
│  └─ bear_tags_to_obsidian_folders.py
├─ src/
│  ├─ components/
│  │  ├─ EventCalendar.tsx           # React FullCalendar wrapper
│  │  └─ widgets/                    # Homepage sections/widgets
│  ├─ content/                       # Markdown content
│  │  ├─ courses/
│  │  ├─ events/
│  │  ├─ news/
│  │  ├─ sections/
│  │  ├─ site/
│  │  └─ socials/
│  ├─ layouts/BaseLayout.astro
│  ├─ pages/                         # Routes
│  ├─ styles/tailwind.css
│  ├─ utils/calendarEvents.ts        # Recurrence expansion for calendar events
│  └─ content.config.ts              # Collection schemas
├─ astro.config.mjs
├─ tailwind.config.mjs
└─ package.json
```

## Requirements

- Node.js 20+ recommended
- npm 10+

## Local Development

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Open:
- Site: `http://localhost:4321`
- Admin/CMS: `http://localhost:4321/admin/` (serves `public/admin/index.html`)

## Build and Preview

Production build:

```bash
npm run build
```

Preview the static output:

```bash
npm run preview
```

## npm Scripts

From `package.json`:

- `npm run dev` — Astro dev server
- `npm run start` — alias for `dev`
- `npm run build` — `astro check && astro build`
- `npm run preview` — serve built output
- `npm run astro -- <args>` — run Astro CLI directly

## Content Model

Defined in `src/content.config.ts`:

- `site` — top-level static page content
- `sections` — list page headers/descriptions
- `news` — announcements/posts
- `events` — one-off events + leagues
- `courses` — course directory
- `socials` — footer social links

### Event Fields (important)

For recurring leagues (`event_type: League`), use:
- `weekday` (recommended) or `day`
- `time`
- `season_start` (YYYY-MM-DD)
- `season_end` (YYYY-MM-DD)

These drive:
- “Next occurrence” display in page cards/detail
- Expanded date entries in FullCalendar

## Calendar Behavior

Calendar rendering is done by:
- `src/components/EventCalendar.tsx`
- `src/utils/calendarEvents.ts`

`toCalendarEvents()` rules:
- One-off events: one calendar item from `date`
- League events: weekly occurrences expanded from `season_start` to `season_end`
- If a league has no parseable weekday, it falls back to the event’s `date`

Color mapping:
- One-off events: `#FF4B33`
- League events: `#556B2F`

Calendar placements:
- Full calendar on `/events/`
- Compact calendar widget on homepage (`/`)

## Styling and Branding

- Tailwind config: `tailwind.config.mjs`
- Global theme/styles: `src/styles/tailwind.css`
- Fonts loaded in `src/layouts/BaseLayout.astro`:
  - Barlow Condensed (display)
  - Source Sans 3 (body)

Custom palette keys under `keene`:
- `red`, `crimson`, `olive`, `blue`, `chartreuse`, `forest`, `bark`, `sand`, `cream`

## Admin / CMS

Sveltia CMS is hosted from `public/admin/index.html` with config in `public/admin/config.yml`.

Current backend uses GitHub:
- `backend.name: github`
- `backend.repo`: `keenedgc/keenedgc.github.io`
- `backend.branch`: `main`
- `backend.base_url`: not set yet; add a Cloudflare Worker auth endpoint to enable GitHub OAuth sign-in

If your repo, branch, or auth endpoint changes, update `public/admin/config.yml`.

## Content QA Checks

Run locally:

```bash
./scripts/qa-content.sh
```

What it checks:
- Placeholder URLs in config/content
- Required front matter fields
- Date formatting and league season validity

CI runs this script before building.

Implementation detail:
- Script supports `rg` when available and falls back to `grep` when not.

## Deployment

Deployment workflow: `.github/workflows/deploy.yml`

On push to `main`:
1. Checkout code
2. Run `./scripts/qa-content.sh`
3. Build/upload via `withastro/action@v5`
4. Deploy to GitHub Pages via `actions/deploy-pages@v4`

Domain settings:
- The site is currently published at `https://keenedgc.github.io/`. GitHub serves that address because the repo is named `keenedgc.github.io`.
- In repo Settings → Pages, Source is **GitHub Actions** and Custom domain is blank.
- `public/.nojekyll` included for Pages compatibility

### Moving to keenediscgolf.club

`keenediscgolf.club` currently points to the club's old Weebly site. To move this site there:

1. **Code changes**
   - `astro.config.mjs`: set `site: 'https://keenediscgolf.club'`
   - `public/admin/config.yml`: set `site_url: "https://keenediscgolf.club"`
   - Recreate `public/CNAME` containing the single line `keenediscgolf.club`
2. **GitHub:** in Settings → Pages, set Custom domain to `keenediscgolf.club`. Turn on **Enforce HTTPS** once the certificate is ready.
3. **DNS** (managed at Register.com):
   - Save a copy of the current records first, and leave the MX (email) records alone.
   - Replace the apex `A` record with GitHub Pages' IPs: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Confirm them in [GitHub's custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) first.
   - Set `www` to a `CNAME` pointing to `keenedgc.github.io`.
4. **Check old URLs:** compare the Weebly site's main page URLs with this site's routes, since missing ones will return 404.

The repo name and `backend.repo` don't change for this move. To undo it, restore the saved DNS records.

## Active Routes

- `/`
- `/about/`
- `/connect/` (with `/contact/` redirect)
- `/leagues/`
- `/courses/` and `/courses/[slug]/`
- `/events/` and `/events/[slug]/`
- `/news/` and `/news/[slug]/`
- `/admin` (`/admin/index.html`)

## Notes for Maintainers

- Membership and volunteer routes were intentionally removed from `src/pages/`.
- `src/content/site/membership.md` and `src/content/site/volunteer.md` may still exist for editorial history.
- Footer/navigation links should stay aligned with actual route availability.

## Troubleshooting

### Build passes locally but fails in CI

- Run `./scripts/qa-content.sh` locally first
- Check missing/invalid front matter in `src/content/**`
- Ensure no placeholder values remain (for example `registration_link: #`)

### `/admin` path behavior

`/admin/index.html` is served directly from `public/admin/index.html`.

### Calendar not showing expected league dates

Verify league entry has:
- `event_type: League`
- `weekday` (or `day`)
- `season_start`
- `season_end`
- `time`

## License

No explicit license file is currently included in this repository.
