#!/usr/bin/env node
// Daily Cloudflare traffic report for shimodocs.com, written into the Feishu
// base that also holds the download counts.
//
// Why this has to run every day rather than on demand: on the Free plan the
// per-request dataset is only queryable for a **one-day window**. There is no
// history to back-fill, so a day that is not read is a day that is gone. The
// daily aggregate is no better — only the last two days come back.
//
// The reason it is worth keeping at all is the column Google cannot give us:
// which crawlers actually fetch the site. Search Console reports what it decided
// to index, not whether it came; these numbers say whether Googlebot, Bingbot
// and the assistant crawlers are here, and what they are asking for.
//
//   node scripts/cloudflare-daily.mjs                 # yesterday (UTC), write it
//   node scripts/cloudflare-daily.mjs --dry-run       # print, write nothing
//   node scripts/cloudflare-daily.mjs --date 2026-09-14
//
// The token is read from seo/data/cloudflare-token.txt (or CLOUDFLARE_API_TOKEN)
// and is never written anywhere else. The Feishu write goes through lark-cli, so
// it uses the operator's own authorization rather than a second secret.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql'

const ZONE_NAME = 'shimodocs.com'
const BASE_TOKEN = 'QRQWbBAeUafjX5svYTHcHRkGn6b'
const TABLE_ID = 'tbl7IrEmsG0q4rEh'

// Crawlers worth a column of their own. The rest are counted, not named: most of
// the "bot" traffic to a site this young is scanners probing for .env files, and
// a row per scanner would bury the two lines that matter.
const AI_CRAWLERS = /GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|anthropic|PerplexityBot|Google-Extended|Applebot-Extended|meta-externalagent|Amazonbot|CCBot|Bytespider/i
const BOT_HINT = /bot|crawler|spider|slurp|curl|wget|python|node|go-http|java|scan|jscrawler|libwww|okhttp|axios/i

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const dateArg = args.includes('--date') ? args[args.indexOf('--date') + 1] : null

function token() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN.trim()
  const file = join(rootDir, 'seo', 'data', 'cloudflare-token.txt')
  if (!existsSync(file)) {
    throw new Error(`No token: set CLOUDFLARE_API_TOKEN or create ${file}`)
  }
  return readFileSync(file, 'utf8').trim()
}

async function gql(query) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { authorization: `Bearer ${token()}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(`Cloudflare: ${json.errors[0].message}`)
  return json.data.viewer.zones[0]
}

async function zoneId() {
  if (process.env.CLOUDFLARE_ZONE_ID) return process.env.CLOUDFLARE_ZONE_ID
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${ZONE_NAME}`, {
    headers: { authorization: `Bearer ${token()}` },
  })
  const json = await res.json()
  const zone = (json.result || [])[0]
  if (!zone) throw new Error(`No zone named ${ZONE_NAME} is visible to this token`)
  return zone.id
}

const isoDay = date => date.toISOString().slice(0, 10)

function yesterdayUtc() {
  const now = new Date()
  return isoDay(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)))
}

// ---------------------------------------------------------------- collection

async function dailyTotals(zone, date) {
  // A three-day window so a run that lands before the day is finalised still
  // finds the row it is looking for.
  const from = isoDay(new Date(Date.parse(`${date}T00:00:00Z`) - 2 * 86_400_000))
  const zoneData = await gql(`{ viewer { zones(filter: {zoneTag: "${zone}"}) {
    httpRequests1dGroups(limit: 10, filter: {date_geq: "${from}", date_leq: "${date}"}, orderBy: [date_ASC]) {
      dimensions { date }
      sum { requests bytes cachedRequests }
      uniq { uniques }
    } } } }`)
  const rows = zoneData.httpRequests1dGroups
  const row = rows.find(entry => entry.dimensions.date === date) || rows[rows.length - 1]
  return {
    date: row.dimensions.date,
    requests: row.sum.requests,
    cached: row.sum.cachedRequests,
    bytes: row.sum.bytes,
    uniques: row.uniq.uniques,
  }
}

async function perRequest(zone) {
  // The window is capped at 24 hours on this plan, so 23 is used deliberately:
  // asking for exactly 24 intermittently trips the "wider than 1" error.
  const now = new Date()
  const from = new Date(now.getTime() - 23 * 3_600_000).toISOString()
  const to = now.toISOString()
  const window = `datetime_geq: "${from}", datetime_leq: "${to}"`

  const [status, agents, countries] = await Promise.all([
    gql(`{ viewer { zones(filter: {zoneTag: "${zone}"}) {
      httpRequestsAdaptiveGroups(limit: 100, filter: {${window}}, orderBy: [count_DESC]) {
        count dimensions { edgeResponseStatus originResponseStatus }
      } } } }`),
    gql(`{ viewer { zones(filter: {zoneTag: "${zone}"}) {
      httpRequestsAdaptiveGroups(limit: 1000, filter: {${window}}, orderBy: [count_DESC]) {
        count dimensions { userAgent }
      } } } }`),
    gql(`{ viewer { zones(filter: {zoneTag: "${zone}"}) {
      httpRequestsAdaptiveGroups(limit: 5, filter: {${window}}, orderBy: [count_DESC]) {
        count dimensions { clientCountryName }
      } } } }`),
  ])

  const counts = { total: 0, '404': 0, '301': 0, '5xx': 0 }
  for (const row of status.httpRequestsAdaptiveGroups) {
    counts.total += row.count
    const code = row.dimensions.edgeResponseStatus
    if (code === 404) counts['404'] += row.count
    if (code === 301 || code === 302) counts['301'] += row.count
    if (code >= 500) counts['5xx'] += row.count
  }

  const bots = { crawl: 0, googlebot: 0, bingbot: 0, yandexbot: 0, ai: 0 }
  for (const row of agents.httpRequestsAdaptiveGroups) {
    const ua = row.dimensions.userAgent || ''
    if (!BOT_HINT.test(ua)) continue
    bots.crawl += row.count
    if (/Googlebot/i.test(ua)) bots.googlebot += row.count
    if (/bingbot/i.test(ua)) bots.bingbot += row.count
    if (/YandexBot/i.test(ua)) bots.yandexbot += row.count
    if (AI_CRAWLERS.test(ua)) bots.ai += row.count
  }

  const top = countries.httpRequestsAdaptiveGroups
    .map(row => `${row.dimensions.clientCountryName} ${row.count}`)
    .join(' / ')

  return { counts, bots, top }
}

// ------------------------------------------------------------------ writing

function lark(args) {
  return execFileSync('lark-cli', args, { encoding: 'utf8' })
}

function existingRecord(date) {
  const data = JSON.parse(
    lark(['base', '+record-list', '--base-token', BASE_TOKEN, '--table-id', TABLE_ID, '--as', 'user', '--json']),
  ).data || {}
  const dateIndex = (data.fields || []).indexOf('日期')
  if (dateIndex === -1) return null
  const ids = data.record_id_list || []
  const rows = data.data || []
  for (let index = 0; index < rows.length; index += 1) {
    const value = rows[index][dateIndex]
    if (typeof value === 'string' && value.slice(0, 10) === date) return ids[index]
  }
  return null
}

function notes({ daily, per }) {
  const out = []
  if (daily.requests && daily.cached / daily.requests < 0.2) {
    out.push(`缓存命中率仅 ${((daily.cached / daily.requests) * 100).toFixed(1)}%（HTML 不走边缘缓存）`)
  }
  if (per.counts['404'] > daily.requests * 0.2) {
    out.push(`404 占比 ${((per.counts['404'] / daily.requests) * 100).toFixed(0)}%，主要是扫描器探针`)
  }
  if (per.bots.googlebot === 0) out.push('Googlebot 当日零请求')
  if (per.bots.ai === 0) out.push('AI 爬虫当日零请求')
  return out.join('；')
}

async function main() {
  if (!dryRun) {
    try {
      const status = JSON.parse(lark(['auth', 'status']))
      const user = status.identities?.user
      if (user?.status !== 'ready') throw new Error('user identity is not ready')
    } catch (error) {
      console.error('飞书授权不可用，无法写入。请先运行：')
      console.error('  lark-cli auth login --no-wait --json --domain base,docs')
      console.error('然后在浏览器打开返回的 verification_url 完成授权，再重新运行本脚本。')
      if (error.message !== 'user identity is not ready') console.error(`（${error.message}）`)
      process.exit(2)
    }
  }

  const zone = await zoneId()
  const date = dateArg || yesterdayUtc()
  const daily = await dailyTotals(zone, date)
  const per = await perRequest(zone)

  const row = {
    日期: daily.date,
    总请求: daily.requests,
    独立IP: daily.uniques,
    流量MB: Number((daily.bytes / 1024 / 1024).toFixed(1)),
    缓存命中率: daily.requests ? Number(((daily.cached / daily.requests) * 100).toFixed(1)) : 0,
    '404数': per.counts['404'],
    '301数': per.counts['301'],
    '5xx数': per.counts['5xx'],
    爬虫请求: per.bots.crawl,
    Googlebot: per.bots.googlebot,
    Bingbot: per.bots.bingbot,
    YandexBot: per.bots.yandexbot,
    AI爬虫: per.bots.ai,
    Top国家: per.top,
    异常: notes({ daily, per }),
  }

  console.log(`Cloudflare 流量日报 ${row.日期}`)
  console.log(
    `  请求 ${row.总请求} · 独立IP ${row.独立IP} · 流量 ${row.流量MB} MB · 缓存命中 ${row.缓存命中率}%`,
  )
  console.log(
    `  404 ${row['404数']} · 301 ${row['301数']} · 5xx ${row['5xx数']} · 爬虫 ${row.爬虫请求}`,
  )
  console.log(
    `  Googlebot ${row.Googlebot} · Bingbot ${row.Bingbot} · YandexBot ${row.YandexBot} · AI爬虫 ${row.AI爬虫}`,
  )
  console.log(`  国家 ${row.Top国家}`)
  console.log(`  异常 ${row.异常 || '无'}`)

  if (dryRun) {
    console.log('\n--dry-run：未写入飞书。')
    return
  }

  // Idempotent on purpose: a scheduled task that runs twice, or is retried by
  // hand, must leave one row per day rather than a duplicate.
  const existing = existingRecord(row.日期)
  const common = ['--base-token', BASE_TOKEN, '--table-id', TABLE_ID, '--as', 'user', '--json']
  if (existing) {
    lark(['base', '+record-batch-update', ...common, JSON.stringify({ update_records: { [existing]: row } })])
    console.log(`已更新 ${row.日期} 那一行（record ${existing}）`)
  } else {
    lark(['base', '+record-batch-create', ...common, JSON.stringify({ create_records: [row] })])
    console.log(`已写入 ${row.日期} 的新行`)
  }
}

await main().catch(error => {
  console.error(`失败：${error.message}`)
  process.exit(1)
})
