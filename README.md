# ShimoDocs Website

Vite + React marketing site for ShimoDocs, prerendered to static HTML at build time.

## Routes

- `/` — Home
- `/ai-workspace` — AI Workspace
- `/blog` — Blog
- `/help-center` — Help Center
- `/docs` — Documentation index
- `/on-premises`, `/airgap` — Commercial hubs
- `/pricing` — Pricing
- `/contact-sales` — Contact Sales

The documentation is published in German and Japanese as well. English keeps
the unprefixed tree (`/docs/deployment/...`); a translation sits under its own
prefix (`/de/docs/...`, `/ja/docs/...`). `src/docs-languages.js` is the switch
that decides which languages exist, and the build fails if one is listed with
no content to render.

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
  `WebPage`, `SoftwareApplication`, `FAQPage`, `BreadcrumbList`). The
  `SoftwareApplication` node, with both `Offer`s, is emitted on the home page and
  on `/pricing` under one `@id`, and the pricing page names it as its
  `mainEntity`: the page a buyer reaches from "how much does this cost" states
  the price to a crawler, not only in prose.
- `npm run build` fails on duplicate titles or descriptions and on titles over
  62 characters or descriptions over 160, because search results truncate them.
- The commercial facts — the free limit, the per-user price and the annual
  discount — are written once in `src/pricing-facts.js`, and
  `scripts/check-pricing-facts.mjs` reads every rendered page and fails when one
  of them states a different number. The articles state the free limit in
  hand-written Markdown, which no import can reach; this is what keeps them
  honest. `npm run check:pricing` runs it alone.
- The product definition is written once in `src/product-facts.js`. The home
  hero, the about lead, Organization JSON-LD, the `llms.txt` blockquote and the
  "What is ShimoDocs?" FAQ all print that same sentence. The numeric facts strip
  on the commercial pages and the vs-articles reads installer sizes from
  `src/downloads.js` and prices from `src/pricing-facts.js`.
  `scripts/check-product-facts.mjs` fails the build when any of those surfaces
  drift. `npm run check:product` runs it alone.
- Every FAQ answer in the structured data has to be the same string a reader
  sees. `scripts/check-faq.mjs` strips the markup first and compares, so an
  answer that was rewritten in one place and not the other fails the build
  instead of shipping. `npm run check:faq` runs it alone.
- Sitemap `lastmod` is the date of the commit that last changed the file behind
  each URL, not the build date (`scripts/content-dates.mjs`). A build stamp would
  claim all 235 URLs changed on every deploy, which teaches Google the field
  carries nothing here — worse than omitting it. It is why the workflows check
  out the full history.
- `sitemap.xml` is an index and `sitemap-core.xml` comes first, so a crawler that
  reads one child after the index gets the commercial pages rather than the legal
  notices. The deploy asserts both that order and that the release serves real
  content dates.

For the conventions an editing agent has to respect, see [AGENTS.md](AGENTS.md).

### Content checks

Two checks read the prerendered HTML back and compare it against the source, so
copy that only exists in one place cannot drift from the copy that exists in
another:

- **FAQ** (`scripts/check-faq.mjs`). The FAQ exists twice on a page: the text a
  reader sees and the `FAQPage` markup a crawler reads, and Google requires the
  markup to describe visible content. Every question *and answer* is compared
  against the rendered text with the scripts stripped first — searching the raw
  HTML would match the markup against itself and always pass. The same question
  published with two different answers fails the build, and near-identical
  questions on different pages are reported as warnings.
- **Pricing facts** (`scripts/check-pricing-facts.mjs`). `src/pricing-facts.js`
  holds the free-team limit, the per-user price and the annual discount once;
  the footer, the pricing cards, the FAQ answers, the structured data and the
  article CTAs read from it. The limit's word forms are keyed by the limit they
  belong to, so changing the number and leaving the words behind fails at import
  rather than shipping pages that say "6" beside prose that says "five". A large share of the articles states the free limit
  in hand-written Markdown, which no import reaches, so this check reads every
  rendered page and fails the build when one of them states a different number.
  Changing a constant therefore updates the templated pages and names the
  articles that still need editing.
- **Product definition and numeric facts** (`scripts/check-product-facts.mjs`).
  `src/product-facts.js` holds the one-sentence definition and the unit-bearing
  numbers the commercial pages have to show. The check reads the prerendered
  home page, about page, `llms.txt` and the facts strip, and fails when any copy
  is no longer the constant.

These run as part of `npm run build` and on their own against any built directory
or a live release (point them at a downloaded copy):

```bash
npm run check:faq       # node scripts/check-faq.mjs dist
npm run check:pricing   # node scripts/check-pricing-facts.mjs dist
npm run check:product   # node scripts/check-product-facts.mjs dist
```

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

### Crawler policy, and what the CDN does to it

`robots.txt` is generated by the build. It names each search and assistant
crawler and allows it, then states the policy with a Content-Signal line:
retrieval is welcome (`ai-input=yes`), training is not (`ai-train=no`). The
allowances are per crawler rather than left to `User-agent: *` because
Cloudflare has prepended a managed block to this file before.

The managed robots.txt prefix is currently **off**: a fetch of
`https://shimodocs.com/robots.txt` is the file this build emits. The remaining
CDN problem is not robots, it is Bot Fight / AI Crawl Control. Official
`GPTBot`, `ClaudeBot`, `Amazonbot` and `Bytespider` user-agents receive HTTP
403 and a 25-byte `Your request was blocked.` body on HTML, `sitemap.xml` and
`llms.txt`, while `robots.txt` itself still returns 200. Origin nginx on
port 80 does not discriminate: the same GPTBot request against
`43.172.115.22` with `Host: shimodocs.com` returns 200 and the prerendered
page. `ChatGPT-User`, `OAI-SearchBot`, `PerplexityBot`, `Googlebot` and
`Bingbot` already receive 200 at the edge.

The analytics token in `seo/data/cloudflare-token.txt` can read Adaptive
traffic and cannot change Bot Fight or WAF. Allowing the citing / agreed
training crawlers needs zone-level dashboard access:

1. Cloudflare → `shimodocs.com` → **Security → Bots** (or **AI Crawl Control**).
2. Allow `GPTBot`, `ClaudeBot` and `Amazonbot`.
3. Keep `Bytespider` blocked.
4. Confirm managed robots.txt is still off.

Then run the edge check, which fetches the public hostname on purpose:

```bash
npm run check:crawlers   # node scripts/check-ai-crawlers.mjs
```

A build that curls the origin would report green while GPTBot still sees the
block, which is why this check is not part of `npm run build`.

### Discovery surfaces

Beside `sitemap.xml`, the build produces two things whose only job is to be
found:

- `/blog/feed.xml`, an RSS 2.0 feed of the archive, advertised with
  `<link rel="alternate">` from the blog index and from every article, and listed
  in `llms.txt`. Aggregators and assistants that poll for new work have one URL
  to watch, and the build fails if the feed stops listing an article or stops
  being advertised.
- An image sitemap: the core and pages sitemaps carry `<image:image>` entries for
  the screenshots each page actually displays. The check refuses an image a page
  does not have and an image this build did not produce, because an image sitemap
  that overstates what a page contains is a spam signal rather than a shortcut.

### Telling other engines (IndexNow)

```bash
npm run indexnow -- --dry-run   # print what would be sent
npm run indexnow                # submit every URL in the built sitemaps
npm run indexnow -- --live      # submit what the live site serves
```

The first submission is normally rejected with `SiteVerificationNotCompleted`
while IndexNow fetches the key file, so `--live` exists to retry it from
anywhere without cutting a release: it reads the published sitemap index and
submits those URLs.

Google does not support IndexNow. Bing, Yandex, Seznam and Naver do, and Bing's
index is what grounds several assistants — so this is the shortest path from a
published guide to an answer that can cite it. Ownership is proved by
`public/9f2a7c41d6b84e0fa3c5e18b7d60a294.txt`, which is a key rather than a
secret by design: IndexNow fetches it over HTTP. The build fails if that file is
missing, the deploy verification asserts the live site serves it, and the deploy
job submits the URLs after the release is verified — with `continue-on-error`, so
a rejected submission is a visible red step rather than a failed release.

### Daily Cloudflare traffic report

```bash
node scripts/cloudflare-daily.mjs --dry-run          # print, write nothing
node scripts/cloudflare-daily.mjs                    # yesterday (UTC), into Feishu
node scripts/cloudflare-daily.mjs --date 2026-09-14  # a specific day
```

It writes one row per day into the `流量观测` table of the same Feishu base the
download counts live in, through `lark-cli` and the operator's own
authorization — so the only secret is the Cloudflare token, which is read from
`seo/data/cloudflare-token.txt` (outside version control) and never stored
anywhere else.

**It has to run daily, and that is not a preference.** On the Free plan the
per-request dataset is queryable for a **one-day window** and the daily
aggregate returns **two days**: there is no history to back-fill, so a day that
is not read is gone. Running twice is safe — the row is updated, not duplicated.

The columns are chosen for what Search Console cannot say: which crawlers
actually fetched the site, what they asked for, and which requests failed.
`Googlebot` at zero for a day is a fact worth waking up to; a 404 that starts
with `/docs` is a real broken link, while a 404 for `/.env` is a scanner. The
"爬虫请求" column is a heuristic over the user-agent string, not a verified-bot
count: the API field for that is not available on this plan.

### Pointing the product README at this site

```bash
node scripts/product-readme-links.mjs /path/to/shimodocs-checkout --check
node scripts/product-readme-links.mjs /path/to/shimodocs-checkout
```

The README in `shimodocs/shimodocs` links to its own documentation with relative
paths, which GitHub renders as file views. Those links are the most valuable
inbound links the guides can have — the repository is where a reader arrives
first and it is crawled constantly — and every one of them currently points at a
blob page instead of the page. The script rewrites the English, German and
Japanese READMEs, which are the languages this site publishes, and leaves the
other translations alone rather than pointing them at pages that do not exist.
Every URL it writes is checked against the last build in `dist/`, so it fails on
a guide this site does not publish instead of shipping a 404.

The deployment-docs block sits between `<!-- deployment-docs:start -->` markers.
If something outside the product repository regenerates that block, the generator
needs the same change or the next run will put the file links back.

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

### Regenerating the web fonts

```bash
pip install fonttools brotli   # once
npm run fonts
```

`scripts/make-font-subsets.py` turns the design TTFs in `brand/fonts` into the
Latin-subset WOFF2 the browser loads: 392 KB of TTF becomes 125 KB, and the two
weights the home page preloads drop from 115 KB to 36 KB. Coverage is Latin,
Latin Extended and Vietnamese — the Japanese and Korean guides deliberately fall
back to the reader's system font rather than pulling a CJK web font in behind
them. The script compares each subset against the source font and fails if a
glyph the source carried was lost, so a range that is too narrow is caught here
instead of on somebody's page.

The full TTFs live in `brand/` rather than `public/assets` because
`scripts/make-assets.py` needs them to draw the Open Graph card while the
browser needs only the subsets; keeping the sources out of `public/` keeps 392 KB
out of every deploy.

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

## Documentation

The deployment, operations and troubleshooting guides are authored in
[shimodocs/shimodocs](https://github.com/shimodocs/shimodocs) and mirrored into
`content/docs` — 56 guides per language. The site is a consumer: nothing here
edits a guide.

```bash
npm run sync:docs          # copy the published trees out of the product repo
node scripts/sync-docs.mjs --check   # report drift and exit 1
```

`src/docs-languages.js` is the single switch: a language appears on the site only
if it is listed there, and `scripts/sync-docs.mjs` copies exactly that list.
Today that list is **English, German and Japanese** — a deliberate pilot rather
than a limit of the pipeline. The upstream translations are complete mirrors but
they are machine output, and at least one of them had damaged an instruction: a
dropped `+` inside an inline code span turned a topology line into
`3 master N worker` in the German and Japanese copies. Two markets with strong
self-hosting demand and thin English-language competition are enough to measure
whether translated documentation earns traffic before the other five are
switched on. Turning one on is a change to that array followed by
`npm run sync:docs`; the trees are not kept here while they are unpublished, so
they cannot silently rot.

`zh-CN` is deliberately absent — the Chinese documentation belongs to
shimo.net, and publishing it here would have the two domains compete for the
same queries.

Damage found in a translation that has to be published anyway is corrected in
`UPSTREAM_REPAIRS` (in `scripts/docs-content.mjs`) rather than by editing the
mirror, because the mirror is overwritten on the next sync. An entry that no
longer matches anything fails the build, so the table cannot outlive the bug it
works around.

### What the build guarantees for every guide

- A unique search title and description **within its language**. Comparing
  across languages would only flag translation, which is not a build failure;
  comparing within one is what stops two guides competing for the same query.
- A self-referencing canonical and `TechArticle` + `BreadcrumbList` structured
  data, with `inLanguage` set from the guide's own language.
- `hreflang` for every language that publishes that guide, including a
  self-reference and an `x-default` on the English version. The set is derived
  from what was actually synced, so a language never points at a page that does
  not exist.
- `<html lang="...">`, and a visible language row linking the same guide in the
  other languages.
- No client bundle. Guide pages are static HTML; only the English index
  hydrates, because it carries the search box.
- A link from that language's documentation index, so the tree is crawlable
  without going through a sitemap.

Internal links inside a guide are rewritten from repository paths to site
paths, and a link to a guide this site does not publish is dropped rather than
shipped as a dead anchor. GFM callouts (`> [!TIP]`) are rendered with their
label as real text, so they survive into a search snippet.

The direction that matters for ranking is the other one: every article points
at the runbooks that prove it. That mapping is editorial, in
`scripts/article-docs.mjs` — writing it beats matching on tags, which is how
you end up recommending Kubernetes under an article about retention policy.
The build fails if an id in it stops existing or if the link graph thins out.

### Sitemaps

`sitemap.xml` is a `<sitemapindex>`. The commercial pages live in
`sitemap-core.xml`, which is listed first so the first child a crawler fetches
after the index is the set of pages that carry the search demand; the rest of the
static pages are in `sitemap-pages.xml`, and there is one
`sitemap-docs-<language>.xml` per language, so Search Console reports index
coverage per language instead of as one lump where a single broken translation is
invisible. The index cannot list pages itself: a sitemap index may only contain
`<sitemap>` entries, and adding `<url>` to it invalidates the whole file.

Every entry carries a `lastmod` from the date its content changed — the commit
that last touched the guide Markdown for the documentation, `ROUTE_UPDATED` in
`src/seo.js` for the static pages, front matter for the articles — never the
build date. A lastmod that is always today is the same signal as no lastmod at
all. The build fails if a date is missing, malformed, in the future, or if the
whole site reports fewer than three distinct dates, which is what a build-clock
lastmod produces. Both workflows check out with `fetch-depth: 0` so the history
those dates come from is present.

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
