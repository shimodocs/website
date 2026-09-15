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
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadPosts, relatedPosts, toClientRecord } from './blog-content.mjs'
import {
  buildNav,
  docsIndexJsonLd,
  languagesByDocId,
  loadDocs,
  loadDocsByLanguage,
  loadDocsIndex,
  sortDocs,
  withNeighbours,
} from './docs-content.mjs'
import { DOCS_DEFAULT_LANGUAGE, DOCS_LANGUAGES, docsBase, docsUi } from '../src/docs-languages.js'

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
  headFor,
  robotsTxt,
  sitemapUrlsetXml,
  sitemapIndexXml,
  SITE_URL,
  blogPostHead,
  blogIndexJsonLd,
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
const translations = DOCS_LANGUAGES.filter(
  language => language !== DOCS_DEFAULT_LANGUAGE && docsByLanguage.has(language),
)
const missingLanguages = DOCS_LANGUAGES.filter(
  language => language !== DOCS_DEFAULT_LANGUAGE && !docsByLanguage.has(language),
)
if (missingLanguages.length) {
  console.error(`Published languages with no content: ${missingLanguages.join(', ')}`)
  console.error('Run "node scripts/sync-docs.mjs" or remove them from src/docs-languages.js.')
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

  const html = documentFrom(head, renderRoute(routePath))
  const file = routePath === '/' ? 'index.html' : `${routePath.slice(1)}/index.html`
  written.push({ route: routePath, file: writeHtml(file, html), bytes: Buffer.byteLength(html) })
}

// ------------------------------------------------------------------ articles

const articles = []
posts.forEach((post, index) => {
  const older = posts[index + 1] || null
  const newer = posts[index - 1] || null
  const related = relatedPosts(post, posts)

  const body = renderBlogPost(post, related, older, newer)
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

// ------------------------------------------------------------- sitemaps
//
// One urlset per content type, with the guides split again per language, and
// sitemap.xml as the index over them. Search Console then reports index
// coverage per language: with all 500 URLs in one file, a language whose
// translations Google refuses to index is invisible until the traffic numbers
// fail to appear.
const today = new Date().toISOString().slice(0, 10)
const postsLastmod = posts[0]?.date || today

const sitemapFiles = [
  {
    name: 'sitemap-pages.xml',
    entries: ROUTE_PATHS.map(path => ({
      loc: absoluteUrl(path),
      lastmod: today,
      changefreq: ROUTE_SEO[path].changeFrequency,
      priority: ROUTE_SEO[path].priority,
    })),
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
  ...DOCS_LANGUAGES.filter(language => docsByLanguage.has(language)).map(language => ({
    name: `sitemap-docs-${language}.xml`,
    entries: [
      // A translated index is a generated page, not a route, so it lives here.
      // The English one is a route and is already in sitemap-pages.xml.
      ...(language === DOCS_DEFAULT_LANGUAGE
        ? []
        : [{ loc: absoluteUrl(docsBase(language)), lastmod: today, changefreq: 'monthly', priority: '0.9' }]),
      ...sortDocs(docsByLanguage.get(language)).map(doc => ({
        loc: absoluteUrl(doc.url),
        lastmod: today,
        changefreq: 'monthly',
        // The overview and the deployment index are the doorways into the
        // guide tree; individual runbooks are supporting pages.
        priority: doc.id === '' ? '0.9' : doc.id === 'deployment' ? '0.8' : '0.6',
      })),
    ],
  })),
]

for (const file of sitemapFiles) {
  writeFileSync(join(distDir, file.name), sitemapUrlsetXml(file.entries, today))
}

writeFileSync(
  join(distDir, 'sitemap.xml'),
  sitemapIndexXml(
    sitemapFiles.map(file => ({ loc: absoluteUrl(`/${file.name}`) })),
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
console.log(`  ${'total indexable urls'.padEnd(24)} -> ${sitemapFiles.reduce((sum, file) => sum + file.entries.length, 0)}`)

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
  // A route that declares questions must publish them as a FAQPage, and the
  // visible answer must be the same string the crawler reads.
  if (meta.faqs?.length) {
    if (!html.includes('"FAQPage"')) {
      problems.push(`${routePath}: declares ${meta.faqs.length} FAQs but ships no FAQPage structured data`)
    }
    for (const faq of meta.faqs) {
      if (!html.includes(escapeHtml(faq.question))) {
        problems.push(`${routePath}: FAQ "${faq.question}" is not rendered on the page`)
      }
    }
  }
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
if (helpDocLinks.size < 15) {
  problems.push(`help-center: only ${helpDocLinks.size} links into the published guides`)
}
for (const href of helpDocLinks) {
  if (!publishedDocUrls.has(href)) problems.push(`help-center: ${href} does not match any published guide`)
}

// ------------------------------------------------------ article verification

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
  // An article that declares FAQs must publish them as structured data too —
  // that is the whole reason the frontmatter exists.
  if (post.faq?.length && !html.includes('"FAQPage"')) {
    problems.push(`${post.slug}: declares ${post.faq.length} FAQs but ships no FAQPage structured data`)
  }
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

// The contact page must keep a working submission path. The fields are checked
// in the prerendered markup because a rewrite that drops one of them would look
// fine in a browser and quietly lose inquiries; the endpoint is checked in the
// client bundle because the form cannot submit without it.
const contactHtml = readFileSync(join(distDir, 'contact-sales', 'index.html'), 'utf8')
for (const marker of ['contact-name', 'contact-email', 'contact-team-size', 'contact-message']) {
  if (!contactHtml.includes(`id="${marker}"`)) problems.push(`contact-sales: the form is missing #${marker}`)
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

const robots = readFileSync(join(distDir, 'robots.txt'), 'utf8')
if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) problems.push('robots.txt is missing the sitemap directive')

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
  'https://github.com/shimodocs/shimodocs',
])
for (const link of llmsLinks) {
  if (!publishedUrls.has(link)) problems.push(`llms.txt links to ${link}, which is not a published page`)
}

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
for (const { doc } of guides) {
  const loc = absoluteUrl(doc.url)
  if (!sitemapFiles.some(file => file.entries.some(entry => entry.loc === loc))) {
    problems.push(`no sitemap contains ${loc}`)
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

// Layouts must produce structurally different documents, not the same markup
// with different class names. Compared by the set of classes each layout emits.
function structureSignature(html) {
  const markup = prerenderedMarkup(html)
  const classes = new Set()
  for (const match of markup.matchAll(/class="([^"]+)"/g)) {
    for (const name of match[1].split(/\s+/)) if (name) classes.add(name)
  }
  return [...classes].sort().join('|')
}

const signatures = new Map()
for (const { post, file } of articles) {
  const html = readFileSync(join(distDir, file), 'utf8')
  const signature = structureSignature(html)
  const existing = signatures.get(post.layout)
  if (!existing) signatures.set(post.layout, { signature, slug: post.slug })
}
const seenLayouts = [...signatures.entries()]
for (let i = 0; i < seenLayouts.length; i += 1) {
  for (let j = i + 1; j < seenLayouts.length; j += 1) {
    const [layoutA, a] = seenLayouts[i]
    const [layoutB, b] = seenLayouts[j]
    if (a.signature === b.signature) {
      problems.push(`layouts "${layoutA}" and "${layoutB}" render identical structure (${a.slug} vs ${b.slug})`)
    }
  }
}

if (problems.length) {
  console.error('Prerender verification failed:')
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

for (const warning of titleLengthWarnings) console.warn(`  warning: ${warning}`)

const layoutSummary = [...layoutCounts.entries()].map(([layout, count]) => `${layout} ${count}`).join(', ')
console.log(
  `Prerender verification passed: ${ROUTE_PATHS.length} routes, ${posts.length} articles and ` +
    `${guides.length} guides in ${docsByLanguage.size} languages, unique titles per language, ` +
    `canonical links, hreflang, structured data, no client bundle. ` +
    `Layouts: ${layoutSummary}. Distinct structures: ${signatures.size}.`,
)
