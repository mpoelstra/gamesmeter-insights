# GamesMeter Insights

A single‑page Angular app that turns a GamesMeter CSV export into a visual report: trends, timelines, platform summaries, best games, fun stats, and a playable “Snakemeter”. The app runs entirely in the browser — the CSV never leaves the client.

## Features
- CSV upload with local parsing and caching
- Multi‑tab insights: Overview, Timeline, Platforms, Best Games, Fun Stats, Hidden Gems (placeholder), Game Library, Snakemeter
- Router‑based navigation (shareable URLs)
- Responsive layout with reusable UI components
- Localized UI (EN/NL) with date formatting

## Tech Stack
- Angular (standalone components, signals)
- Chart.js via ng2‑charts
- GitHub Pages deployment

## Prerequisites
- Node.js 22+
- npm 10+

## Local Development
```bash
cd web
npm install
npm run start
```
Then open the local dev URL printed by Angular (usually `http://localhost:4200`).

## Production Build
```bash
cd web
npm run build -- --configuration production --base-href /gamesmeter-insights/
```
Build output is under `web/dist/...` (the workflow auto‑detects the exact subfolder).

## Deployment (GitHub Pages)
Deployment is automated via `.github/workflows/deploy.yml`:
- Runs on every push to `main`
- Builds with `--base-href /gamesmeter-insights/`
- Uploads the build output as a Pages artifact
- Deploys to GitHub Pages

The live site is hosted at:
```
https://mpoelstra.github.io/gamesmeter-insights/
```

## SPA 404 Fallback (Deep Links)
GitHub Pages doesn’t support SPA deep links by default (e.g. `/timeline`).
To fix this, we ship a fallback that redirects unknown paths back to the SPA:

- `web/src/404.html` contains a small redirect script
- `web/src/index.html` restores the path after the redirect

This allows URLs like `/gamesmeter-insights/timeline` to work on refresh.

## Frontend Architecture
### Routing
Routes are defined in `web/src/app/app.routes.ts` and each page is a standalone component:
- `OverviewPageComponent`
- `TimelinePageComponent`
- `PlatformsPageComponent`
- `GamesPageComponent`
- `FunPageComponent`
- `GemsPageComponent`
- `SnakePageComponent`
- `LibraryPageComponent`

A platform click in Overview navigates to `/library?platform=...` and the library page consumes the query once, then clears it.

### Data & State
- CSV parsing and insights live in `web/src/app/services/insights.service.ts`
- Data is cached locally (no server)
- UI is driven by signals and computed signals

### Reusable UI Components
Shared components live in `web/src/app/shared/` and include:
- `rating-stars` (5‑star visual rating)
- `platform-logo`
- `platform-stat-card`
- `platform-peak-item`
- `best-game-item`
- `best-games-year`
- `stats-card`
- `section-header`
- `chart-card`

### Platform Logos
Platform images are served from `web/src/assets/platforms/`.
Mappings are defined in `web/src/app/platform-images.ts`.
If a platform isn’t mapped, a generic icon is used.

## Scripts
From `/web`:
- `npm run start` — dev server
- `npm run build -- --configuration production --base-href /gamesmeter-insights/` — production build

## Notes
- All processing happens locally in the browser.
- If you add new routes, remember GitHub Pages needs the SPA fallback (already included).
- If you add new platform logos, drop SVG/PNG into `web/src/assets/platforms/` and update the map.

---

Questions or improvements welcome.
