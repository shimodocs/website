# ShimoDocs Website

Vite + React marketing site for ShimoDocs, prerendered to static HTML at build time.

## Routes

- `/` — Home
- `/ai-workspace` — AI Workspace
- `/blog` — Blog
- `/help-center` — Help Center
- `/pricing` — Pricing
- `/contact-sales` — Contact Sales

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

`npm run build` runs three steps:

1. `vite build` — the client bundle into `dist/`.
2. `vite build --ssr src/entry-server.jsx` — a throwaway SSR bundle.
3. `node scripts/prerender.mjs` — renders every route in `src/routes.jsx` to
   `dist/<route>/index.html`, writes `dist/404.html`, `dist/robots.txt` and
   `dist/sitemap.xml`, then verifies the result and fails the build if anything
   is missing.

Nginx serves `dist/` with `try_files $uri $uri/ =404`, so an unknown path is a
real 404 rather than the home page returned with a 200.

## SEO

The site is prerendered rather than client-only, so a crawler that does not run
JavaScript still receives headings, copy and internal links.

- `src/seo.js` is the single source of truth for titles, descriptions,
  keywords, canonical URLs, the FAQ copy and all structured data. A route can
  never drift between the router and the crawler.
- `src/routes.jsx` is the shared route table used by both the client router and
  the prerenderer, so adding a page automatically gives it prerendered HTML.
  It throws at import time if the route list and the SEO table disagree.
- `src/seo-dom.js` re-applies the same metadata during client-side navigation,
  so the title and canonical stay correct without a full page load.
- The build emits `robots.txt`, `sitemap.xml`, a branded 1200x630
  `og-image.png`, a favicon set and JSON-LD (`Organization`, `WebSite`,
  `WebPage`, `SoftwareApplication`, `FAQPage`, `BreadcrumbList`).
- `npm run build` fails on duplicate titles or descriptions and on titles over
  62 characters or descriptions over 160, because search results truncate them.

### Canonical origin

Canonical URLs, the sitemap and the social images all derive from `VITE_SITE_URL`,
which defaults to `http://43.172.115.22`. When the production domain is live, set
the repository variable `SITE_URL` (Settings → Secrets and variables → Actions →
Variables) to the real origin, for example `https://shimodocs.com`, and tag a new
release. No code change is required.

### Regenerating brand assets

```bash
npm run assets
```

`scripts/make-assets.py` measures its own layout and refuses to write an Open
Graph card where text would overflow or collide with the screenshot.

## Download call to action

The home hero links the self-hosted installer from `src/downloads.js`. The
primary button downloads the `amd64` build, with `arm64` and an "All releases"
fallback beside it. The footer links the releases page as well.

`shimodocs.com` has no working download surface — its `/download` page renders
"Coming Soon", no page on that site links to an installer and no download
hostname exists — so the artifacts come from the
[shimodocs/shimodocs releases](https://github.com/shimodocs/shimodocs/releases).
The Chinese enterprise download centre at `shimo.net` serves the `-cn` build and
the k3s release tarball instead.

The asset file name embeds the installer version, so a new installer build means
bumping `INSTALLER_VERSION` in `src/downloads.js`. The deploy workflow resolves
both links with a ranged request and fails the release if either stops working,
which catches a renamed asset before users hit a dead button.

## Publishing

The canonical repository is [shimodocs/website](https://github.com/shimodocs/website).
Pushes and pull requests to `main` run build checks only. Pushing a new `v*` tag
triggers the production deployment through GitHub Actions:

```bash
git push origin main
git tag -a v1.0.2 -m "Release v1.0.2"
git push origin v1.0.2
```

Use a new, unused version for each release. See [deployment instructions](deploy/README.md)
for server setup, Secrets, verification and rollback.
