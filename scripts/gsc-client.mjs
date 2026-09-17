// Google Search Console client — shared by scripts/gsc-report.mjs (manual CLI) and
// scripts/shimodocs-daily.mjs (the 08:00 run), so the two cannot drift apart.
//
// Property string: this site is a Domain property, so the API identifier is
// `sc-domain:shimodocs.com`. A URL-prefix property would be `https://shimodocs.com/`
// instead, and the wrong string returns 403 rather than an empty result.
//
// Free, no billing account: https://developers.google.com/webmaster-tools/pricing
// Quotas: Search Analytics 1,200 QPM per site; URL Inspection 2,000 QPD / 600 QPM per
// site. A full sweep of the current 133-URL sitemap costs 133 inspections.
//
// The Indexing > Pages (Coverage) report has no API at all. `inspect` is the closest
// automated substitute and a different measurement: it answers per URL whether Google
// indexed it and why not, while Coverage aggregates by reason over "all known pages".
// Never add the two together.
import { createSign } from 'node:crypto'
import { readFileSync } from 'node:fs'

export const DEFAULT_SITE = 'sc-domain:shimodocs.com'
export const DEFAULT_KEY_PATH = 'seo/data/gsc-service-account.json'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const API = 'https://searchconsole.googleapis.com'
const SITEMAP_INDEX = 'https://shimodocs.com/sitemap.xml'

const b64url = input => Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function loadServiceAccount(keyPath) {
  const key = JSON.parse(readFileSync(keyPath, 'utf8'))
  if (!key.client_email || !key.private_key) {
    throw new Error(`${keyPath} 不是服务账号密钥（缺 client_email / private_key）`)
  }
  return key
}

// A JWT is signed once per run: tokens last an hour and every run here is minutes.
async function mintToken(key) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }))
  const signature = b64url(createSign('RSA-SHA256').update(`${header}.${claims}`).sign(key.private_key))
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${signature}`,
    }),
    signal: AbortSignal.timeout(30000),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`换取 access token 失败：HTTP ${response.status} ${text.slice(0, 200)}`)
  return JSON.parse(text).access_token
}

export function createGscClient({ keyPath, site = DEFAULT_SITE } = {}) {
  if (!keyPath) throw new Error('createGscClient 需要 keyPath')
  const key = loadServiceAccount(keyPath)
  let tokenPromise = null

  const token = () => {
    if (!tokenPromise) tokenPromise = mintToken(key)
    return tokenPromise
  }

  async function call(path, init = {}) {
    // fetch has no default timeout; one stalled response would hang the whole daily run.
    const response = await fetch(`${API}${path}`, {
      ...init,
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${await token()}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    })
    const text = await response.text()
    const payload = text ? JSON.parse(text) : {}
    if (!response.ok) {
      const hint =
        response.status === 403
          ? `（检查：服务账号 ${key.client_email} 是否已加为该资源的用户；site 是否精确等于 "${site}"；项目是否已启用 Search Console API）`
          : ''
      throw new Error(`HTTP ${response.status} ${path} ${JSON.stringify(payload).slice(0, 200)}${hint}`)
    }
    return payload
  }

  const encodedSite = encodeURIComponent(site)

  return {
    site,
    clientEmail: key.client_email,
    projectId: key.project_id,
    listSites: () => call('/webmasters/v3/sites'),
    listSitemaps: () => call(`/webmasters/v3/sites/${encodedSite}/sitemaps`),
    searchAnalytics: (dimensions, { startDate, endDate, rowLimit = 100 } = {}) =>
      call(`/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`, {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, dimensions, rowLimit, dataState: 'final' }),
      }),
    async inspectOne(url) {
      const payload = await call('/v1/urlInspection/index:inspect', {
        method: 'POST',
        body: JSON.stringify({ inspectionUrl: url, siteUrl: site, languageCode: 'en-US' }),
      })
      const r = payload.inspectionResult?.indexStatusResult || {}
      return {
        url,
        verdict: r.verdict || null,
        coverage: r.coverageState || null,
        indexing: r.indexingState || null,
        lastCrawl: r.lastCrawlTime || null,
        googleCanonical: r.googleCanonical || null,
        userCanonical: r.userCanonical || null,
        robots: r.robotsTxtState || null,
        fetch: r.pageFetchState || null,
      }
    },
    // Bounded concurrency: 4 keeps a full sweep near the 600 QPM per-site ceiling while
    // still finishing 133 URLs in about three minutes. Five consecutive failures mean the
    // credential or the quota is broken, not one unlucky URL, so the sweep stops there.
    async inspect(urls, { concurrency = 4, onProgress, maxConsecutiveErrors = 5 } = {}) {
      const client = this
      const rows = new Array(urls.length)
      let cursor = 0
      let consecutive = 0
      let aborted = false
      async function worker() {
        while (cursor < urls.length && !aborted) {
          const index = cursor++
          const url = urls[index]
          try {
            rows[index] = await client.inspectOne(url)
            consecutive = 0
          } catch (error) {
            consecutive += 1
            rows[index] = { url, error: String(error.message || error).slice(0, 200) }
            if (consecutive >= maxConsecutiveErrors) aborted = true
          }
          if (onProgress) onProgress(rows[index], index)
        }
      }
      await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker))
      return aborted ? rows.filter(Boolean) : rows
    },
  }
}

// The sitemap index lists child sitemaps; the index ledger needs the leaf URLs, and it
// reads them from the live site rather than the build output so the check tests production.
export async function sitemapUrls(limit = 250) {
  const index = await (await fetch(SITEMAP_INDEX, { signal: AbortSignal.timeout(20000) })).text()
  const children = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  const urls = []
  for (const child of children) {
    const xml = await (await fetch(child, { signal: AbortSignal.timeout(20000) })).text()
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      urls.push(match[1])
      if (urls.length >= limit) return urls
    }
  }
  return urls
}

// Two of the coverage states are not stable measurements. Re-inspecting the same URL
// seconds apart flips between them: on 2026-09-17, two consecutive sweeps disagreed on
// 24% of a 42-URL sample, and always inside this pair (19 discovered→unknown and 13
// unknown→discovered across two full sweeps 13 minutes apart). Google's inspection
// service is eventually consistent for URLs that are not in the index, so the split
// between "queued for crawling" and "unknown" is not observable through this API.
// Their SUM is stable (85+33 = 79+39 = 118 in both sweeps), so report that instead.
export const UNSTABLE_STATES = new Set(['Discovered - currently not indexed', 'URL is unknown to Google'])

export function summariseCoverage(rows) {
  const counts = rows.reduce((acc, r) => {
    const key = `${r.verdict || (r.error ? 'ERROR' : 'unknown')} / ${r.coverage || r.error || 'unknown'}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

// The stable reading: only buckets whose membership held across repeated sweeps.
export function indexLedger(rows) {
  const pick = fn => rows.filter(fn).length
  const errored = pick(r => r.error)
  const indexed = pick(r => r.verdict === 'PASS')
  const crawled = pick(r => r.coverage === 'Crawled - currently not indexed')
  const excluded = pick(r => /noindex/i.test(r.coverage || ''))
  const notIndexedElsewhere = pick(r => /not found|redirect/i.test(r.coverage || ''))
  const queued = pick(r => UNSTABLE_STATES.has(r.coverage))
  return {
    total: rows.length,
    indexed,
    queued,
    crawled,
    excluded,
    notIndexedElsewhere,
    errored,
    notIndexed: rows.length - indexed,
  }
}
