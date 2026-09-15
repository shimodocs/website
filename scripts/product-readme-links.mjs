#!/usr/bin/env node
// Rewrite the product repository's documentation links to point at this site.
//
// The README in shimodocs/shimodocs links to its own docs with relative paths,
// which GitHub renders as blob pages. Those links are the most valuable inbound
// links the documentation can have — GitHub is crawled constantly and the
// repository is where a reader arrives first — and every one of them currently
// sends the reader, and the ranking signal, to a file view instead of the page.
//
// The script rewrites the English, German and Japanese READMEs, which are the
// languages this site publishes. The other translations are left alone rather
// than pointed at pages that do not exist yet; publishing a language is a change
// to DOCS_LANGUAGES in src/docs-languages.js, and this script follows it.
//
//   node scripts/product-readme-links.mjs /path/to/shimodocs-checkout --check
//   node scripts/product-readme-links.mjs /path/to/shimodocs-checkout
//
// Every URL it writes is checked against the last build in dist/, so a link to a
// guide this site does not publish fails here instead of shipping as a 404.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(rootDir, 'dist')

// README file → the language prefix this site publishes it under.
const README_LANGUAGES = [
  ['README.md', ''],
  ['README.de.md', 'de'],
  ['README.ja.md', 'ja'],
]

// ./docs/deployment/getting-started/quick-start.md -> deployment/getting-started/quick-start
// ./docs/deployment/README.md                      -> deployment
// ./docs/README.md                                 -> ''
//
// A translated README links within its own tree, so the path it uses already
// carries the language directory (./docs/de/deployment/...). That prefix is the
// tree, not part of the guide id, and stripping it here is what stops the URL
// being built with the language twice.
export function docIdFromPath(path, language = '') {
  let id = path.replace(/^\.?\/?docs\//, '').replace(/\.md$/, '')
  if (language && id.startsWith(`${language}/`)) id = id.slice(language.length + 1)
  if (id === 'README') return ''
  return id.replace(/\/README$/, '')
}

export function siteUrl(language, id) {
  const base = language ? `https://shimodocs.com/${language}/docs` : 'https://shimodocs.com/docs'
  return id ? `${base}/${id}` : base
}

// Rewrites relative docs links, leaves everything else (assets, external URLs,
// anchors) exactly as it was.
export function rewrite(source, language, { verify = true } = {}) {
  const missing = []
  const replaced = new Set()
  const target = language ? `https://shimodocs.com/${language}/docs` : 'https://shimodocs.com/docs'

  const output = source.replace(/\]\((\.\/docs\/[^)]+\.md)\)/g, (whole, path) => {
    const id = docIdFromPath(path, language)
    const url = siteUrl(language, id)
    if (verify && !existsSync(join(distDir, `${url.replace('https://shimodocs.com/', '')}/index.html`))) {
      // /docs itself is a directory index too, so the check above covers it.
      missing.push(`${path} -> ${url}`)
      return whole
    }
    replaced.add(url)
    return `](${url})`
  })

  return { output, missing, replaced: [...replaced].sort() }
}

async function main() {
  const checkout = process.argv[2]
  const checkOnly = process.argv.includes('--check')
  if (!checkout || checkout.startsWith('--')) {
    console.error('usage: node scripts/product-readme-links.mjs /path/to/shimodocs-checkout [--check]')
    process.exit(1)
  }
  if (!existsSync(distDir)) {
    console.error('dist/ is missing; run npm run build first so every link can be verified')
    process.exit(1)
  }

  const allMissing = []
  for (const [file, language] of README_LANGUAGES) {
    const path = join(resolve(checkout), file)
    if (!existsSync(path)) {
      console.log(`${file.padEnd(16)} not present in the checkout, skipped`)
      continue
    }
    const source = readFileSync(path, 'utf8')
    const { output, missing, replaced } = rewrite(source, language)
    allMissing.push(...missing.map(entry => `${file}: ${entry}`))

    const label = language || 'en'
    if (output === source) {
      console.log(`${file.padEnd(16)} ${label.padEnd(3)} already points at the site (${replaced.length} links)`)
      continue
    }
    if (checkOnly) {
      console.log(`${file.padEnd(16)} ${label.padEnd(3)} would rewrite ${replaced.length} links`)
      continue
    }
    writeFileSync(path, output)
    console.log(`${file.padEnd(16)} ${label.padEnd(3)} rewrote ${replaced.length} links`)
  }

  if (allMissing.length) {
    console.log('\nLinks with no published page (left as they were):')
    for (const entry of allMissing) console.log(`  ${entry}`)
  }
  console.log(
    '\nThe deployment-docs block sits between <!-- deployment-docs:start --> and end markers.\n' +
      'If something outside this repository regenerates it, that generator needs the same change\n' +
      'or the next run will put the GitHub links back.',
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
