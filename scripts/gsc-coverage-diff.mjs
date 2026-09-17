#!/usr/bin/env node
// Compare two Search Console "Indexing > Pages" (Coverage) exports.
//
// Why this exists: Coverage is the one report with no API — Google exposes the per-URL
// verdicts through URL Inspection, but the reason taxonomy (Discovered, Crawled,
// 404, redirect, noindex, ...) only exists in this UI export. The daily run already
// covers the machine-readable half (scripts/gsc-report.mjs inspect --sitemap); this
// script turns the manual export into a one-command comparison so nobody has to read
// two screenshots side by side.
//
// The export is a zip per report. The top level of Indexing > Pages downloads one zip
// with Metadata.csv / Chart.csv / Critical issues.csv / Non-critical issues.csv; each
// individual reason additionally has its own export whose Metadata.csv names the issue
// and whose Table.csv lists the affected URLs.
//
// Usage
//   node scripts/gsc-coverage-diff.mjs seo/data/gsc-coverage-2026-09-17
//   node scripts/gsc-coverage-diff.mjs ~/Downloads/shimodocs.com-Coverage-2026-09-24.zip \
//     --prev seo/data/gsc-coverage-2026-09-17
// A .zip argument is extracted to a temporary directory first.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

const args = process.argv.slice(2)
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--prev')
const prevArg = args.includes('--prev') ? args[args.indexOf('--prev') + 1] : null
if (!positional.length) {
  console.error('用法：node scripts/gsc-coverage-diff.mjs <导出目录或zip> [--prev <上一次导出目录或zip>]')
  process.exit(1)
}

const temporaries = []
function resolveDir(path) {
  if (!existsSync(path)) throw new Error(`找不到：${path}`)
  if (statSync(path).isDirectory()) return path
  const dir = mkdtempSync(join(tmpdir(), 'gsc-coverage-'))
  temporaries.push(dir)
  execFileSync('unzip', ['-o', '-q', path, '-d', dir])
  // GSC zips sometimes nest everything one level down.
  const entries = readdirSync(dir)
  const nested = entries.filter(e => statSync(join(dir, e)).isDirectory())
  return nested.length === 1 && !entries.includes('Critical issues.csv') ? join(dir, nested[0]) : dir
}

function readCsv(path) {
  const text = readFileSync(path, 'utf8').replace(/^\uFEFF/, '')
  const rows = []
  let field = ''
  let row = []
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i += 1
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (ch !== '\r') field += ch
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  const [header, ...body] = rows.filter(r => r.some(c => c.trim() !== ''))
  return body.map(r => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

function readExport(dir) {
  // A drilldown export names one issue in Metadata.csv and lists the affected URLs in
  // Table.csv; the top-level export carries Critical/Non-critical issues instead.
  let drilldownIssue = null
  const metadataPath = join(dir, 'Metadata.csv')
  if (existsSync(metadataPath)) {
    for (const row of readCsv(metadataPath)) {
      if (row.Property === 'Issue' && row.Value) drilldownIssue = row.Value
    }
  }
  const tablePath = join(dir, 'Table.csv')
  const urls = existsSync(tablePath)
    ? readCsv(tablePath).map(r => ({ url: r.URL, lastCrawled: r['Last crawled'] })).filter(r => r.url)
    : []
  const issues = []
  for (const name of ['Critical issues.csv', 'Non-critical issues.csv']) {
    const path = join(dir, name)
    if (!existsSync(path)) continue
    for (const row of readCsv(path)) {
      const pages = Number(String(row.Pages ?? '').replace(/[^\d]/g, ''))
      if (!row.Reason || !Number.isFinite(pages)) continue
      issues.push({ reason: row.Reason, source: row.Source || '', validation: row.Validation || '', pages })
    }
  }
  const chartPath = join(dir, 'Chart.csv')
  let latest = null
  if (existsSync(chartPath)) {
    for (const row of readCsv(chartPath)) {
      if (row['Not indexed'] === '' && row.Indexed === '' && row['Affected pages'] === '') continue
      latest = {
        date: row.Date,
        notIndexed: Number(row['Not indexed'] || row['Affected pages'] || 0),
        indexed: Number(row.Indexed || 0),
        impressions: Number(row.Impressions || 0),
      }
    }
  }
  return { dir, issues, latest, drilldownIssue, urls }
}

function print(exportData, prev) {
  const label = basename(exportData.dir)
  console.log(`# ${label}`)
  if (exportData.latest) {
    const { date, notIndexed, indexed, impressions } = exportData.latest
    const parts = [`最后一次对账日 ${date}`]
    if (exportData.drilldownIssue) parts.push(`原因「${exportData.drilldownIssue}」 ${notIndexed} 条`)
    else parts.push(`已编入 ${indexed} / 未编入 ${notIndexed} / 展示 ${impressions}`)
    console.log(parts.join('：'))
  }
  if (exportData.drilldownIssue && exportData.urls.length) {
    console.log('')
    console.log(['URL', 'Last crawled'].join('\t'))
    for (const row of exportData.urls) console.log([row.url, row.lastCrawled || '-'].join('\t'))
    return
  }
  const reasons = new Map(exportData.issues.map(i => [i.reason, i]))
  const prevReasons = new Map((prev?.issues || []).map(i => [i.reason, i]))
  const names = [...new Set([...reasons.keys(), ...prevReasons.keys()])]
  if (!names.length) {
    console.log('这份导出里没有原因明细（只有 Drilldown 才会带 Table.csv，顶层导出应含 Critical issues.csv）')
    return
  }
  console.log('')
  console.log(['原因', 'Pages', prev ? '上次' : '', prev ? '变化' : '', 'Source', 'Validation'].filter(Boolean).join('\t'))
  for (const name of names.sort((a, b) => (reasons.get(b)?.pages ?? 0) - (reasons.get(a)?.pages ?? 0))) {
    const now = reasons.get(name)
    const before = prevReasons.get(name)
    const cells = [name, now ? String(now.pages) : '—']
    if (prev) {
      cells.push(before ? String(before.pages) : '—')
      const delta = (now?.pages ?? 0) - (before?.pages ?? 0)
      cells.push(delta === 0 ? '=' : delta > 0 ? `+${delta}` : String(delta))
    }
    if (now) cells.push(now.source, now.validation)
    console.log(cells.filter(c => c !== undefined).join('\t'))
  }
  const total = exportData.issues.reduce((n, i) => n + i.pages, 0)
  console.log('')
  console.log(`合计未编入（本导出所列原因）: ${total}`)
}

try {
  const current = readExport(resolveDir(positional[0]))
  const previous = prevArg ? readExport(resolveDir(prevArg)) : null
  print(current, previous)
} finally {
  for (const dir of temporaries) rmSync(dir, { recursive: true, force: true })
}
