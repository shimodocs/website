#!/usr/bin/env node
// Build-time prerenderer.
//
// The marketing site shipped as a client-rendered SPA, so every route served
// the same HTML shell: an empty <div id="root"></div> with one shared title.
// Crawlers saw no headings, no copy and no links.
//
// This renders each static route, plus every article in content/blog, to real
// HTML with route-specific head tags and structured data.
//
// Article pages are rendered with their body already inlined and then have the
// client bundle stripped. A 2,000-word article therefore costs the browser
// nothing to read, and because nothing hydrates an article there is no
// possibility of a hydration mismatch.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CATEGORIES, loadPosts, relatedPosts, toClientRecord } from './blog-content.mjs'
import {
  assertRepairsApplied,
  buildNav,
  docsIndexJsonLd,
  languagesByDocId,
  loadDocs,
  loadDocsByLanguage,
  loadDocsIndex,
  sortDocs,
  withNeighbours,
} from './docs-content.mjs'
import { ARTICLE_DOCS } from './article-docs.mjs'
import { auditFaqsInDirectory } from './check-faq.mjs'
import { auditFiguresInDirectory } from './check-figures.mjs'
import { auditPricingFactsInDirectory } from './check-pricing-facts.mjs'
import { contentDate } from './content-dates.mjs'
import { INDEXNOW_KEY, keyFileProblem } from './indexnow.mjs'
import { DOCS_DEFAULT_LANGUAGE, DOCS_LANGUAGES, DOCS_SITEMAP_LANGUAGES, docsBase } from '../src/docs-languages.js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(rootDir, 'dist')
const ssrDir = join(rootDir, 'dist-ssr')
const ssrEntry = join(ssrDir, 'entry-server.js')
const SEO_MARKER = '<!--seo-head-->'

if (!existsSync(ssrEntry)) {
  console.error(`Missing SSR bundle at ${ssrEntry}. Run "vite build --ssr src/entry-server.jsx" first.`)
  process.exit(1)
}

const ssr = await import(pathToFileURL(ssrEntry).href)
const {
  renderRoute,
  renderBlogPost,
  renderDoc,
  renderDocsIndex,
  ROUTE_PATHS,
  ROUTE_SEO,
  ROUTE_UPDATED,
  headFor,
  robotsTxt,
  AI_AND_SEARCH_CRAWLERS,
  sitemapUrlsetXml,
  sitemapIndexXml,
  SITE_URL,
  blogPostHead,
  blogFeedXml,
  blogIndexJsonLd,
  topicIndexJsonLd,
  docHead,
  docsIndexHead,
  absoluteUrl,
  escapeHtml,
} = ssr

const posts = loadPosts()
const docs = loadDocs(DOCS_DEFAULT_LANGUAGE)
const docNav = buildNav(docs, DOCS_DEFAULT_LANGUAGE)

// Every published language, loaded once. docsByLanguage is the source for the
// guide pages, the hreflang graph and the per-language sitemaps; keeping one
// copy means those three cannot disagree about what exists.
const docsByLanguage = loadDocsByLanguage()
const docLanguages = languagesByDocId(docsByLanguage)
const missingLanguages = DOCS_LANGUAGES.filter(
  language => language !== DOCS_DEFAULT_LANGUAGE && !docsByLanguage.has(language),
)
if (missingLanguages.length) {
  console.error(`Published languages with no content: ${missingLanguages.join(', ')}`)
  console.error('Run "node scripts/sync-docs.mjs" or remove them from src/docs-languages.js.')
  process.exit(1)
}
const invalidSitemapLanguages = DOCS_SITEMAP_LANGUAGES.filter(language => !DOCS_LANGUAGES.includes(language))
if (invalidSitemapLanguages.length) {
  console.error(`DOCS_SITEMAP_LANGUAGES names unpublished languages: ${invalidSitemapLanguages.join(', ')}`)
  process.exit(1)
}

// hreflang for one guide id in one language: every language that publishes the
// page, including the page itself, plus x-default on the English version.
function alternatesFor(id, language) {
  const languages = docLanguages.get(id) || [language]
  return [
    ...languages.map(code => ({ hreflang: code, href: absoluteUrl(docsUrl(code, id)) })),
    ...(languages.includes(DOCS_DEFAULT_LANGUAGE)
      ? [{ hreflang: 'x-default', href: absoluteUrl(docsUrl(DOCS_DEFAULT_LANGUAGE, id)) }]
      : []),
  ]
}

function docsUrl(language, id) {
  const base = docsBase(language)
  return id ? `${base}/${id}` : base
}

function docsIndexAlternates() {
  const languages = [...docsByLanguage.keys()]
  return [
    ...languages.map(code => ({ hreflang: code, href: absoluteUrl(docsBase(code)) })),
    ...(languages.includes(DOCS_DEFAULT_LANGUAGE)
      ? [{ hreflang: 'x-default', href: absoluteUrl(docsBase(DOCS_DEFAULT_LANGUAGE)) }]
      : []),
  ]
}

const templatePath = join(distDir, 'index.html')
if (!existsSync(templatePath)) {
  console.error(`Missing client build at ${templatePath}. Run "vite build" first.`)
  process.exit(1)
}
const template = readFileSync(templatePath, 'utf8')

const serialise = value => JSON.stringify(value).replace(/</g, '\\u003c')

// The rendered text is HTML-escaped; the structured-data copy of the same
// string is not. "Security & compliance" arrives as "Security &amp;
// compliance", and comparing the two without undoing that would report every
// ampersand as a mismatch.
function unescapeHtmlText(value) {
  return String(value)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
}

// Assembles a full document from the Vite template: route head, rendered body,
// and optionally no client bundle at all.
function documentFrom(head, body, { stripClientBundle = false, language = DOCS_DEFAULT_LANGUAGE } = {}) {
  let html = template
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>\s*/gi, '')
  html = html.replace(/<meta\s+name="description"[^>]*>\s*/gi, '')
  html = html.replace(/<meta\s+name="keywords"[^>]*>\s*/gi, '')

  // The template ships lang="en". A German page that announces itself as English
  // is the one language signal that overrides everything else on the page.
  if (language !== DOCS_DEFAULT_LANGUAGE) {
    html = html.replace('<html lang="en">', `<html lang="${language}">`)
  }

  if (html.includes(SEO_MARKER)) html = html.replace(SEO_MARKER, head)
  else html = html.replace('</head>', `${head}</head>`)

  if (!html.includes('<div id="root"></div>')) {
    throw new Error('Template is missing the empty #root container')
  }
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)

  if (stripClientBundle) {
    html = html.replace(/\s*<script type="module"[^>]*><\/script>/g, '')
    html = html.replace(/\s*<link rel="modulepreload"[^>]*>/g, '')
  }
  return html
}

function writeHtml(relativeFile, html) {
  const outPath = join(distDir, relativeFile)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, html)
  return relativeFile
}

// ------------------------------------------------------------ static routes

const written = []
for (const routePath of ROUTE_PATHS) {
  // Only the documentation index is translated, so it is the only static route
  // that carries hreflang links to the other languages.
  const options = routePath === '/docs' ? { alternates: docsIndexAlternates() } : {}
  let head = headFor(routePath, options)

  // The blog index also describes the collection and lists every article.
  if (routePath === '/blog' && posts.length) {
    head += `    <script type="application/ld+json" id="blog-index">${serialise(
      blogIndexJsonLd(posts),
    )}</script>\n  `
  }

  // The documentation index lists every guide, so it carries a CollectionPage
  // that names them all.
  if (routePath === '/docs' && docs.length) {
    head += `    <script type="application/ld+json" id="docs-index">${serialise(
      docsIndexJsonLd(docs, absoluteUrl, ROUTE_SEO['/docs'].description),
    )}</script>\n  `
  }

  // A topic page is a collection of articles on one subject, so it says so in
  // the same shape the documentation index uses.
  if (routePath.startsWith('/blog/category/')) {
    const id = routePath.split('/').pop()
    const category = CATEGORIES.find(entry => entry.id === id)
    const inCategory = posts.filter(post => post.category === id)
    if (category && inCategory.length) {
      head += `    <script type="application/ld+json" id="topic-index">${serialise(
        topicIndexJsonLd(category, inCategory),
      )}</script>\n  `
    }
  }

  const html = documentFrom(head, renderRoute(routePath))
  const file = routePath === '/' ? 'index.html' : `${routePath.slice(1)}/index.html`
  written.push({ route: routePath, file: writeHtml(file, html), bytes: Buffer.byteLength(html) })
}

// ------------------------------------------------------------------ articles

// Which guides each article links to. The mapping is editorial, so it is
// validated in the verification pass rather than trusted: an id that no longer
// exists upstream, or a slug that was renamed, would otherwise ship as a
// silently missing block.
const docsById = new Map(docs.map(doc => [doc.id, doc]))
const relatedDocsFor = slug => (ARTICLE_DOCS[slug] || []).map(id => docsById.get(id)).filter(Boolean)

const articles = []
posts.forEach((post, index) => {
  const older = posts[index + 1] || null
  const newer = posts[index - 1] || null
  const related = relatedPosts(post, posts)

  const body = renderBlogPost(post, related, older, newer, relatedDocsFor(post.slug))
  const html = documentFrom(blogPostHead(post), body, { stripClientBundle: true })
  const file = writeHtml(`blog/${post.slug}/index.html`, html)
  articles.push({ post, file, bytes: Buffer.byteLength(html) })
})

// ------------------------------------------------------------ documentation

// Each guide is a static page with its sidebar and table of contents already in
// the HTML, and with the client bundle stripped for the same reason the
// articles strip it: nothing on the page needs to hydrate.
const guides = []
const docIndexes = []
for (const [language, languageDocs] of docsByLanguage) {
  const nav = language === DOCS_DEFAULT_LANGUAGE ? docNav : buildNav(languageDocs, language)
  const ordered = withNeighbours(languageDocs)
  const groupIndex = new Map()
  for (const group of nav) {
    const index = group.docs.find(doc => doc.id === group.id)
    if (index) groupIndex.set(group.id, index)
  }

  for (const doc of ordered) {
    const groupId = doc.id.split('/').slice(0, 2).join('/')
    const index = groupIndex.get(groupId)
    const trail = doc.id && index && index.id !== doc.id ? [{ name: index.title, url: index.url }] : []
    const alternates = alternatesFor(doc.id, language)
    const html = documentFrom(
      docHead(doc, trail, { alternates }),
      renderDoc(doc, nav, doc.previous, doc.next, alternates),
      { stripClientBundle: true, language },
    )
    const file = writeHtml(`${doc.url.slice(1)}/index.html`, html)
    guides.push({ doc, file, bytes: Buffer.byteLength(html) })
  }

  // The English index is the hydrated route rendered above, with its search box.
  // A translated tree gets its own generated landing page instead, because the
  // guide list it needs is already static and shipping seven more copies of the
  // navigation in the client bundle would cost every visitor a download.
  if (language !== DOCS_DEFAULT_LANGUAGE) {
    const index = loadDocsIndex(language)
    const alternates = docsIndexAlternates()
    const html = documentFrom(
      docsIndexHead(index, languageDocs, { alternates }),
      renderDocsIndex(index, nav, languageDocs, alternates),
      { stripClientBundle: true, language },
    )
    const file = writeHtml(`${index.url.slice(1)}/index.html`, html)
    docIndexes.push({ index, file, bytes: Buffer.byteLength(html) })
  }
}

// --------------------------------------------------------------------- 404

// The 404 document gets its own head. Reusing the home page's head had it
// announce the home title and claim the home canonical, which is wrong for a
// document that must never be indexed: it carries a branded title, a short
// description, noindex, and deliberately no canonical at all.
const notFoundHead = [
  '<title>Page not found | ShimoDocs</title>',
  '<meta name="description" content="That page is not on this site. Head back to the ShimoDocs home page, or jump to the AI Workspace, pricing, the deployment guides or the blog archive."/>',
  '<meta name="robots" content="noindex, follow"/>',
  '<meta property="og:type" content="website"/>',
  '<meta property="og:site_name" content="ShimoDocs"/>',
  '<meta property="og:title" content="Page not found | ShimoDocs"/>',
  '<meta property="og:description" content="That page is not on this site."/>',
]
  .map(tag => `    ${tag}`)
  .join('\n')

const notFoundHtml = (() => {
  const body =
    '<div class="page"><section class="section page-intro not-found">' +
    '<div class="eyebrow">Error 404</div>' +
    '<h1>This page moved<br><span class="gradient">or never existed.</span></h1>' +
    '<p>Head back to the <a href="/">ShimoDocs home page</a>, or jump to ' +
    '<a href="/ai-workspace">AI Workspace</a>, <a href="/pricing">Pricing</a>, ' +
    '<a href="/help-center">Help Center</a> or the <a href="/blog">blog archive</a>.</p>' +
    '</section></div>'
  return documentFrom(notFoundHead, body)
})()
writeHtml('404.html', notFoundHtml)

// --------------------------------------------------------- crawler surfaces

writeFileSync(join(distDir, 'robots.txt'), robotsTxt())

// The blog feed. Discoverable from the archive and from every article, and
// listed in llms.txt, so an aggregator or an assistant polling for new work has
// one URL to watch.
writeFileSync(join(distDir, 'blog', 'feed.xml'), blogFeedXml(posts))

// ------------------------------------------------------------- sitemaps
//
// One urlset per content type, with the guides split again per language that
// is being submitted, and sitemap.xml as the index over them. Search Console
// then reports index coverage per language: with all 500 URLs in one file, a
// language whose translations Google refuses to index is invisible until the
// traffic numbers fail to appear.
//
// Not every published language is submitted. DOCS_SITEMAP_LANGUAGES is the
// list that goes into the index; German and Japanese stay on the site and in
// the hreflang graph but off the sitemap while English is the crawl priority.
//
// The commercial pages are their own file and the first <sitemap> in the index,
// so the first child a crawler fetches after the index is the set of pages that
// carry the site's search demand rather than the legal notices and the archive.
// They cannot be listed in sitemap.xml directly: a sitemap index may only
// contain <sitemap> entries, and mixing <url> into it makes the whole file
// invalid, which is how a site ends up with no sitemap at all.
const today = new Date().toISOString().slice(0, 10)
const postsLastmod = posts[0]?.date || today

// The pages that answer a buying question: what the product is, whether it runs
// where the reader needs it, what it replaces, how to move, and what it costs.
// Everything else on the site — the archive, its topic pages, the legal notices
// — is navigation or housekeeping and belongs in the file that follows.
const CORE_PATHS = [
  '/',
  '/ai-workspace',
  '/on-premises',
  '/airgap',
  '/security',
  '/solutions/atlassian-alternative',
  '/solutions/confluence-alternative',
  '/migration',
  '/pricing',
  '/download',
  '/comparison',
  '/docs',
  '/contact-sales',
  '/about',
]
for (const path of CORE_PATHS) {
  if (!ROUTE_PATHS.includes(path)) {
    console.error(`CORE_PATHS lists ${path}, which is not a declared route. Fix the list or the route table.`)
    process.exit(1)
  }
}
// A date for a route that no longer exists is a sign the table was not updated
// when the route went away. Every route being dated is checked below, where the
// entries are built.
for (const path of Object.keys(ROUTE_UPDATED)) {
  if (!ROUTE_PATHS.includes(path)) {
    console.error(`ROUTE_UPDATED dates ${path}, which is not a declared route. Remove the entry in src/seo.js.`)
    process.exit(1)
  }
}

// lastmod is the date the content changed, never the build date. The build date
// would claim all ~240 URLs changed on every deploy, which is the one thing a
// crawler cannot use.
//
// Checked as a real calendar date, not just the shape: "2026-02-31" matches the
// pattern and would be published as-is.
function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

function routeEntry(path) {
  const lastmod = ROUTE_UPDATED[path]
  if (!isIsoDate(lastmod)) {
    console.error(`ROUTE_UPDATED has no YYYY-MM-DD date for ${path}. Add one in src/seo.js.`)
    process.exit(1)
  }
  return {
    loc: absoluteUrl(path),
    lastmod,
    changefreq: ROUTE_SEO[path].changeFrequency,
    priority: ROUTE_SEO[path].priority,
    // The product screenshots, listed against the pages that display them, so
    // image search has a reason to index them under this domain. Only the
    // pages that really show them carry them: an image sitemap that claims
    // images a page does not have is a spam signal, not a shortcut.
    //
    // Six, not seven. The seventh screenshot belongs to the workflow carousel,
    // which renders one scene at a time, so it is not in the served HTML and
    // listing it would be the overstatement this rule exists to prevent.
    images:
      path === '/'
        ? Array.from({ length: 6 }, (unused, index) => absoluteUrl(`/assets/extract-${index + 1}.webp`))
        : path === '/download'
          ? [absoluteUrl('/assets/workspace-recent-files.webp')]
          : path === '/comparison'
            ? [absoluteUrl('/assets/workspace-collaboration.webp')]
            : [],
  }
}

// A guide's date is the date of the commit that last changed that Markdown file,
// including the translation: the German page changed when the German page
// changed, not when the English one did.
function docLastmod(doc) {
  const date = contentDate(doc.file)
  if (!date) {
    console.error(`${doc.file} has no lastmod date: the file is missing, or the build has no git history`)
    process.exit(1)
  }
  return date
}

const sitemapFiles = [
  {
    // First in the index on purpose. Keep it that way: this is the file the
    // crawler reads first after the index.
    name: 'sitemap-core.xml',
    entries: CORE_PATHS.map(routeEntry),
  },
  {
    name: 'sitemap-pages.xml',
    entries: ROUTE_PATHS.filter(path => !CORE_PATHS.includes(path)).map(routeEntry),
  },
  {
    name: 'sitemap-blog.xml',
    entries: posts.map(post => ({
      loc: absoluteUrl(`/blog/${post.slug}`),
      lastmod: post.updated || post.date,
      changefreq: 'monthly',
      priority: '0.6',
    })),
  },
  ...DOCS_SITEMAP_LANGUAGES.filter(language => docsByLanguage.has(language)).map(language => ({
    name: `sitemap-docs-${language}.xml`,
    entries: [
      // A translated index is a generated page, not a route, so it lives here.
      // The English one is a route and is already in sitemap-pages.xml.
      ...(language === DOCS_DEFAULT_LANGUAGE
        ? []
        : [
            {
              loc: absoluteUrl(docsBase(language)),
              lastmod: docLastmod(loadDocsIndex(language)),
              changefreq: 'monthly',
              priority: '0.9',
            },
          ]),
      ...sortDocs(docsByLanguage.get(language)).map(doc => ({
        loc: absoluteUrl(doc.url),
        lastmod: docLastmod(doc),
        changefreq: 'monthly',
        // The overview and the deployment index are the doorways into the
        // guide tree; individual runbooks are supporting pages.
        priority: doc.id === '' ? '0.9' : doc.id === 'deployment' ? '0.8' : '0.6',
      })),
    ],
  })),
]

// The index reports each child's own newest date, so it does not claim the blog
// changed when only a guide did.
function newestLastmod(entries) {
  return entries.reduce((newest, entry) => (entry.lastmod > newest ? entry.lastmod : newest), '')
}

for (const file of sitemapFiles) {
  file.lastmod = newestLastmod(file.entries)
  writeFileSync(join(distDir, file.name), sitemapUrlsetXml(file.entries, file.lastmod))
}

writeFileSync(
  join(distDir, 'sitemap.xml'),
  sitemapIndexXml(
    sitemapFiles.map(file => ({ loc: absoluteUrl(`/${file.name}`), lastmod: file.lastmod })),
    today,
  ),
)

rmSync(ssrDir, { recursive: true, force: true })

// ------------------------------------------------------------------ llms.txt

// A curated index for AI crawlers and assistants. Every URL on it is a page
// that was actually prerendered, and the ordering follows the order a reader
// would use rather than the order files happen to sit on disk.
function llmsTxt() {
  const productPages = [
    ['/', 'ShimoDocs', 'product overview: what ShimoDocs is and how self-hosting works'],
    ['/ai-workspace', 'AI Workspace', 'AI agents that edit inside documents, with visible history and human review'],
    ['/on-premises', 'On-premises document collaboration', 'what running the suite on your own servers requires'],
    ['/airgap', 'Air-gapped document collaboration', 'offline installation and AI inference inside an isolated network'],
    ['/security', 'Security and data control', 'where documents live, who can reach them, what leaves the network, and who owns each control'],
    ['/solutions/atlassian-alternative', 'Atlassian alternative', 'the 2026 data contribution default, the Data Center end-of-life schedule, and what a replacement covers'],
    ['/solutions/confluence-alternative', 'Confluence alternative', 'cloud, Data Center and self-hosted options compared, plus the migration steps that decide the schedule'],
    ['/migration', 'Document platform migration', 'what imports, what has to be rebuilt, how permissions map, and how to verify the move before cutover'],
    ['/comparison', 'Platform comparison', 'ShimoDocs compared with Google Workspace, Microsoft 365, Nextcloud and ONLYOFFICE'],
    ['/pricing', 'Pricing', 'free for teams of up to five people; $5 per user per month above that'],
    ['/download', 'Download', 'self-hosted installer for Linux amd64 and arm64, plus the free licence request'],
    ['/docs', 'Documentation', 'deployment, operations and troubleshooting guides'],
    ['/blog', 'Blog', 'guides and analysis on private cloud collaboration and document security'],
    ['/about', 'About ShimoDocs', 'the company behind ShimoDocs'],
    ['/contact-sales', 'Contact sales', 'deployment, migration and security-review enquiries'],
  ]

  const sections = [['Product', productPages.map(([path, title, note]) => [`${SITE_URL}${path}`, title, note])]]

  const guideLines = sortDocs(docs).map(doc => [absoluteUrl(doc.url), doc.title, doc.description])
  const articleLines = posts.map(post => [absoluteUrl(`/blog/${post.slug}`), post.title, post.description])

  const render = ([url, title, note]) => `- [${title}](${url})${note ? `: ${note}` : ''}`

  const lines = [
    '# ShimoDocs',
    '',
    '> ShimoDocs is a self-hosted document collaboration suite — real-time docs, writers, spreadsheets,',
    '> presentations, forms and tables — deployed into infrastructure you control, with AI agents that',
    '> work inside documents against a model endpoint your organisation has approved.',
    '',
    'ShimoDocs runs in a single-node or high-availability Kubernetes cluster. Documents, metadata,',
    'permissions, audit logs and AI context stay inside the customer network boundary. It is free for',
    'teams of up to five people, and self-hosted deployments are licensed per user above that.',
    'The product documentation is published on this site at /docs.',
    '',
  ]

  for (const [heading, entries] of sections) {
    lines.push(`## ${heading}`, '', ...entries.map(render), '')
  }

  lines.push('## Documentation', '', ...guideLines.map(render), '')
  lines.push('## Blog', '', ...articleLines.map(render), '')

  lines.push(
    '## Optional',
    '',
    render([`${SITE_URL}/sitemap.xml`, 'XML sitemap', 'every indexable URL on this site']),
    render([`${SITE_URL}/blog/feed.xml`, 'Blog feed', 'RSS, newest first']),
    render([`${SITE_URL}/about`, 'About ShimoDocs', 'company background']),
    render([GITHUB_REPO, 'ShimoDocs on GitHub', 'product repository and issue tracker']),
    '',
  )

  return lines.join('\n')
}

const GITHUB_REPO = 'https://github.com/shimodocs/shimodocs'

writeFileSync(join(distDir, 'llms.txt'), llmsTxt())

// ---------------------------------------------------------------- reporting

console.log(`Prerendered ${written.length} static routes for ${SITE_URL}`)
for (const entry of written) {
  console.log(`  ${entry.route.padEnd(16)} -> dist/${entry.file} (${(entry.bytes / 1024).toFixed(1)} kB)`)
}
console.log(`Prerendered ${articles.length} articles`)
for (const entry of articles) {
  console.log(
    `  ${entry.post.slug.padEnd(50)} ${(entry.bytes / 1024).toFixed(1).padStart(6)} kB  ${String(
      entry.post.words,
    ).padStart(5)} words`,
  )
}
console.log(
  `Prerendered ${guides.length} documentation guides across ${docsByLanguage.size} languages ` +
    `(${[...docsByLanguage.keys()].join(', ')})`,
)
for (const entry of guides.slice(0, 6)) {
  console.log(
    `  ${`${entry.doc.language}/${entry.doc.id}`.padEnd(58)} ${(entry.bytes / 1024).toFixed(1).padStart(6)} kB  ${String(
      entry.doc.words,
    ).padStart(5)} words`,
  )
}
if (guides.length > 6) console.log(`  ... and ${guides.length - 6} more`)
if (docIndexes.length) {
  console.log(`  ${docIndexes.length} translated documentation indexes`)
}
console.log(`  ${'404'.padEnd(16)} -> dist/404.html`)
console.log(`  ${'robots.txt'.padEnd(16)} -> dist/robots.txt`)
console.log(`  ${'llms.txt'.padEnd(16)} -> dist/llms.txt`)
for (const file of sitemapFiles) {
  console.log(`  ${file.name.padEnd(24)} -> ${file.entries.length} urls`)
}
console.log(`  ${'sitemap.xml'.padEnd(24)} -> index over ${sitemapFiles.length} sitemaps`)
console.log(`  ${'urls in sitemaps'.padEnd(24)} -> ${sitemapFiles.reduce((sum, file) => sum + file.entries.length, 0)}`)

// ------------------------------------------------------------- verification

function prerenderedMarkup(html) {
  const start = html.indexOf('<div id="root">')
  const end = html.indexOf('</body>')
  if (start === -1 || end === -1 || end <= start) return ''
  return html.slice(start, end)
}

const LAYOUTS_WITH_TOC = ['standard', 'briefing']
const ALL_LAYOUTS = ['standard', 'feature', 'briefing', 'magazine']

const problems = []

// The upstream-repair table is a workaround for damage in the translated source.
// It must actually be doing something, or it is either stale or silently failing
// to protect the pages it was written for.
problems.push(...assertRepairsApplied())

// Articles must not all share one template. Enforced rather than trusted.
const layoutCounts = new Map()
for (const post of posts) layoutCounts.set(post.layout, (layoutCounts.get(post.layout) || 0) + 1)
if (posts.length >= 4) {
  for (const layout of ALL_LAYOUTS) {
    const count = layoutCounts.get(layout) || 0
    if (count === 0) problems.push(`layout "${layout}" is never used`)
    if (count / posts.length > 0.4) {
      problems.push(`layout "${layout}" is used by ${count}/${posts.length} articles, above the 40% ceiling`)
    }
  }
}

for (const routePath of ROUTE_PATHS) {
  const file = routePath === '/' ? 'index.html' : `${routePath.slice(1)}/index.html`
  const html = readFileSync(join(distDir, file), 'utf8')
  const markup = prerenderedMarkup(html)
  const meta = ROUTE_SEO[routePath]
  if (markup.length < 2000) problems.push(`${routePath}: prerendered markup is only ${markup.length} chars`)
  if (!/<h1[\s>]/.test(html)) problems.push(`${routePath}: no <h1>`)
  // headFor escapes the title into HTML, so a title containing "&" arrives as
  // "&amp;". Compare against the escaped form or every ampersand reads as a
  // missing title.
  if (!html.includes(`<title>${escapeHtml(meta.title)}</title>`)) problems.push(`${routePath}: title not injected`)
  if (!html.includes('rel="canonical"')) problems.push(`${routePath}: no canonical link`)
  if (!html.includes('application/ld+json')) problems.push(`${routePath}: no structured data`)
  // The FAQ surface is verified once, for every page, by scripts/check-faq.mjs
  // after the build has written them all. It checks the questions *and* the
  // answers against the rendered text, which is the half a check inside this
  // loop cannot do safely: the answer also exists in the JSON-LD of this same
  // document, so searching the raw HTML for it would always succeed.
  const titleTags = html.match(/<title>/g)
  if (!titleTags || titleTags.length !== 1) problems.push(`${routePath}: expected exactly one <title>`)
}

// Distinct titles and descriptions, or pages compete with each other.
//
// Scoped per language. Two English pages must not chase the same query, but a
// German page is *supposed* to differ from its English original, so comparing
// across languages would only flag translation, which is not a build failure.
function duplicates(values) {
  const seen = new Set()
  const repeated = new Set()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated]
}

const englishTitles = ROUTE_PATHS.map(path => ROUTE_SEO[path].title)
  .concat(posts.map(post => post.seoTitle))
  .concat(docs.map(doc => doc.seoTitle))
const duplicateTitles = duplicates(englishTitles)
if (duplicateTitles.length) {
  problems.push(`duplicate English titles: ${duplicateTitles.slice(0, 3).join(' | ')}`)
}
const englishDescriptions = ROUTE_PATHS.map(path => ROUTE_SEO[path].description)
  .concat(posts.map(post => post.description))
  .concat(docs.map(doc => doc.description))
const duplicateDescriptions = duplicates(englishDescriptions)
if (duplicateDescriptions.length) {
  problems.push(`duplicate English descriptions: ${duplicateDescriptions.slice(0, 3).join(' | ')}`)
}

const indexByLanguage = new Map(docIndexes.map(entry => [entry.index.language, entry.index]))
for (const [language, languageDocs] of docsByLanguage) {
  if (language === DOCS_DEFAULT_LANGUAGE) continue
  const index = indexByLanguage.get(language)
  const titles = languageDocs.map(doc => doc.seoTitle).concat(index ? [index.seoTitle] : [])
  const descriptions = languageDocs.map(doc => doc.description).concat(index ? [index.description] : [])
  const repeatedTitles = duplicates(titles)
  const repeatedDescriptions = duplicates(descriptions)
  if (repeatedTitles.length) problems.push(`${language}: duplicate titles: ${repeatedTitles.slice(0, 3).join(' | ')}`)
  if (repeatedDescriptions.length) {
    problems.push(`${language}: duplicate descriptions: ${repeatedDescriptions.slice(0, 3).join(' | ')}`)
  }
  if (index && !index.description.trim()) problems.push(`${language}: the documentation index has no description`)
}

for (const routePath of ROUTE_PATHS) {
  const meta = ROUTE_SEO[routePath]
  if (meta.title.length > 62) problems.push(`${routePath}: title is ${meta.title.length} chars (max 62)`)
  if (meta.description.length > 160) {
    problems.push(`${routePath}: description is ${meta.description.length} chars (max 160)`)
  }
  if (meta.description.length < 110) {
    problems.push(`${routePath}: description is only ${meta.description.length} chars`)
  }
}

// ---------------------------------------------------- guide verification

// The English index is a route rendered above; a translated tree's index is
// generated by the documentation loop, so the two are verified together from
// one list.
const docsIndexFiles = [
  { language: DOCS_DEFAULT_LANGUAGE, file: 'docs/index.html' },
  ...docIndexes.map(entry => ({ language: entry.index.language, file: entry.file })),
]

const titleLengthWarnings = []

for (const { doc, file } of guides) {
  const html = readFileSync(join(distDir, file), 'utf8')
  const markup = prerenderedMarkup(html)
  const label = doc.id ? `${doc.language}/${doc.id}` : `${doc.language}/docs`

  if (markup.length < 4000) problems.push(`${label}: guide markup is only ${markup.length} chars`)
  if (!html.includes(`<title>${escapeHtml(doc.seoTitle)}</title>`)) {
    problems.push(`${label}: search title not injected`)
  }
  if (!html.includes(`<link rel="canonical" href="${absoluteUrl(doc.url)}"`)) {
    problems.push(`${label}: canonical link is missing or wrong`)
  }
  if (!html.includes('"TechArticle"')) problems.push(`${label}: no TechArticle structured data`)
  if (!html.includes('"BreadcrumbList"')) problems.push(`${label}: no breadcrumb structured data`)
  if (/<script type="module"/.test(html)) {
    problems.push(`${label}: guide page still ships the client bundle`)
  }
  const h1s = html.match(/<h1[\s>]/g)
  if (!h1s || h1s.length !== 1) {
    problems.push(`${label}: expected exactly one <h1>, found ${h1s ? h1s.length : 0}`)
  }
  // The body has to be in the document, not deferred to the client.
  if (doc.headings.length && !html.includes(`id="${doc.headings[0].id}"`)) {
    problems.push(`${label}: first heading is missing from the static HTML`)
  }
  // A translated page that announces itself as English hands Google the one
  // signal that overrides the hreflang graph.
  if (!html.includes(`<html lang="${doc.language}">`)) {
    problems.push(`${label}: html lang is not "${doc.language}"`)
  }
  // The hreflang set has to name every language that publishes this guide,
  // including the page itself, plus x-default on the English version. A missing
  // return tag makes Google drop the whole cluster.
  const expected = alternatesFor(doc.id, doc.language)
  const seen = [...html.matchAll(/rel="alternate" hreflang="([^"]+)"/g)].map(match => match[1])
  if (seen.length !== expected.length) {
    problems.push(`${label}: ${seen.length} hreflang links, expected ${expected.length}`)
  }
  for (const alternate of expected) {
    if (!seen.includes(alternate.hreflang)) problems.push(`${label}: hreflang "${alternate.hreflang}" is missing`)
    if (!html.includes(`href="${alternate.href}"`)) problems.push(`${label}: hreflang ${alternate.hreflang} points elsewhere`)
  }
  // Every guide carries the full sidebar, which is what makes the tree
  // crawlable from any entry point.
  const base = docsBase(doc.language)
  const sidebarLinks = (html.match(new RegExp(`href="${base}(/|")`, 'g')) || []).length
  if (sidebarLinks < 20) problems.push(`${label}: sidebar only links ${sidebarLinks} guides`)
  // Search results truncate around 62 characters. Only English is enforced,
  // because German and Thai legitimately need more room for the same heading.
  if (doc.language === DOCS_DEFAULT_LANGUAGE && doc.seoTitle.length > 62) {
    problems.push(`${label}: title is ${doc.seoTitle.length} chars (max 62)`)
  } else if (doc.seoTitle.length > 90) {
    titleLengthWarnings.push(`${label}: title is ${doc.seoTitle.length} chars`)
  }
}

// Every internal guide link has to resolve to a page this build produced. The
// translations are complete mirrors today, but a guide that exists in English
// and not in German would otherwise ship as a dead anchor on 55 pages.
const publishedByLanguage = new Map()
for (const [language, languageDocs] of docsByLanguage) {
  publishedByLanguage.set(language, new Set([docsBase(language), ...languageDocs.map(doc => doc.url)]))
}

for (const { doc, file } of guides) {
  const html = readFileSync(join(distDir, file), 'utf8')
  const published = publishedByLanguage.get(doc.language)
  const base = docsBase(doc.language)
  for (const match of html.matchAll(new RegExp(`href="(${base}/[^"#]*)"`, 'g'))) {
    if (!published.has(match[1])) problems.push(`${doc.language}/${doc.id}: links to ${match[1]}, which is not a guide`)
  }
}

// The documentation index must link every guide with real anchor text, so the
// tree is reachable by crawling rather than only through the sitemap.
for (const { language, file } of docsIndexFiles) {
  const html = readFileSync(join(distDir, file), 'utf8')
  const markup = prerenderedMarkup(html)
  if (markup.length < 4000) problems.push(`${language}/docs index: markup is only ${markup.length} chars`)
  if (!html.includes('"CollectionPage"')) problems.push(`${language}/docs index: no CollectionPage structured data`)
  if (!html.includes('hreflang="x-default"')) problems.push(`${language}/docs index: no x-default hreflang`)
  for (const doc of docsByLanguage.get(language) || []) {
    if (!html.includes(`href="${doc.url}"`)) problems.push(`${language}/docs index does not link ${doc.url}`)
  }
  if (language !== DOCS_DEFAULT_LANGUAGE) {
    // The translated indexes are generated static pages, not hydrated routes.
    if (/<script type="module"/.test(html)) problems.push(`${language}/docs index still ships the client bundle`)
    if (!html.includes(`<html lang="${language}">`)) problems.push(`${language}/docs index: html lang is not "${language}"`)
    if (!html.includes(`<link rel="canonical" href="${absoluteUrl(docsBase(language))}"`)) {
      problems.push(`${language}/docs index: canonical link is missing or wrong`)
    }
  }
}

// The help centre used to send every documentation link to github.com. It now
// points at the guides on this site, so every /docs link it emits has to resolve
// to a page that was actually prerendered.
const publishedDocUrls = new Set(docs.map(doc => doc.url))
const helpHtml = readFileSync(join(distDir, 'help-center', 'index.html'), 'utf8')
const helpDocLinks = new Set([...helpHtml.matchAll(/href="(\/docs\/[^"#]*)"/g)].map(match => match[1]))
if (helpDocLinks.size !== publishedDocUrls.size) {
  problems.push(
    `help-center: ${helpDocLinks.size} links into the published guides, expected ${publishedDocUrls.size}`,
  )
}
for (const href of helpDocLinks) {
  if (!publishedDocUrls.has(href)) problems.push(`help-center: ${href} does not match any published guide`)
}

// ------------------------------------------------------ internal link crawl

// Every internal link on every generated page has to resolve to a file this
// build produced. The per-section checks above prove that guides link to
// guides and that the indexes link everything; this is the net underneath them,
// and it is what catches a footer, a hub page or a call to action pointing at a
// page that was renamed or never existed. With 495 pages in eight languages a
// dead link is otherwise found by a reader.
const siteFiles = new Set()
for (const entry of readdirSync(distDir, { recursive: true })) {
  const relativePath = String(entry)
  siteFiles.add(`/${relativePath.split(sep).join('/')}`)
}

function resolves(href) {
  const path = href.split('#')[0].split('?')[0]
  if (!path) return true
  if (path.endsWith('/')) return siteFiles.has(`${path}index.html`) || siteFiles.has(path.slice(0, -1))
  return siteFiles.has(path) || siteFiles.has(`${path}/index.html`)
}

const linkProblems = new Map()
let linksChecked = 0
let htmlPagesCrawled = 0
for (const htmlFile of [...siteFiles].filter(file => file.endsWith('.html'))) {
  const html = readFileSync(join(distDir, htmlFile.slice(1)), 'utf8')
  htmlPagesCrawled += 1
  if (/<meta\s+name=["']keywords["']/i.test(html)) {
    problems.push(`${htmlFile}: emits unsupported meta keywords; keep target terms in visible content and structured data`)
  }
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1]
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(href)) continue
    if (!href.startsWith('/')) continue
    linksChecked += 1
    if (resolves(href)) continue
    // One line per distinct broken target rather than per page that links it:
    // the footer alone would otherwise report the same dead link 495 times.
    if (!linkProblems.has(href)) linkProblems.set(href, htmlFile)
  }
}
for (const [href, source] of linkProblems) {
  problems.push(`${source} links to ${href}, which this build did not produce`)
}

// ------------------------------------------------------- topic page checks

// A topic page that stops listing its own articles, or loses the guides behind
// them, still looks fine in a browser: it just becomes a thin page ranking for a
// query it no longer answers. Both are checked, along with the link from the
// archive that makes the page reachable by crawling at all.
for (const path of ROUTE_PATHS.filter(entry => entry.startsWith('/blog/category/'))) {
  const id = path.split('/').pop()
  const html = readFileSync(join(distDir, `${path.slice(1)}/index.html`), 'utf8')
  const inCategory = posts.filter(post => post.category === id)
  if (!inCategory.length) problems.push(`${path}: no articles in category ${id}`)
  for (const post of inCategory) {
    if (!html.includes(`href="/blog/${post.slug}"`)) problems.push(`${path} does not link /blog/${post.slug}`)
  }
  const topicDocLinks = new Set([...html.matchAll(/href="(\/docs\/[^"#]*)"/g)].map(match => match[1]))
  if (topicDocLinks.size < 2) problems.push(`${path} links only ${topicDocLinks.size} documentation guides`)
  if (!html.includes('rel="canonical"')) problems.push(`${path}: no canonical link`)
  if (!/application\/ld\+json/.test(html)) problems.push(`${path}: no structured data`)
  // The page is a collection of articles on one subject, and the structured
  // data has to say so about every one of them: a CollectionPage that quietly
  // stopped listing its parts would still render correctly in a browser.
  const topicScript = (html.match(/<script type="application\/ld\+json" id="topic-index">([\s\S]*?)<\/script>/) || [, ''])[1]
  if (!topicScript) {
    problems.push(`${path}: no CollectionPage structured data`)
  } else {
    const collection = JSON.parse(topicScript)
    if (collection['@type'] !== 'CollectionPage') {
      problems.push(`${path}: topic structured data is ${collection['@type']}, not CollectionPage`)
    }
    const listed = (collection.hasPart || []).length
    if (listed !== inCategory.length) {
      problems.push(`${path}: CollectionPage lists ${listed} of ${inCategory.length} articles`)
    }
  }
  // The breadcrumb in the markup has to be the breadcrumb the page prints.
  const visibleCrumb = unescapeHtmlText(
    (html.match(/<span class="breadcrumb-current">([\s\S]*?)<\/span>/) || [, ''])[1],
  ).trim()
  const graph = (html.match(/<script type="application\/ld\+json" id="structured-data">([\s\S]*?)<\/script>/) || [, ''])[1]
  const trail = (JSON.parse(graph)['@graph'] || [])
    .find(node => node['@type'] === 'BreadcrumbList')
    ?.itemListElement.map(item => item.name) || []
  const expectedTrail = ['Home', 'Blog', visibleCrumb]
  if (trail.join(' / ') !== expectedTrail.join(' / ')) {
    problems.push(`${path}: breadcrumb reads "${trail.join(' / ')}" but the page prints "${expectedTrail.join(' / ')}"`)
  }
  // The topic page's headline has to be the search term, not the navigation
  // label. When it was the label the page answered "Self-hosting" in its <h1>
  // and "Self-Hosted Document Collaboration" in its <title>, which is two
  // different answers to the same crawler, and six pages nobody clicked.
  const category = CATEGORIES.find(entry => entry.id === id)
  if (!category?.heading) {
    problems.push(`${path}: category ${id} declares no heading`)
  } else {
    if (category.heading === category.label) {
      problems.push(`${path}: heading repeats the nav label "${category.label}"; it has to carry the search term`)
    }
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1].replace(/\s+/g, ' ').trim()
    if (!h1.includes(category.heading)) {
      problems.push(`${path}: <h1> reads "${h1}", which does not contain "${category.heading}"`)
    }
  }
}

// ------------------------------------------------------ article verification

// The editorial article → guide mapping has to keep pointing at real pages, and
// the link graph has to stay worth having. Both are checked here because a
// mapping that quietly emptied out would fail nothing else.
for (const [slug, ids] of Object.entries(ARTICLE_DOCS)) {
  if (!posts.some(post => post.slug === slug)) {
    console.warn(`  warning: ARTICLE_DOCS has an entry for "${slug}", which is not a published article`)
  }
  for (const id of ids) {
    if (!docsById.has(id)) problems.push(`ARTICLE_DOCS["${slug}"] points at "${id}", which is not a guide`)
  }
}

const articlesLinkingDocs = articles.filter(entry => relatedDocsFor(entry.post.slug).length > 0)
if (articlesLinkingDocs.length < posts.length * 0.8) {
  problems.push(
    `only ${articlesLinkingDocs.length}/${posts.length} articles link into the documentation; ` +
      'the guides depend on that internal link graph for discovery',
  )
}
const guidesLinkedFromArticles = new Set(
  articles.flatMap(entry => relatedDocsFor(entry.post.slug).map(doc => doc.id)),
)
if (guidesLinkedFromArticles.size < 8) {
  problems.push(`only ${guidesLinkedFromArticles.size} distinct guides are linked from articles`)
}

for (const { post, file } of articles) {
  const html = readFileSync(join(distDir, file), 'utf8')
  const markup = prerenderedMarkup(html)

  if (markup.length < 6000) problems.push(`${post.slug}: article markup is only ${markup.length} chars`)
  if (!html.includes(`<title>${escapeHtml(post.seoTitle)}</title>`)) problems.push(`${post.slug}: search title not injected`)
  if (!/<h1[\s>]/.test(html)) problems.push(`${post.slug}: no <h1>`)
  if (!html.includes(`<link rel="canonical" href="${absoluteUrl(`/blog/${post.slug}`)}"`)) {
    problems.push(`${post.slug}: canonical link is missing or wrong`)
  }
  if (!html.includes('"BlogPosting"')) problems.push(`${post.slug}: no BlogPosting structured data`)
  if (!html.includes('"BreadcrumbList"')) problems.push(`${post.slug}: no breadcrumb structured data`)
  // An article that declares FAQs is checked with every other page by
  // scripts/check-faq.mjs, which also proves each answer is the string the
  // reader can see. Asking only whether "FAQPage" appears here was the weaker
  // half of that check and hid the failure it was meant to catch.
  // Only the layouts that ship a table of contents are expected to link their
  // headings. Feature and magazine deliberately have none, which is the point
  // of having more than one layout.
  const firstH2 = post.headings.find(heading => heading.level === 2)
  if (LAYOUTS_WITH_TOC.includes(post.layout) && firstH2 && !html.includes(`href="#${firstH2.id}"`)) {
    problems.push(`${post.slug}: ${post.layout} layout is missing its table of contents`)
  }
  if (!html.includes(`data-layout="${post.layout}"`)) {
    problems.push(`${post.slug}: rendered markup is not tagged with layout "${post.layout}"`)
  }
  if (!/<figure class="fig\b/.test(html)) {
    problems.push(`${post.slug}: no figure rendered`)
  }
  // The body must be real HTML in the document, not deferred to the client.
  // Checked via the heading anchor id rather than its text, because the
  // typographer converts straight quotes to curly ones in the rendered output.
  const firstHeading = post.headings[0]
  if (!firstHeading || !html.includes(`id="${firstHeading.id}"`)) {
    problems.push(`${post.slug}: first heading is missing from the static HTML`)
  }
  if (/<script type="module"/.test(html)) {
    problems.push(`${post.slug}: article page still ships the client bundle`)
  }
  // Internal linking is the whole point of a content cluster.
  const inbound = (html.match(/href="\/blog\/[a-z0-9-]+"/g) || []).length
  if (inbound < 5) problems.push(`${post.slug}: only ${inbound} internal blog links`)
  if (post.words < 1000) problems.push(`${post.slug}: only ${post.words} words`)
}

// Home hero carries the two ways to get the product.
const homeHtml = readFileSync(join(distDir, 'index.html'), 'utf8')
if (!/releases\/latest\/download\/mdp-installer-amd64/.test(homeHtml)) {
  problems.push('home: installer download link is missing')
}
if (!/mailto:support\.global@shimo\.im/.test(homeHtml)) {
  problems.push('home: free licence request link is missing')
}

// The contact page deliberately asks for one visible field only. Keep that
// low-friction contract in the prerendered markup; the endpoint is checked in
// the client bundle because the form cannot submit without it.
const contactHtml = readFileSync(join(distDir, 'contact-sales', 'index.html'), 'utf8')
if (!contactHtml.includes('id="contact-email"')) problems.push('contact-sales: the form is missing #contact-email')
for (const marker of ['contact-name', 'contact-team-size', 'contact-inquiry-type', 'contact-environment', 'contact-timeline', 'contact-message']) {
  if (contactHtml.includes(`id="${marker}"`)) problems.push(`contact-sales: the low-friction form unexpectedly includes #${marker}`)
}
if (!/<button class="button" type="submit"/.test(contactHtml)) {
  problems.push('contact-sales: the submit button is missing')
}
if (!process.env.VITE_CONTACT_ENDPOINT) {
  const bundles = readdirSync(join(distDir, 'assets'))
    .filter(name => name.endsWith('.js'))
    .map(name => readFileSync(join(distDir, 'assets', name), 'utf8'))
    .join('\n')
  if (!bundles.includes('app.teable.ai/api/share/')) {
    problems.push('contact-sales: no client bundle points at the Teable form endpoint')
  }
}

// Article pages are standalone documents with no client bundle, so nothing in
// the React app may navigate to one with a router Link: the router would match
// no route and silently render an empty page. Caught in source because the
// prerendered markup looks identical either way.
const reactSources = readdirSync(join(rootDir, 'src'), { recursive: true })
  .map(entry => String(entry))
  .filter(name => /\.jsx?$/.test(name))
for (const name of reactSources) {
  const source = readFileSync(join(rootDir, 'src', name), 'utf8')
  if (/to=\{`\/blog\/|to="\/blog\/|to=\{`\/docs\/|to="\/docs\//.test(source)) {
    problems.push(`src/${name} routes to an article or guide with a router Link; use a plain anchor instead`)
  }
}

// The blog index must link every article, so the archive is reachable by
// crawling rather than only through the sitemap.
const blogIndexHtml = readFileSync(join(distDir, 'blog', 'index.html'), 'utf8')
for (const post of posts) {
  if (!blogIndexHtml.includes(`href="/blog/${post.slug}"`)) {
    problems.push(`blog index does not link /blog/${post.slug}`)
  }
}
// The same for the topic pages: an archive that lists categories as headings but
// never links them leaves six pages reachable only through the sitemap.
for (const path of ROUTE_PATHS.filter(entry => entry.startsWith('/blog/category/'))) {
  if (!blogIndexHtml.includes(`href="${path}"`)) problems.push(`blog index does not link ${path}`)
}
// Position matters as much as presence here. The six topic pages are linked
// from underneath the article rows too, and that link alone was not enough:
// they took zero search impressions in the site's first two months. The
// selector above the archive is the link a reader actually reaches, so that is
// the one this build refuses to lose.
const topicSelectorAt = blogIndexHtml.indexOf('class="blog-filters"')
const archiveAt = blogIndexHtml.indexOf('class="section blog-archive"')
if (topicSelectorAt === -1 || archiveAt === -1 || topicSelectorAt > archiveAt) {
  problems.push('blog index does not carry the topic selector above the article archive')
}

const robots = readFileSync(join(distDir, 'robots.txt'), 'utf8')
if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) problems.push('robots.txt is missing the sitemap directive')
// The crawl policy is a deliberate decision, and the CDN has already overridden
// it once with a managed default that disallowed every AI crawler. The file this
// build emits must still carry the allowances and the retrieval signal, so a
// regression in either place fails here rather than going unnoticed.
for (const agent of AI_AND_SEARCH_CRAWLERS) {
  if (!robots.includes(`User-agent: ${agent}\nAllow: /`)) {
    problems.push(`robots.txt no longer allows ${agent}`)
  }
}
if (!robots.includes('ai-input=yes')) problems.push('robots.txt lost the ai-input=yes retrieval signal')
if (!robots.includes('ai-train=no')) problems.push('robots.txt lost the ai-train=no signal')

// The AI-crawler index has to name every guide and every article, and may only
// point at pages that exist, or an assistant quoting it hands out dead links.
const llms = readFileSync(join(distDir, 'llms.txt'), 'utf8')
if (llms.length < 4000) problems.push(`llms.txt is only ${llms.length} chars`)
for (const doc of docs) {
  if (!llms.includes(`](${absoluteUrl(doc.url)})`)) problems.push(`llms.txt is missing ${doc.url}`)
}
for (const post of posts) {
  const url = absoluteUrl(`/blog/${post.slug}`)
  if (!llms.includes(`](${url})`)) problems.push(`llms.txt is missing ${url}`)
}
// Every link in llms.txt must be a page this build actually produced.
const llmsLinks = new Set([...llms.matchAll(/\]\((\S+?)\)/g)].map(match => match[1]))
const publishedUrls = new Set([
  ...ROUTE_PATHS.map(path => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`)),
  ...posts.map(post => absoluteUrl(`/blog/${post.slug}`)),
  ...docs.map(doc => absoluteUrl(doc.url)),
  `${SITE_URL}/sitemap.xml`,
  `${SITE_URL}/blog/feed.xml`,
  'https://github.com/shimodocs/shimodocs',
])
for (const link of llmsLinks) {
  if (!publishedUrls.has(link)) problems.push(`llms.txt links to ${link}, which is not a published page`)
}

// --------------------------------------------------------------- feed check

// A feed that silently stops updating, or that points at an article that was
// renamed, is worse than no feed: readers and aggregators keep polling it.
const feed = readFileSync(join(distDir, 'blog', 'feed.xml'), 'utf8')
if (!feed.includes('<rss version="2.0"')) problems.push('blog/feed.xml is not an RSS 2.0 document')
const feedItems = (feed.match(/<item>/g) || []).length
if (feedItems !== posts.length) {
  problems.push(`blog/feed.xml lists ${feedItems} items, expected ${posts.length}`)
}
for (const post of posts) {
  const url = absoluteUrl(`/blog/${post.slug}`)
  if (!feed.includes(`<link>${url}</link>`)) problems.push(`blog/feed.xml is missing ${post.slug}`)
}
const blogIndexForFeed = readFileSync(join(distDir, 'blog', 'index.html'), 'utf8')
if (!blogIndexForFeed.includes('type="application/rss+xml"')) {
  problems.push('the blog index does not advertise the feed')
}
for (const { post, file } of articles) {
  const html = readFileSync(join(distDir, file), 'utf8')
  if (!html.includes('type="application/rss+xml"')) {
    problems.push(`${post.slug}: the article does not advertise the feed`)
  }
}

// --------------------------------------------------------------- indexnow key

// IndexNow proves domain ownership by fetching /<key>.txt and comparing it with
// the key in the submission. If that file stops being published, every future
// submission is rejected with a 403 that nobody reads, and the only symptom is
// that new pages take longer to appear in Bing.
const indexNowProblem = keyFileProblem()
if (indexNowProblem) problems.push(`${indexNowProblem} (expected ${INDEXNOW_KEY})`)

// ------------------------------------------------------------------ sitemap

// sitemap.xml is an index now, so every URL lives in a child sitemap. Checking
// the index alone would pass while a child was empty.
const sitemapIndex = readFileSync(join(distDir, 'sitemap.xml'), 'utf8')
if (!sitemapIndex.includes('<sitemapindex')) problems.push('sitemap.xml is not a sitemap index')
for (const file of sitemapFiles) {
  const loc = absoluteUrl(`/${file.name}`)
  if (!sitemapIndex.includes(`<loc>${loc}</loc>`)) problems.push(`sitemap.xml is missing ${file.name}`)
  if (!existsSync(join(distDir, file.name))) {
    problems.push(`${file.name} was not written`)
    continue
  }
  const xml = readFileSync(join(distDir, file.name), 'utf8')
  if (!xml.includes('<urlset')) problems.push(`${file.name} is not a urlset`)
  for (const entry of file.entries) {
    if (!xml.includes(`<loc>${escapeHtml(entry.loc)}</loc>`)) problems.push(`${file.name} is missing ${entry.loc}`)
    // An image listed for a page has to be a file this build produced and an
    // entry in the same sitemap, or image search is being told about a 404.
    for (const image of entry.images || []) {
      if (!xml.includes(`<image:loc>${escapeHtml(image)}</image:loc>`)) {
        problems.push(`${file.name} does not list ${image} as an image of ${entry.loc}`)
      }
      if (!existsSync(join(distDir, image.replace(SITE_URL, '')))) {
        problems.push(`${entry.loc} claims an image this build did not produce: ${image}`)
      }
      // Listing an image on a page that does not display it is exactly the
      // overstatement an image sitemap is not allowed to make. Checked against
      // the rendered page rather than the source, because that is what Google
      // will fetch.
      const pageFile = join(distDir, `${entry.loc.replace(SITE_URL, '').replace(/^\//, '')}/index.html`)
      if (existsSync(pageFile)) {
        const pageHtml = readFileSync(pageFile, 'utf8')
        if (!pageHtml.includes(image.replace(SITE_URL, ''))) {
          problems.push(`${entry.loc} lists ${image} but the page does not reference it`)
        }
      }
    }
  }
}
for (const routePath of ROUTE_PATHS) {
  const loc = absoluteUrl(routePath)
  if (!sitemapIndex.includes(loc) && !sitemapFiles.some(file => file.entries.some(entry => entry.loc === loc))) {
    problems.push(`no sitemap contains ${loc}`)
  }
}
for (const post of posts) {
  const loc = absoluteUrl(`/blog/${post.slug}`)
  if (!sitemapFiles.some(file => file.entries.some(entry => entry.loc === loc))) {
    problems.push(`no sitemap contains ${loc}`)
  }
}
function sitemapLists(loc) {
  return sitemapFiles.some(file => file.entries.some(entry => entry.loc === loc))
}
for (const { doc } of guides) {
  const loc = absoluteUrl(doc.url)
  if (DOCS_SITEMAP_LANGUAGES.includes(doc.language)) {
    if (!sitemapLists(loc)) problems.push(`no sitemap contains ${loc}`)
  } else if (sitemapLists(loc)) {
    problems.push(`${loc} is a ${doc.language} guide and must stay off the sitemap`)
  }
}
for (const language of DOCS_LANGUAGES) {
  if (language === DOCS_DEFAULT_LANGUAGE) continue
  const loc = absoluteUrl(docsBase(language))
  if (DOCS_SITEMAP_LANGUAGES.includes(language)) {
    if (!sitemapLists(loc)) problems.push(`no sitemap contains ${loc}`)
  } else if (sitemapLists(loc)) {
    problems.push(`${loc} must stay off the sitemap`)
  }
  const stale = `sitemap-docs-${language}.xml`
  if (!DOCS_SITEMAP_LANGUAGES.includes(language) && existsSync(join(distDir, stale))) {
    problems.push(`${stale} was written; translations stay off the sitemap`)
  }
}

// lastmod has to be a real date, and the site cannot report one single date for
// every URL: that is the defect these dates were added to remove, and the build
// clock produces exactly it. Three distinct dates is a low bar that a
// build-stamped sitemap cannot clear.
const sitemapDates = new Set()
const locOwner = new Map()
for (const file of sitemapFiles) {
  for (const entry of file.entries) {
    if (!isIsoDate(entry.lastmod)) {
      problems.push(`${file.name}: ${entry.loc} has no YYYY-MM-DD lastmod`)
    } else {
      if (entry.lastmod > today) problems.push(`${file.name}: ${entry.loc} is dated ${entry.lastmod}, in the future`)
      sitemapDates.add(entry.lastmod)
    }
    if (locOwner.has(entry.loc)) {
      problems.push(`${entry.loc} is listed in both ${locOwner.get(entry.loc)} and ${file.name}`)
    } else {
      locOwner.set(entry.loc, file.name)
    }
  }
}
if (sitemapDates.size < 3) {
  problems.push(
    `the whole site reports ${sitemapDates.size} distinct lastmod date(s); ` +
      'the dates are coming from the build clock instead of the content',
  )
}

// The commercial pages are the first child of the index, and they are all in it.
// Both halves matter: a crawler reads one child after the index, and a core page
// that quietly fell out of its own file would still be reachable, just last.
const firstChild = sitemapIndex.match(/<sitemap>\s*<loc>([^<]+)<\/loc>/)?.[1] || ''
if (firstChild !== absoluteUrl('/sitemap-core.xml')) {
  problems.push(`sitemap.xml does not list sitemap-core.xml first (first child is "${firstChild}")`)
}
const coreXml = readFileSync(join(distDir, 'sitemap-core.xml'), 'utf8')
for (const path of CORE_PATHS) {
  if (!coreXml.includes(`<loc>${escapeHtml(absoluteUrl(path))}</loc>`)) {
    problems.push(`sitemap-core.xml is missing ${path}`)
  }
}

// The generated client metadata must match the Markdown on disk.
const generated = readFileSync(join(rootDir, 'src', 'generated', 'blog-posts.js'), 'utf8')
const generatedRecords = JSON.parse(generated.match(/export const BLOG_POSTS = ([\s\S]*?)\n\nexport/)[1])
if (generatedRecords.length !== posts.length) {
  problems.push('src/generated/blog-posts.js is stale; run the content generator')
}
const generatedDocs = readFileSync(join(rootDir, 'src', 'generated', 'docs-nav.js'), 'utf8')
const generatedDocRecords = JSON.parse(generatedDocs.match(/export const DOCS = ([\s\S]*?)\n\nexport/)[1])
if (generatedDocRecords.length !== docs.length) {
  problems.push('src/generated/docs-nav.js is stale; run the content generator')
}

// No two articles may render the same document structure.
//
// The earlier version of this check compared one article per layout, which
// catches a layout collapsing into another but not the failure that actually
// happens: two articles in the same layout whose figure and block mix came out
// identical, so a reader moving between them gets the same document twice with
// different words. Structure here means the set of classes the body emits — the
// layout's own scaffold plus one class per figure type and per block type — which
// is what changes what the reader sees, not merely what the stylesheet does.
//
// A few classes say nothing about the structure a reader moves through — the
// "Updated" badge is the one that matters, because an article that carries it
// would otherwise look different from every article that does not, and two
// articles with the same figures and blocks would pass. Structure here is the
// layout scaffold plus one class per figure type and per block type.
const NON_STRUCTURAL_CLASSES = new Set(['post-updated'])

function structureSignature(html) {
  const markup = prerenderedMarkup(html)
  const classes = new Set()
  for (const match of markup.matchAll(/class="([^"]+)"/g)) {
    for (const name of match[1].split(/\s+/)) if (name && !NON_STRUCTURAL_CLASSES.has(name)) classes.add(name)
  }
  return [...classes].sort().join('|')
}

const signatures = new Map()
for (const { post, file } of articles) {
  const html = readFileSync(join(distDir, file), 'utf8')
  const signature = structureSignature(html)
  if (!signatures.has(signature)) signatures.set(signature, [])
  signatures.get(signature).push(post)
}
for (const group of signatures.values()) {
  if (group.length > 1) {
    const [first] = group
    problems.push(
      `${group.length} articles render an identical structure: ${group.map(post => post.slug).join(', ')} ` +
        `(all "${first.layout}"). Give one of them a different figure type or block type.`,
    )
  }
}

// ------------------------------------------------------------------- FAQ
//
// The FAQ exists twice on every page that has one: the text a reader sees and
// the FAQPage markup a crawler reads. Google requires the markup to describe the
// visible content, and the two copies are edited by different people at
// different times, so they are compared here — questions and answers — against
// the rendered page, with the scripts stripped first. It also fails the build
// when one question is published with two different answers, because an answer
// engine quoting either one makes the site contradict itself.
const declaredFaqs = new Map()
for (const path of ROUTE_PATHS) {
  if (ROUTE_SEO[path].faqs?.length) declaredFaqs.set(path, ROUTE_SEO[path].faqs)
}
for (const post of posts) {
  if (post.faq?.length) declaredFaqs.set(`/blog/${post.slug}`, post.faq)
}
const faqAudit = auditFaqsInDirectory(distDir, declaredFaqs)
problems.push(...faqAudit.problems)
const faqWarnings = faqAudit.warnings
const faqSummary = `${faqAudit.stats.questions} FAQs on ${faqAudit.stats.faqPages} of ${faqAudit.stats.pages} pages`

// ---------------------------------------------------------- pricing facts
//
// The price, the free limit and the annual discount are declared once in
// src/pricing-facts.js, but a large share of the articles states the free limit
// in hand-written Markdown. This reads every rendered page and fails the build
// when one of them states a different number, so a price change cannot ship
// half-applied.
const pricingAudit = auditPricingFactsInDirectory(distDir)
problems.push(...pricingAudit.problems)
const pricingSummary =
  `${pricingAudit.stats.freeLimitClaims} free-limit, ${pricingAudit.stats.perUserPriceClaims} price and ` +
  `${pricingAudit.stats.annualDiscountClaims} discount claims`

// ----------------------------------------------------------- figure text
//
// A figure is inline SVG placed by coordinate, and the browser clips an SVG at
// its viewBox instead of wrapping or shrinking what runs past it. A label that
// does not fit is therefore not wrong-looking, it is absent — and the page gives
// no hint that a row of a chart lost its explanation. The generators wrap to the
// room they have; this is what checks that they still do.
const figureAudit = auditFiguresInDirectory(distDir)
problems.push(...figureAudit.problems)
const figureSummary = `${figureAudit.stats.figures} figures on ${figureAudit.stats.pagesWithFigures} pages`

if (problems.length) {
  console.error('Prerender verification failed:')
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

for (const warning of titleLengthWarnings) console.warn(`  warning: ${warning}`)
for (const warning of faqWarnings) console.warn(`  warning: ${warning}`)

const layoutSummary = [...layoutCounts.entries()].map(([layout, count]) => `${layout} ${count}`).join(', ')
console.log(
  `Prerender verification passed: ${ROUTE_PATHS.length} routes, ${posts.length} articles and ` +
    `${guides.length} guides in ${docsByLanguage.size} languages, unique titles per language, ` +
    `canonical links, hreflang, structured data, no client bundle. ` +
    `${linksChecked} internal links resolved on ${htmlPagesCrawled} pages. ` +
    `Layouts: ${layoutSummary}. Distinct structures: ${signatures.size}. ` +
    `Every figure label fits inside its diagram (${figureSummary}). ` +
    `FAQ markup matches the visible text for ${faqSummary}. ` +
    `Pricing facts agree on ${pricingSummary}.`,
)
