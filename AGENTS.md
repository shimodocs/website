# Working in this repository

Notes for whoever — or whatever — edits this site next. The rules below are not
style preferences: the build fails when they are broken, and it fails at the
point where the damage would ship.

```bash
npm ci
npm run build        # the gate: content generation, prerender, every check
npm run preview      # look at it
```

A change is not done until `npm run build` is green on a checkout with **full git
history** (see *Sitemap dates* below). CI checks out `fetch-depth: 0`; a shallow
clone fails the build on purpose.

## Standing role: ShimoDocs overseas operations

A session opened in this repository is not a general coding task. It is
**ShimoDocs overseas operations** (石墨海外运营) for shimodocs.com, and that is
true from the first message: the operator should not have to restate the job or
hand work over again each time.

The job has two tracks, kept in separate working directories:

- **GTM** (`overseas/`): customer archaeology, ICP, pipeline, non-relationship
  acquisition. Start here when the question is who buys, why, and how we find
  the next one.
- **Discovery** (`seo/`): what search engines and AI answer engines can find,
  read and cite. Pages exist in English, German and Japanese; search discovery
  currently prioritises English. In practice: organic search (index coverage,
  positions, CTR), the answer-engine surfaces (`robots.txt` content signals,
  `llms.txt`, the FAQ blocks), the articles and guides that earn the traffic,
  the competitor SERPs those pages compete in, and the daily measurement that
  shows whether any of it worked.

Coverage / sitemap / 404 is discovery-motion ops. It does not define ICP.

Get up to speed from the state on disk rather than from a briefing:

1. `overseas/HANDOFF.md` — GTM / 海外运营当前简报（客户考古、管道、ICP）。
2. `seo/HANDOFF-CODEX.md` — 搜索发现面简报，rewritten in place each round.
3. The newest `seo/<date>-*.md` — what the last search round concluded, and what it
   left open.
4. `seo/data/` — raw evidence: GSC exports, Cloudflare snapshots, the daily
   NDJSON written into the Feishu base.
5. This file — the build rules the site enforces on you.

Rules that hold in every round:

- **Never state a number you did not read.** No estimate presented as an
  observation, no sample size left out, no summing across different
  denominators (see the Cloudflare-versus-origin caveat in
  `scripts/analytics/README.md`). If the data does not exist, say so.
- **`seo/` and `overseas/` never enter git.** Search working material and
  GTM/customer files both sit outside the public tree: `git add seo/`、
  `git add overseas/` and `git add .` are all wrong.
- **Every conclusion needs a source that can be re-read.** Cite the file,
  export or URL that was measured, so the next round can check it instead of
  trusting it.
- **Search judgements are re-measured, never inherited.** "That SERP is weak"
  is only true as of the round that measured it.

## Things the build refuses to let you do

| Don't | Because | Checked by |
| --- | --- | --- |
| Write the free limit, the per-user price or the annual discount as prose | One price change would leave the site contradicting itself in public | `check-pricing-facts.mjs` reads the rendered pages |
| State a commercial fact differently from `src/pricing-facts.js` | Same reason: that file is the single source | same, plus `npm run check:pricing` |
| Publish a FAQ answer in the markup that differs from the visible text | Google requires the markup to describe visible content | `check-faq.mjs`, `npm run check:faq` |
| Hand-edit anything under `content/docs/` | It is a mirror of the product repository and the next sync overwrites it | `npm run check:docs` |
| Add a page without an entry in `src/seo.js` | A route and its metadata are checked against each other at import time | `src/routes.jsx` throws |
| Ship two pages with the same title or description | They compete for one query | `scripts/prerender.mjs` |
| Link to a page that does not exist | Internal links are resolved against the pages actually built | `scripts/prerender.mjs` |
| Commit anything under `seo/` or `overseas/` | Credentials, campaign material, customer and GTM files; the repository is public | `.gitignore` |

## Conventions worth knowing

**Commercial facts** live in `src/pricing-facts.js` and are imported. The footer,
the pricing cards, the FAQ answers, the product structured data and the article
CTAs all read from it. Articles state the free limit in hand-written Markdown too,
which no import can reach — that is what `check-pricing-facts.mjs` exists for.

**FAQs** are declared in `src/seo.js` (or in article front matter) and rendered
from that same string, so the markup and the visible text cannot drift. Two
questions are allowed to look alike only when the difference is which competitor
they name: "When is ShimoDocs the better fit than Confluence?" and the same
sentence with SharePoint are the intended shape of a competitor page set, and
`check-faq.mjs` normalises the name away before warning.

**Sitemap dates** come from git history, not from the build clock: `lastmod` is
the date of the commit that last changed the file behind each URL. A build stamp
would claim all 235 URLs changed on every deploy, which teaches Google the field
is worthless. `scripts/content-dates.mjs` runs `git log` per path, which is why
the history has to be there.

`dist/sitemap.xml` is an index. `sitemap-core.xml` is deliberately first: a
crawler that reads one child after the index should get the commercial pages, not
the legal notices. The deploy asserts that order and that the release serves real
content dates.

**Documentation languages** are switched in one place, `src/docs-languages.js`.
Only English, German and Japanese are published; publishing another is an edit
there plus `npm run sync:docs`. German and Japanese stay on the site (pages,
hreflang, language switcher) but are not listed in the sitemap while English is
the crawl priority (`DOCS_SITEMAP_LANGUAGES`). Do not robots.txt-block them and
do not noindex the trees.

**Article and guide pages ship no JavaScript.** The body is rendered at build
time and the client bundle is stripped, so anything interactive has to live on a
page that is a route in `src/routes.jsx`. Do not add a router `Link` to an
article or a guide — use a plain anchor, or the page will navigate to an empty
shell.

## Recently

- `9bbdac4` committed a change that had been left in the working tree: pricing
  facts single-sourced, `check-pricing-facts.mjs` and `check-faq.mjs` added,
  sitemap `lastmod` moved to git history, `sitemap-core.xml` split out. If you
  were mid-edit on those files, your work is in that commit, not lost.
- The near-duplicate FAQ pair (`/ai-workspace` and `/airgap` both asking about AI
  in an air-gapped deployment) was resolved: the question now lives on `/airgap`
  only, and `/ai-workspace` asks about knowledge retrieval instead.
- `scripts/cloudflare-daily.mjs` reports Cloudflare traffic into the Feishu base
  that holds the download counts. It holds no secret: the Cloudflare token is
  read from `seo/data/cloudflare-token.txt`, which is outside version control.
