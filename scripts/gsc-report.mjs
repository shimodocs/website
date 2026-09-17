#!/usr/bin/env node
// Google Search Console reader — Search Analytics, sitemaps and per-URL index status.
//
// Why this exists: every search judgement in `seo/` used to come from a hand-exported
// CSV or a screenshot, so measurement stopped whenever a person stopped exporting. The
// API is free (https://developers.google.com/webmaster-tools/pricing); the only thing it
// needs is a service account added as a user on the property.
//
// The daily run calls the same client (scripts/gsc-client.mjs) through
// scripts/shimodocs-daily.mjs, so this CLI and the automation cannot drift apart.
//
// Property format matters and is not guessable: a Domain property is
// `sc-domain:shimodocs.com`, a URL-prefix property is `https://shimodocs.com/`.
// The wrong string is a 403, not an empty result. Confirmed 2026-09-17: Domain property.
//
// What the API cannot do: the Indexing > Pages (Coverage) report has no API and its
// per-reason drilldowns stay UI-only. `inspect` is the closest substitute — it answers
// "is this URL indexed, which canonical did Google choose, when did it last crawl".
//
// Usage
//   node scripts/gsc-report.mjs sites
//   node scripts/gsc-report.mjs queries --days 28
//   node scripts/gsc-report.mjs pages --days 28
//   node scripts/gsc-report.mjs sitemaps
//   node scripts/gsc-report.mjs inspect --url https://shimodocs.com/
//   node scripts/gsc-report.mjs inspect --sitemap --limit 250 [--concurrency 4]
//   node scripts/gsc-report.mjs            # summary: sites + sitemaps + 28d queries/pages
// Add --json to print the raw response instead of a table.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_KEY_PATH, DEFAULT_SITE, createGscClient, indexLedger, sitemapUrls, summariseCoverage } from './gsc-client.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = name => args.includes(name)
const option = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const asJson = flag('--json')
const command = args.find(a => !a.startsWith('--')) || 'summary'
const site = option('--site', process.env.GSC_SITE || DEFAULT_SITE)
const keyPath = resolve(option('--key', process.env.GSC_SERVICE_ACCOUNT || join(rootDir, DEFAULT_KEY_PATH)))
const days = Number(option('--days', '28'))
const limit = Number(option('--limit', '250'))
const concurrency = Number(option('--concurrency', '4'))

const iso = d => d.toISOString().slice(0, 10)
const daysAgo = n => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return iso(d)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

const COMMANDS = new Set(['sites', 'queries', 'pages', 'sitemaps', 'inspect', 'summary'])
if (!COMMANDS.has(command)) fail(`未知命令：${command}\n可用：sites | queries | pages | sitemaps | inspect | summary`)
if (!existsSync(keyPath)) {
  fail(
    `没有找到服务账号密钥：${keyPath}\n` +
      '从 Google Cloud 下载 JSON 密钥后放到这个路径（seo/ 不进 git，与 cloudflare-token.txt 同级）。\n' +
      'GCP 步骤见 seo/2026-09-17-seo-review.md §8。',
  )
}

const gsc = createGscClient({ keyPath, site })

async function listSites() {
  const payload = await gsc.listSites()
  if (asJson) return console.log(JSON.stringify(payload, null, 2))
  const entries = payload.siteEntry || []
  console.log('这个服务账号能看到的资源：')
  for (const entry of entries) console.log(`  ${entry.siteUrl}  [${entry.permissionLevel}]`)
  const match = entries.find(e => e.siteUrl === site)
  console.log('')
  console.log(match ? `✅ "${site}" 在其中，权限 ${match.permissionLevel}` : `❌ 没有找到 "${site}" —— API 会 403`)
}

async function listSitemaps() {
  const payload = await gsc.listSitemaps()
  if (asJson) return console.log(JSON.stringify(payload, null, 2))
  const maps = payload.sitemap || []
  if (!maps.length) return console.log('没有已提交的站点地图')
  for (const map of maps) {
    const contents = (map.contents || []).map(c => `${c.type}:${c.submitted}`).join(' ')
    console.log(
      [
        map.path,
        `lastDownloaded=${map.lastDownloaded || '-'}`,
        `lastSubmitted=${map.lastSubmitted || '-'}`,
        map.isPending ? 'pending' : 'ok',
        map.errors ? `errors=${map.errors}` : '',
        map.warnings ? `warnings=${map.warnings}` : '',
        contents,
      ]
        .filter(Boolean)
        .join('  '),
    )
  }
}

async function searchAnalytics(dimensions) {
  const startDate = daysAgo(days)
  const endDate = daysAgo(1)
  const payload = await gsc.searchAnalytics(dimensions, { startDate, endDate })
  if (asJson) return console.log(JSON.stringify(payload, null, 2))
  const rows = payload.rows || []
  const sum = key => rows.reduce((n, r) => n + (r[key] || 0), 0)
  console.log(`${dimensions.join('+')}  ${startDate} → ${endDate}  行数 ${rows.length}`)
  console.log(`合计 点击 ${sum('clicks')}  展示 ${sum('impressions')}`)
  console.log('')
  console.log(['值', ...dimensions, '点击', '展示', 'CTR', '平均排名'].join('\t'))
  for (const row of rows.slice(0, 40)) {
    console.log(
      [
        String(row.keys?.[0] || '').slice(0, 60),
        ...row.keys.slice(1).map(k => String(k)),
        String(row.clicks),
        String(row.impressions),
        `${((row.ctr || 0) * 100).toFixed(2)}%`,
        Number(row.position || 0).toFixed(2),
      ].join('\t'),
    )
  }
}

async function inspect() {
  const single = option('--url')
  if (single) {
    const result = await gsc.inspectOne(single)
    return console.log(asJson ? JSON.stringify(result, null, 2) : JSON.stringify(result))
  }
  if (!flag('--sitemap')) fail('inspect 需要 --url <url> 或 --sitemap')
  const urls = await sitemapUrls(limit)
  console.log(`# 检查 ${urls.length} 个 sitemap URL（并发 ${concurrency}；配额 2000/天、600/分钟）`)
  let done = 0
  const rows = await gsc.inspect(urls, {
    concurrency,
    onProgress: row => {
      done += 1
      console.log(
        [
          String(done).padStart(3),
          (row.verdict || (row.error ? 'ERROR' : '-')).padEnd(7),
          (row.coverage || row.error || '-').slice(0, 40).padEnd(40),
          row.url,
        ].join('  '),
      )
    },
  })
  console.log('')
  const ledger = indexLedger(rows)
  console.log('# 稳定口径（推荐引用这个）')
  console.log(`  sitemap URL 总数        ${ledger.total}`)
  console.log(`  已收录（PASS）          ${ledger.indexed}`)
  console.log(`  未收录                  ${ledger.notIndexed}`)
  console.log(`    其中已排队/未知       ${ledger.queued}   ← 这一对的内部拆分在不同次调用间会变（约 24% 会互换），只能引用合计`)
  console.log(`    其中抓过未收录        ${ledger.crawled}`)
  console.log(`    其中被 noindex 排除   ${ledger.excluded}`)
  if (ledger.notIndexedElsewhere) console.log(`    其中 404 / 重定向     ${ledger.notIndexedElsewhere}`)
  if (ledger.errored) console.log(`    其中查询失败          ${ledger.errored}`)
  console.log('')
  console.log('# 原始状态计数（仅供排查，不要跨次比较）')
  for (const [key, count] of summariseCoverage(rows)) console.log(`  ${count}\t${key}`)
  const outDir = join(rootDir, 'seo/data')
  mkdirSync(outDir, { recursive: true })
  const file = join(outDir, `gsc-index-inspection-${iso(new Date())}.json`)
  writeFileSync(file, JSON.stringify({ site, inspectedAt: new Date().toISOString(), rows }, null, 2) + '\n')
  console.log(`\n原始结果写入 ${file.replace(`${rootDir}/`, '')}`)
}

switch (command) {
  case 'sites':
    await listSites()
    break
  case 'queries':
    await searchAnalytics(['query'])
    break
  case 'pages':
    await searchAnalytics(['page'])
    break
  case 'sitemaps':
    await listSitemaps()
    break
  case 'inspect':
    await inspect()
    break
  default:
    await listSites()
    console.log('')
    await listSitemaps()
    console.log('')
    await searchAnalytics(['query'])
    console.log('')
    await searchAnalytics(['page'])
}
