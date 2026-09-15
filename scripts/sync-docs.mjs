#!/usr/bin/env node
// Pulls the product documentation out of the product repository and into
// content/docs, so the website can serve it as first-party pages.
//
// The documentation is authored and maintained in shimodocs/shimodocs. The
// website is a consumer: this script copies the English tree plus every
// translation listed in src/docs-languages.js. That list is the only place a
// language is switched on — zh-CN is authored upstream but deliberately not
// published here, because shimo.net owns the Chinese market.
//
//   node scripts/sync-docs.mjs            # sync
//   node scripts/sync-docs.mjs --check    # report drift, exit 1 if behind
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DOCS_DEFAULT_LANGUAGE, DOCS_LANGUAGES } from '../src/docs-languages.js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT_DIR = join(rootDir, 'content', 'docs')
const REPO = 'shimodocs/shimodocs'
const REF = 'main'
const DOCS_PREFIX = 'docs/'

// Everything except English lives under its own directory upstream.
export const PUBLISHED_LANGUAGES = DOCS_LANGUAGES.filter(language => language !== DOCS_DEFAULT_LANGUAGE)

// Directory names that hold a translation. A directory here that is not in
// PUBLISHED_LANGUAGES is skipped rather than copied and forgotten about.
const LANGUAGE_DIRS = new Set(['de', 'es', 'fr', 'ja', 'ko', 'th', 'vi', 'zh-CN'])

// Fetching one file per request is simple and keeps the script dependency-free,
// but 450 sequential requests take minutes. Eight at a time finishes in seconds
// and stays well inside GitHub's anonymous rate limit.
const CONCURRENCY = 8

const checkOnly = process.argv.includes('--check')

// Public repository, so no token is required; one is used when present because
// a CI run copies 448 files and an authenticated request is far less likely to
// be throttled halfway through.
const token = process.env.GITHUB_TOKEN || ''

function githubHeaders(extra = {}) {
  return {
    'user-agent': 'shimodocs-website',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function listDocs() {
  const url = `https://api.github.com/repos/${REPO}/git/trees/${REF}?recursive=1`
  const res = await fetch(url, { headers: githubHeaders({ accept: 'application/vnd.github+json' }) })
  if (!res.ok) throw new Error(`GitHub tree request failed: ${res.status} ${res.statusText}`)
  const data = await res.json()
  if (!Array.isArray(data.tree)) throw new Error('GitHub tree response had no tree array')

  return data.tree
    .filter(entry => entry.type === 'blob' && entry.path.startsWith(DOCS_PREFIX) && entry.path.endsWith('.md'))
    .map(entry => entry.path)
    .filter(path => {
      const rest = path.slice(DOCS_PREFIX.length)
      const first = rest.split('/')[0]
      if (!LANGUAGE_DIRS.has(first)) return true
      return PUBLISHED_LANGUAGES.includes(first)
    })
    .sort()
}

async function fetchDoc(path) {
  const url = `https://raw.githubusercontent.com/${REPO}/${REF}/${path}`
  const res = await fetch(url, { headers: githubHeaders() })
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  return res.text()
}

// docs/deployment/getting-started/quick-start.md -> deployment/getting-started/quick-start.md
function localPath(repoPath) {
  return repoPath.slice(DOCS_PREFIX.length)
}

const docs = await listDocs()
console.log(`${docs.length} documentation files in ${REPO}@${REF}`)

let written = 0
let unchanged = 0
const drift = []

async function syncOne(repoPath) {
  const rel = localPath(repoPath)
  const target = join(CONTENT_DIR, rel)
  const source = await fetchDoc(repoPath)

  if (existsSync(target) && readFileSync(target, 'utf8') === source) {
    unchanged += 1
    return
  }
  drift.push(rel)
  if (checkOnly) return

  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, source)
  written += 1
}

for (let index = 0; index < docs.length; index += CONCURRENCY) {
  await Promise.all(docs.slice(index, index + CONCURRENCY).map(syncOne))
}

if (checkOnly) {
  if (drift.length) {
    console.error(`Documentation is out of date with ${REPO}@${REF}:`)
    for (const rel of drift) console.error(`  ${rel}`)
    process.exit(1)
  }
  console.log('Documentation matches the product repository.')
  process.exit(0)
}

// Remove local files that no longer exist upstream, so a renamed or deleted
// guide cannot linger as an orphan page.
const expected = new Set(docs.map(localPath).map(rel => join(CONTENT_DIR, rel)))
const stale = []
function walk(dir) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.md') && !expected.has(full)) stale.push(full)
  }
}
walk(CONTENT_DIR)
for (const file of stale) {
  rmSync(file)
  console.log(`  removed ${relative(rootDir, file)}`)
}

console.log(`  ${written} written, ${unchanged} unchanged, ${stale.length} removed`)
