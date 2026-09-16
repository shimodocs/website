#!/usr/bin/env node
// Cloudflare Web Analytics (RUM) rows: referring URL, landing page and audience.
// The beacon runs at Cloudflare's edge, so this is the only source that sees the
// full referring URL - browsers strip it before a request reaches the origin.
// RUM data can be re-read, so every run refreshes a whole window of days and
// late-arriving page loads correct themselves. Beijing calendar days.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BASE_TOKEN = 'QRQWbBAeUafjX5svYTHcHRkGn6b'
const TRAFFIC_TABLE = 'tbl7IrEmsG0q4rEh'
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'be716c28f8452804d41c7e2e45a30dfb'
const SITE_TAG = process.env.CLOUDFLARE_RUM_SITE_TAG || 'd7e53e718da84f3da53d63118076fe0e'
const TZ = 'Asia/Shanghai'
const DEFAULT_WINDOW_DAYS = 7
const ROWS_PER_DAY = 500
const SCOPE = 'Cloudflare Web Analytics RUM（无 cookie、边缘自动采集）；北京时间自然日；会话只计入口请求，站内跳转行为 0；无 Referer 记为空；浏览器侧口径，不可与源站/边缘日志相加减'
const text = name => ({ name, type: 'text' })
const num = name => ({ name, type: 'number' })
const schemas = {
  '真实用户来源日报': [...['记录键', '日期', '来源域名', '来源路径', '落地页', '口径'].map(text), ...['页面浏览', '会话'].map(num)],
  '真实用户画像日报': [...['记录键', '日期', '国家', '设备', '浏览器', '系统', '口径'].map(text), ...['页面浏览', '会话'].map(num)],
}
const trafficFields = ['真实用户页面浏览', '真实用户会话'].map(num)
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
function option(name) {
  if (!args.includes(name)) return null
  const value = args[args.indexOf(name) + 1]
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`)
  return value
}
const dateArg = option('--date')
const daysArg = option('--days')
const beijingToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const beijingDate = date => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
// toISOString() would truncate to the UTC day and land a day early on a +08:00 boundary.
const shift = (day, days) => beijingDate(new Date(Date.parse(`${day}T00:00:00+08:00`) + days * 86400000))
function windowDays() {
  if (dateArg) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateArg) || shift(dateArg, 0) !== dateArg) throw new Error('Invalid --date')
    return [dateArg]
  }
  const count = daysArg ? Number(daysArg) : DEFAULT_WINDOW_DAYS
  if (!Number.isInteger(count) || count < 1 || count > 30) throw new Error('--days must be an integer between 1 and 30')
  const today = beijingToday()
  return Array.from({ length: count }, (_, index) => shift(today, -(index + 1)))
}
const days = windowDays()
for (const day of days) if (Date.parse(`${day}T00:00:00+08:00`) + 86400000 > Date.now()) throw new Error(`Refusing an incomplete calendar day: ${day}`)

function token() {
  const file = join(rootDir, 'seo/data/cloudflare-token.txt')
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN.trim()
  if (!existsSync(file)) throw new Error('Missing Cloudflare API token')
  return readFileSync(file, 'utf8').trim()
}
async function rum(selection, day) {
  const from = new Date(Date.parse(`${day}T00:00:00+08:00`)).toISOString()
  const to = new Date(Date.parse(`${day}T00:00:00+08:00`) + 86400000).toISOString()
  const query = `{viewer{accounts(filter:{accountTag:"${ACCOUNT_ID}"}){rumPageloadEventsAdaptiveGroups(limit:10000,filter:{datetime_geq:"${from}",datetime_lt:"${to}",siteTag:"${SITE_TAG}"},orderBy:[count_DESC]){${selection}}}}}`
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', signal: AbortSignal.timeout(60000),
    headers: { authorization: `Bearer ${token()}`, 'content-type': 'application/json' }, body: JSON.stringify({ query }) })
  const json = await res.json()
  if (!res.ok || json.errors?.length) throw new Error(`Cloudflare RUM: ${json.errors?.[0]?.message || res.status}`)
  const rows = json.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups
  if (!Array.isArray(rows)) throw new Error('Missing RUM response')
  if (rows.length >= 10000) throw new Error(`RUM group limit reached for ${day}; refusing a truncated report`)
  return rows
}
// lark-cli intermittently fails with "TLS handshake timeout"; the local proxy
// holds a fake IP for open.feishu.cn and flaps. Reads retry, writes stay single-shot.
const transient = /timeout|network|TLS|EOF|ECONN|socket hang up/i
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
function cli(cliArgs, attempts = 1) {
  for (let i = 0; ; i++) {
    try {
      const raw = execFileSync('lark-cli', cliArgs, { encoding: 'utf8', timeout: 120000, maxBuffer: 12 * 1024 * 1024 })
      const json = JSON.parse(raw)
      if (json.ok !== true) throw new Error(json.error?.message || 'Feishu operation failed')
      return json.data
    } catch (error) {
      if (i >= attempts - 1 || !transient.test(String(error.message || '') + String(error.stderr || ''))) throw error
      sleep(2000 * (i + 1))
    }
  }
}
const common = table => ['--base-token', BASE_TOKEN, '--table-id', table, '--as', 'user']
function tableMap() { return new Map((cli(['base', '+table-list', '--base-token', BASE_TOKEN, '--as', 'user', '--json'], 5).tables || []).map(t => [t.name, t.id])) }
const tables = dryRun ? new Map() : tableMap()
for (const name of Object.keys(schemas)) if (!dryRun && !tables.has(name)) throw new Error(`Missing table ${name}; run scripts/shimodocs-daily.mjs --setup first`)
function list(table) {
  const dir = mkdtempSync('/tmp/rum-records-')
  const rows = []
  try {
    for (let offset = 0; ; ) {
      const file = join(dir, `${offset}.ndjson`)
      let manifest
      for (let attempt = 0; ; attempt++) {
        try {
          const raw = execFileSync('lark-cli', ['base', '+record-list', ...common(table), '--format', 'ndjson', '--output', file, '--overwrite', '--limit', '2000', '--offset', String(offset)], { encoding: 'utf8', timeout: 120000, maxBuffer: 2 * 1024 * 1024 })
          manifest = JSON.parse(raw)
          break
        } catch (error) {
          if (attempt >= 4 || !transient.test(String(error.message || '') + String(error.stderr || ''))) throw error
          sleep(2000 * (attempt + 1))
        }
      }
      if (manifest.records_count !== undefined && manifest.has_more === undefined) throw new Error('Invalid record-list manifest')
      const batch = readFileSync(manifest.record_file || file, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
      rows.push(...batch)
      if (!manifest.has_more) return rows
      if (!batch.length) throw new Error('Feishu pagination made no progress')
      offset += batch.length
    }
  } finally { rmSync(dir, { recursive: true, force: true }) }
}
const key = row => createHash('sha256').update(JSON.stringify(row)).digest('hex').slice(0, 32)
const same = (a, b) => (a ?? '') === (b ?? '')
function upsert(table, rows) {
  if (!rows.length) return
  const existing = list(table)
  const index = new Map()
  for (const row of existing) {
    if (index.has(row['记录键'])) throw new Error(`Duplicate record key in ${table}`)
    index.set(row['记录键'], row.record_id)
  }
  for (let i = 0; i < rows.length; i += 100) {
    const create = [], update = {}
    for (const row of rows.slice(i, i + 100)) {
      const id = index.get(row['记录键'])
      if (id) update[id] = row
      else create.push(row)
    }
    if (create.length) cli(['base', '+record-batch-create', ...common(table), '--json', JSON.stringify({ create_records: create })])
    if (Object.keys(update).length) cli(['base', '+record-batch-update', ...common(table), '--json', JSON.stringify({ update_records: update })])
  }
  // Feishu reads can return the pre-write revision; re-read before calling a write wrong.
  for (let attempt = 0; ; attempt++) {
    const verify = new Map(list(table).map(row => [row['记录键'], row]))
    const bad = rows.filter(row => {
      const found = verify.get(row['记录键'])
      return !found || Object.entries(row).some(([field, value]) => !same(found[field], value))
    })
    if (!bad.length) return
    if (attempt >= 4) throw new Error(`Readback mismatch: ${table}`)
    sleep(2000)
  }
}
function sourceRows(day, rows, capped) {
  return rows.map(row => ({
    日期: day, 来源域名: row.dimensions.refererHost || '未知', 来源路径: row.dimensions.refererPath || (row.dimensions.refererHost ? '/' : ''),
    落地页: row.dimensions.requestPath || '/', 页面浏览: row.count, 会话: row.sum?.visits ?? 0, 口径: SCOPE + (capped ? `；仅保留页面浏览前 ${ROWS_PER_DAY} 行` : ''),
  })).map(row => ({ ...row, 记录键: key([row.日期, row.来源域名, row.来源路径, row.落地页]) }))
}
function audienceRows(day, rows, capped) {
  return rows.map(row => ({
    日期: day, 国家: row.dimensions.countryName || '未知', 设备: row.dimensions.deviceType || '未知',
    浏览器: row.dimensions.userAgentBrowser || '未知', 系统: row.dimensions.userAgentOS || '未知',
    页面浏览: row.count, 会话: row.sum?.visits ?? 0, 口径: SCOPE + (capped ? `；仅保留页面浏览前 ${ROWS_PER_DAY} 行` : ''),
  })).map(row => ({ ...row, 记录键: key([row.日期, row.国家, row.设备, row.浏览器, row.系统]) }))
}
async function main() {
  const summary = []
  const trafficByDay = new Map()
  for (const day of days) {
    const totals = (await rum('count sum{visits}', day))[0] || { count: 0, sum: { visits: 0 } }
    const sourceRaw = await rum('count sum{visits} dimensions{refererHost refererPath requestPath}', day)
    const audienceRaw = await rum('count sum{visits} dimensions{countryName deviceType userAgentBrowser userAgentOS}', day)
    const sources = sourceRows(day, sourceRaw.slice(0, ROWS_PER_DAY), sourceRaw.length > ROWS_PER_DAY)
    const audience = audienceRows(day, audienceRaw.slice(0, ROWS_PER_DAY), audienceRaw.length > ROWS_PER_DAY)
    if (!dryRun) {
      upsert(tables.get('真实用户来源日报'), sources)
      upsert(tables.get('真实用户画像日报'), audience)
    }
    trafficByDay.set(day, { 真实用户页面浏览: totals.count, 真实用户会话: totals.sum?.visits ?? 0 })
    summary.push({ 日期: day, 页面浏览: totals.count, 会话: totals.sum?.visits ?? 0, 来源行: sources.length, 画像行: audience.length })
  }
  if (!dryRun) {
    const traffic = list(TRAFFIC_TABLE)
    const paired = []
    for (const row of traffic) {
      const day = String(row.日期).slice(0, 10)
      const totals = trafficByDay.get(day)
      if (totals && Object.entries(totals).some(([field, value]) => !same(row[field], value))) paired.push([row.record_id, totals])
    }
    if (paired.length) {
      cli(['base', '+record-batch-update', ...common(TRAFFIC_TABLE), '--json', JSON.stringify({ update_records: Object.fromEntries(paired) })])
      for (let attempt = 0; ; attempt++) {
        const verified = new Map(list(TRAFFIC_TABLE).map(row => [row.record_id, row]))
        const bad = paired.filter(([id, totals]) => Object.entries(totals).some(([field, value]) => !same(verified.get(id)?.[field], value)))
        if (!bad.length) break
        if (attempt >= 4) throw new Error(`Traffic readback mismatch: ${bad[0][0]}`)
        sleep(2000)
      }
    }
    console.log(JSON.stringify({ days: summary, trafficRowsUpdated: paired.length }))
  } else {
    console.log(JSON.stringify({ dryRun: true, days: summary }))
  }
}
main().catch(error => { console.error(`失败：${error.message}`); process.exitCode = 1 })
