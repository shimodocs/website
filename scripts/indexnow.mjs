#!/usr/bin/env node
// Push the site's URLs to IndexNow.
//
// Google discovers pages on its own schedule and does not support IndexNow.
// Bing does, along with Yandex, Seznam and Naver, and Bing's index is what
// grounds several assistants — so this is the shortest path from "we published a
// guide" to "an answer engine can cite it". It is also honest about its limits:
// it is a notification, not a ranking.
//
// Ownership is proved with a key file at the site root, which is why the key is
// a constant here rather than a secret: the file has to be publicly readable at
// https://<host>/<key>.txt, and the build refuses to ship without it.
//
//   node scripts/indexnow.mjs --dry-run     # print what would be sent
//   node scripts/indexnow.mjs               # submit every URL in dist/sitemaps
//
// A failure here must never fail a deploy: the release is already verified and
// live by the time this runs. It exits non-zero so the step is visibly red, and
// the workflow keeps the job green.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const INDEXNOW_KEY = '9f2a7c41d6b84e0fa3c5e18b7d60a294'
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(rootDir, 'dist')

// Every <loc> in every sitemap this build produced, including the children of
// the sitemap index. Reading them from the build rather than rebuilding the list
// means the submitted set is exactly the set the site claims to publish.
export function collectUrls(directory = distDir) {
  const sitemaps = readdirSync(directory)
    .filter(name => name.startsWith('sitemap') && name.endsWith('.xml'))
    .map(name => join(directory, name))

  const urls = new Set()
  for (const file of sitemaps) {
    const xml = readFileSync(file, 'utf8')
    // The index lists sitemap files, which are not pages; only children that
    // hold a urlset contribute.
    if (!xml.includes('<urlset')) continue
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(match[1].trim())
  }
  return [...urls].sort()
}

export function keyFileProblem() {
  const file = join(distDir, `${INDEXNOW_KEY}.txt`)
  if (!existsSync(file)) return `dist/${INDEXNOW_KEY}.txt is missing; indexnow cannot prove ownership`
  if (readFileSync(file, 'utf8').trim() !== INDEXNOW_KEY) {
    return `dist/${INDEXNOW_KEY}.txt does not contain the key`
  }
  return null
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const problem = keyFileProblem()
  if (problem && !dryRun) {
    console.error(problem)
    process.exit(1)
  }

  const urls = collectUrls()
  if (!urls.length) {
    console.error('no URLs found in dist/sitemap*.xml; run the build first')
    process.exit(1)
  }

  const host = new URL(urls[0]).host
  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  }

  if (dryRun) {
    console.log(`Would submit ${urls.length} URLs to ${INDEXNOW_ENDPOINT} for host ${host}`)
    for (const url of urls.slice(0, 5)) console.log(`  ${url}`)
    if (urls.length > 5) console.log(`  ... and ${urls.length - 5} more`)
    return
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  })
  const text = await response.text()

  // 200 is "accepted", 202 is "accepted, key pending validation". Anything else
  // is a real problem: 403 means the key file is not reachable, 422 means the
  // URLs do not belong to the host.
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow rejected the submission: ${response.status} ${text.slice(0, 300)}`)
  }
  console.log(
    `IndexNow accepted ${urls.length} URLs for ${host} (${response.status}${
      response.status === 202 ? ', key still being validated' : ''
    })`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main().catch(error => {
    console.error(`::warning::${error.message}`)
    process.exit(1)
  })
}
