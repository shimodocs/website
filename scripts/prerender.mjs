#!/usr/bin/env node
// Build-time prerenderer.
//
// The marketing site shipped as a client-rendered SPA, so every route served
// the same HTML shell: an empty <div id="root"></div> with one shared title.
// Crawlers saw no headings, no copy and no links.
//
// This renders each route from the shared route table to real HTML, injects
// route-specific head tags and structured data, and writes per-route files so
// no JavaScript is required for a crawler to read the page.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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
const { renderRoute, ROUTE_PATHS, ROUTE_SEO, headFor, robotsTxt, sitemapXml, SITE_URL } = ssr

const templatePath = join(distDir, 'index.html')
if (!existsSync(templatePath)) {
  console.error(`Missing client build at ${templatePath}. Run "vite build" first.`)
  process.exit(1)
}
const template = readFileSync(templatePath, 'utf8')

function buildDocument(routePath) {
  const body = renderRoute(routePath)
  const head = headFor(routePath)

  let html = template
  // Drop the template's own tags so a route can never end up with two titles.
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>\s*/gi, '')
  html = html.replace(/<meta\s+name="description"[^>]*>\s*/gi, '')
  html = html.replace(/<meta\s+name="keywords"[^>]*>\s*/gi, '')

  if (html.includes(SEO_MARKER)) {
    html = html.replace(SEO_MARKER, head)
  } else {
    html = html.replace('</head>', `${head}</head>`)
  }

  if (!html.includes('<div id="root"></div>')) {
    throw new Error(`Template is missing the empty #root container for ${routePath}`)
  }
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  return html
}

function writeRoute(routePath, html) {
  const outDir = routePath === '/' ? distDir : join(distDir, routePath.slice(1))
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'index.html'), html)
  return routePath === '/' ? 'index.html' : `${routePath.slice(1)}/index.html`
}

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const written = []
for (const routePath of ROUTE_PATHS) {
  const html = buildDocument(routePath)
  written.push({ route: routePath, file: writeRoute(routePath, html), bytes: Buffer.byteLength(html) })
}

// A real 404 document. nginx serves it with a 404 status instead of falling
// back to the home page, which would register as a soft 404.
const notFoundHtml = (() => {
  const head = headFor('/').replace(
    /<meta name="robots"[^>]*>/,
    '<meta name="robots" content="noindex, follow"/>',
  )
  let html = readFileSync(templatePath, 'utf8')
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>\s*/gi, '')
  html = html.replace(/<meta\s+name="description"[^>]*>\s*/gi, '')
  html = html.replace(/<meta\s+name="keywords"[^>]*>\s*/gi, '')
  html = html.includes(SEO_MARKER) ? html.replace(SEO_MARKER, head) : html.replace('</head>', `${head}</head>`)
  const body =
    '<div class="page"><section class="section page-intro not-found">' +
    '<div class="eyebrow">Error 404</div>' +
    '<h1>This page moved<br><span class="gradient">or never existed.</span></h1>' +
    '<p>Head back to the <a href="/">ShimoDocs home page</a>, or jump to ' +
    '<a href="/ai-workspace">AI Workspace</a>, <a href="/pricing">Pricing</a> or ' +
    '<a href="/help-center">Help Center</a>.</p>' +
    '</section></div>'
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
})()
writeFileSync(join(distDir, '404.html'), notFoundHtml)

writeFileSync(join(distDir, 'robots.txt'), robotsTxt())
writeFileSync(join(distDir, 'sitemap.xml'), sitemapXml())

rmSync(ssrDir, { recursive: true, force: true })

console.log(`Prerendered ${written.length} routes for ${SITE_URL}`)
for (const entry of written) {
  console.log(`  ${entry.route.padEnd(16)} -> dist/${entry.file} (${(entry.bytes / 1024).toFixed(1)} kB)`)
}
console.log(`  ${'404'.padEnd(16)} -> dist/404.html`)
console.log(`  ${'robots.txt'.padEnd(16)} -> dist/robots.txt`)
console.log(`  ${'sitemap.xml'.padEnd(16)} -> dist/sitemap.xml (${escapeXml(String(ROUTE_PATHS.length))} urls)`)

// Fail the build rather than shipping an empty shell to crawlers. Vite injects
// the bundle into <head>, so measure the #root element to </body> instead of
// assuming a script tag follows the container.
function prerenderedMarkup(html) {
  const start = html.indexOf('<div id="root">')
  const end = html.indexOf('</body>')
  if (start === -1 || end === -1 || end <= start) return ''
  return html.slice(start, end)
}

const problems = []
for (const routePath of ROUTE_PATHS) {
  const file = routePath === '/' ? join(distDir, 'index.html') : join(distDir, routePath.slice(1), 'index.html')
  const html = readFileSync(file, 'utf8')
  const markup = prerenderedMarkup(html)
  const meta = ROUTE_SEO[routePath]
  if (markup.length < 2000) problems.push(`${routePath}: prerendered markup is only ${markup.length} chars`)
  if (!/<h1[\s>]/.test(html)) problems.push(`${routePath}: no <h1>`)
  if (!html.includes(`<title>${meta.title}</title>`)) problems.push(`${routePath}: title not injected`)
  if (!html.includes('rel="canonical"')) problems.push(`${routePath}: no canonical link`)
  if (!html.includes('application/ld+json')) problems.push(`${routePath}: no structured data`)
  const titles = html.match(/<title>/g)
  if (!titles || titles.length !== 1) problems.push(`${routePath}: expected exactly one <title>`)
}

// Every route must produce a distinct title, or pages compete with each other.
const titles = ROUTE_PATHS.map(p => ROUTE_SEO[p].title)
if (new Set(titles).size !== titles.length) problems.push('duplicate titles across routes')
const descriptions = ROUTE_PATHS.map(p => ROUTE_SEO[p].description)
if (new Set(descriptions).size !== descriptions.length) problems.push('duplicate descriptions across routes')

// Search results truncate these, so keep the copy inside the visible window.
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

// The home hero carries the two ways to get the product: the installer and
// the free licence request. Both must survive a refactor.
const homeHtml = readFileSync(join(distDir, 'index.html'), 'utf8')
if (!/releases\/latest\/download\/mdp-installer-amd64/.test(homeHtml)) {
  problems.push('home: installer download link is missing')
}
if (!/mailto:support\.global@shimo\.im/.test(homeHtml)) {
  problems.push('home: free licence request link is missing')
}

const robots = readFileSync(join(distDir, 'robots.txt'), 'utf8')
if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) problems.push('robots.txt is missing the sitemap directive')
const sitemap = readFileSync(join(distDir, 'sitemap.xml'), 'utf8')
for (const routePath of ROUTE_PATHS) {
  const loc = routePath === '/' ? `${SITE_URL}/` : `${SITE_URL}${routePath}`
  if (!sitemap.includes(`<loc>${loc}</loc>`)) problems.push(`sitemap.xml is missing ${loc}`)
}

if (problems.length) {
  console.error('Prerender verification failed:')
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}
console.log(`Prerender verification passed: ${ROUTE_PATHS.length} routes, unique titles, canonical + JSON-LD + sitemap present.`)
