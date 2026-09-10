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
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadPosts, relatedPosts, toClientRecord } from './blog-content.mjs'

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
  ROUTE_PATHS,
  ROUTE_SEO,
  headFor,
  robotsTxt,
  sitemapXml,
  SITE_URL,
  blogPostHead,
  blogIndexJsonLd,
  absoluteUrl,
} = ssr

const posts = loadPosts()

const templatePath = join(distDir, 'index.html')
if (!existsSync(templatePath)) {
  console.error(`Missing client build at ${templatePath}. Run "vite build" first.`)
  process.exit(1)
}
const template = readFileSync(templatePath, 'utf8')

const serialise = value => JSON.stringify(value).replace(/</g, '\\u003c')

// Assembles a full document from the Vite template: route head, rendered body,
// and optionally no client bundle at all.
function documentFrom(head, body, { stripClientBundle = false } = {}) {
  let html = template
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>\s*/gi, '')
  html = html.replace(/<meta\s+name="description"[^>]*>\s*/gi, '')
  html = html.replace(/<meta\s+name="keywords"[^>]*>\s*/gi, '')

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
  let head = headFor(routePath)

  // The blog index also describes the collection and lists every article.
  if (routePath === '/blog' && posts.length) {
    head += `    <script type="application/ld+json" id="blog-index">${serialise(
      blogIndexJsonLd(posts),
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

// --------------------------------------------------------------------- 404

const notFoundHtml = (() => {
  const head = headFor('/').replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow"/>')
  const body =
    '<div class="page"><section class="section page-intro not-found">' +
    '<div class="eyebrow">Error 404</div>' +
    '<h1>This page moved<br><span class="gradient">or never existed.</span></h1>' +
    '<p>Head back to the <a href="/">ShimoDocs home page</a>, or jump to ' +
    '<a href="/ai-workspace">AI Workspace</a>, <a href="/pricing">Pricing</a>, ' +
    '<a href="/help-center">Help Center</a> or the <a href="/blog">blog archive</a>.</p>' +
    '</section></div>'
  return documentFrom(head, body)
})()
writeHtml('404.html', notFoundHtml)

// --------------------------------------------------------- crawler surfaces

writeFileSync(join(distDir, 'robots.txt'), robotsTxt())
writeFileSync(
  join(distDir, 'sitemap.xml'),
  sitemapXml(
    posts[0]?.date || new Date().toISOString().slice(0, 10),
    posts.map(post => ({
      loc: absoluteUrl(`/blog/${post.slug}`),
      lastmod: post.updated || post.date,
      changefreq: 'monthly',
      priority: '0.6',
    })),
  ),
)

rmSync(ssrDir, { recursive: true, force: true })

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
console.log(`  ${'404'.padEnd(16)} -> dist/404.html`)
console.log(`  ${'robots.txt'.padEnd(16)} -> dist/robots.txt`)
console.log(`  ${'sitemap.xml'.padEnd(16)} -> dist/sitemap.xml (${ROUTE_PATHS.length + posts.length} urls)`)

// ------------------------------------------------------------- verification

function prerenderedMarkup(html) {
  const start = html.indexOf('<div id="root">')
  const end = html.indexOf('</body>')
  if (start === -1 || end === -1 || end <= start) return ''
  return html.slice(start, end)
}

const problems = []

for (const routePath of ROUTE_PATHS) {
  const file = routePath === '/' ? 'index.html' : `${routePath.slice(1)}/index.html`
  const html = readFileSync(join(distDir, file), 'utf8')
  const markup = prerenderedMarkup(html)
  const meta = ROUTE_SEO[routePath]
  if (markup.length < 2000) problems.push(`${routePath}: prerendered markup is only ${markup.length} chars`)
  if (!/<h1[\s>]/.test(html)) problems.push(`${routePath}: no <h1>`)
  if (!html.includes(`<title>${meta.title}</title>`)) problems.push(`${routePath}: title not injected`)
  if (!html.includes('rel="canonical"')) problems.push(`${routePath}: no canonical link`)
  if (!html.includes('application/ld+json')) problems.push(`${routePath}: no structured data`)
  const titleTags = html.match(/<title>/g)
  if (!titleTags || titleTags.length !== 1) problems.push(`${routePath}: expected exactly one <title>`)
}

// Distinct titles and descriptions, or pages compete with each other.
const titles = ROUTE_PATHS.map(path => ROUTE_SEO[path].title).concat(posts.map(post => post.seoTitle))
if (new Set(titles).size !== titles.length) problems.push('duplicate titles across routes and articles')
const descriptions = ROUTE_PATHS.map(path => ROUTE_SEO[path].description).concat(
  posts.map(post => post.description),
)
if (new Set(descriptions).size !== descriptions.length) problems.push('duplicate descriptions across routes and articles')

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

// ------------------------------------------------------ article verification

for (const { post, file } of articles) {
  const html = readFileSync(join(distDir, file), 'utf8')
  const markup = prerenderedMarkup(html)

  if (markup.length < 6000) problems.push(`${post.slug}: article markup is only ${markup.length} chars`)
  if (!html.includes(`<title>${post.seoTitle}</title>`)) problems.push(`${post.slug}: search title not injected`)
  if (!/<h1[\s>]/.test(html)) problems.push(`${post.slug}: no <h1>`)
  if (!html.includes(`<link rel="canonical" href="${absoluteUrl(`/blog/${post.slug}`)}"`)) {
    problems.push(`${post.slug}: canonical link is missing or wrong`)
  }
  if (!html.includes('"BlogPosting"')) problems.push(`${post.slug}: no BlogPosting structured data`)
  if (!html.includes('"BreadcrumbList"')) problems.push(`${post.slug}: no breadcrumb structured data`)
  if (post.headings.length >= 3 && !html.includes(`href="#${post.headings[0].id}"`)) {
    problems.push(`${post.slug}: table of contents is missing`)
  }
  // The body must be real HTML in the document, not deferred to the client.
  if (!html.includes(post.headings[0]?.text || '\u0000')) {
    problems.push(`${post.slug}: first heading is missing from the static HTML`)
  }
  if (/<script type="module"/.test(html)) {
    problems.push(`${post.slug}: article page still ships the client bundle`)
  }
  // Internal linking is the whole point of a content cluster.
  const inbound = (html.match(/href="\/blog\/[a-z0-9-]+"/g) || []).length
  if (inbound < 5) problems.push(`${post.slug}: only ${inbound} internal blog links`)
  if (post.words < 900) problems.push(`${post.slug}: only ${post.words} words`)
}

// Home hero carries the two ways to get the product.
const homeHtml = readFileSync(join(distDir, 'index.html'), 'utf8')
if (!/releases\/latest\/download\/mdp-installer-amd64/.test(homeHtml)) {
  problems.push('home: installer download link is missing')
}
if (!/mailto:support\.global@shimo\.im/.test(homeHtml)) {
  problems.push('home: free licence request link is missing')
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

const sitemap = readFileSync(join(distDir, 'sitemap.xml'), 'utf8')
for (const routePath of ROUTE_PATHS) {
  const loc = routePath === '/' ? `${SITE_URL}/` : `${SITE_URL}${routePath}`
  if (!sitemap.includes(`<loc>${loc}</loc>`)) problems.push(`sitemap.xml is missing ${loc}`)
}
for (const post of posts) {
  const loc = absoluteUrl(`/blog/${post.slug}`)
  if (!sitemap.includes(`<loc>${loc}</loc>`)) problems.push(`sitemap.xml is missing ${loc}`)
}

// The generated client metadata must match the Markdown on disk.
const generated = readFileSync(join(rootDir, 'src', 'generated', 'blog-posts.js'), 'utf8')
const generatedRecords = JSON.parse(generated.match(/export const BLOG_POSTS = ([\s\S]*?)\n\nexport/)[1])
if (generatedRecords.length !== posts.length) {
  problems.push('src/generated/blog-posts.js is stale; run the content generator')
}

if (problems.length) {
  console.error('Prerender verification failed:')
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(
  `Prerender verification passed: ${ROUTE_PATHS.length} routes and ${posts.length} articles, ` +
    'unique titles, canonical links, structured data, internal links and no client bundle on articles.',
)
