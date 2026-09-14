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
which the release workflow fills from the repository variable `SITE_URL`. That
variable is set to `https://shimodocs.com`, the live origin, so every release from
`v1.3.3` on emits the domain. It defaults to `http://43.172.115.22` — the origin
the site was served from before the domain was connected — when the variable is
unset, so a fresh clone still builds without one. Changing it only requires
tagging another release; no code change is needed.

Cloudflare proxies `shimodocs.com` to that origin with SSL/TLS mode Full (strict),
Always Use HTTPS and HSTS on. The origin certificate is issued by Let's Encrypt
and renewed by `certbot.timer`; see
[deploy/README.md](deploy/README.md#https) for the server side.

### Regenerating brand assets

```bash
npm run assets
```

`scripts/make-assets.py` measures its own layout and refuses to write an Open
Graph card where text would overflow or collide with the screenshot.

The icon it writes is not drawn in code: `brand/shimodocs-mark.svg` and
`brand/shimodocs-icon.png` hold the designed artwork the previous site shipped
(the leaf mark in a circle for the favicon, in a tile for the touch icon), and
the script resamples them. Replace those two files to change the mark — the
header wordmark lives at `public/assets/logo-shimodocs.svg`.

## Download and licence call to action

The home hero carries the two ways to get the product, both defined in
`src/downloads.js`:

- **Download for Linux · amd64** links the self-hosted installer, with the
  `arm64` build and an "All releases" fallback beside it. The footer links the
  releases page as well.
- **Get a free perpetual license** opens a prefilled licence request addressed to
  `support.global@shimo.im`, which the repository README documents as the
  official channel for the global build ("Request free by emailing
  support.global@shimo.im", free forever for five users, no credit card).

`shimodocs.com` has no working download surface — its `/download` page renders
"Coming Soon", no page on that site links to an installer and no download
hostname exists — so the artifacts come from the
[shimodocs/shimodocs releases](https://github.com/shimodocs/shimodocs/releases).
The Chinese enterprise download centre at `shimo.net` serves the `-cn` build and
the k3s release tarball instead.

Because the asset file name embeds the installer version, a new installer build
means bumping `INSTALLER_VERSION` in `src/downloads.js`. Two guards catch a
broken entry point: the prerenderer fails the build if the home page loses
either the installer link or the licence link, and the deploy workflow resolves
both installer URLs with a ranged request and fails the release if either stops
working.

## Contact Sales

The `/contact-sales` form writes each inquiry into a Teable table as one row. The
page posts straight to Teable's public share-form endpoint (`src/contact.js`),
which needs no credential and allows cross-origin requests, so the static build
needs no backend and the server needs no extra Nginx rule. Columns are addressed
by field id, so renaming one in Teable cannot break the form; the endpoint and
the field ids, plus how they were derived and how to rotate them, are documented
in [deploy/README.md](deploy/README.md#contact-sales-submissions). Set
`VITE_CONTACT_ENDPOINT` to send the form somewhere else instead.

## Blog

Articles are Markdown files in `content/blog/`. Adding a file is all that is
required: the build picks it up, prerenders it, links it from the archive and
adds it to the sitemap.

```bash
npm run content   # regenerate src/generated/blog-posts.js only
npm run build     # full build, includes the content step
```

### Authoring

Frontmatter is validated at build time. A post that would ship a bad title, a
duplicate description or a broken internal link fails the build rather than
going live.

```yaml
---
title: "What Is Private Cloud Document Collaboration?"     # the H1, written for a reader
seoTitle: "What Is Private Cloud..."                        # the search result, max 62 chars
description: "..."                                           # 110-160 chars, unique site-wide
category: self-hosting                                       # one of the ids in scripts/blog-content.mjs
date: 2026-01-12
updated: 2026-02-01                                          # optional
tags: [private cloud, self-hosted]
keywords: "..."                                              # optional, falls back to tags
featured: true                                               # optional, pins to the top of the archive
---
```

`seoTitle` is optional when `title` plus `" | ShimoDocs"` fits in 62 characters.

### Layouts

Every article picks a layout in its frontmatter. Each one renders a different
document structure rather than the same markup with different classes:

| Layout | Structure |
| --- | --- |
| `standard` | Breadcrumb, table of contents pinned left, two-column body |
| `feature` | Full-width hero band with a fact list, then a single narrow column, no sidebar |
| `briefing` | Intro separated out, every H2 becomes a numbered section, index rail on the right |
| `magazine` | Wide masthead with a metadata grid and a drop cap, full-width column, no sidebar |

The build fails if a layout is unused or if any layout covers more than 40% of
articles, and it compares the class signature each layout emits so two layouts
cannot quietly collapse into the same structure.

### Figures and asides

Articles carry diagrams and asides as fenced blocks, so an author writes data
rather than markup. Figures are inlined as SVG at build time, which means no
image requests and labels that crawlers can read.

````markdown
```figure
type: flow
title: The four egress points
items: Retrieval | Prompt payload | Provider retention | The output
detail: Does the search respect permissions | Text sent to a model endpoint | Requests kept for evaluation | Output cached or written back
caption: Figure 1. If you cannot draw all four arrows, you do not know where your content goes.
```
````

Figure types: `flow`, `layers`, `compare`, `bars`, `matrix`, `timeline`,
`screenshot`. Asides: `callout` (with `tone: note | warning | tip`),
`keypoints`, `pullquote`. Every article must have at least one figure.

### How articles are rendered

Article pages are rendered to HTML at build time with the body already inlined,
and the client bundle is then removed from them. A 1,500-word article therefore
costs the browser no JavaScript at all, and because nothing hydrates an article
there is no possibility of a hydration mismatch. The blog index stays a React
page and hydrates normally.

### What the build guarantees for every article

- A unique search title, a unique description and a self-referencing canonical.
- `BlogPosting` and `BreadcrumbList` structured data.
- A table of contents generated from the H2 and H3 headings.
- At least five internal blog links, plus related articles and older/newer paging.
- Presence in `sitemap.xml` and a link from the `/blog` archive.
- A word count floor, so a stub cannot ship as an article.

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
