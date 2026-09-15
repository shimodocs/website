#!/usr/bin/env node
// Daily GitHub download statistics for the self-hosted installer.
//
// GitHub only exposes a cumulative `download_count` per release asset: there is
// no per-day, per-country or per-referrer number anywhere in the API. So the
// only way to know what happened on a given day is to snapshot the cumulative
// value every day and subtract. That is what this script does, and it is why it
// is meant to run on a schedule rather than on demand.
//
// It writes three things, all committed to the repository by the workflow:
//
//   data/downloads-history.json   every daily snapshot, the source of truth
//   data/downloads-daily.csv      one row per day, for a spreadsheet
//   reports/downloads/YYYY-MM.md  a human-readable month digest
//   data/downloads-latest.json    the newest snapshot, small enough to ship
//
// Usage:
//   node scripts/download-stats.mjs                     # snapshot, write, notify
//   node scripts/download-stats.mjs --dry-run           # print only, touch nothing
//   node scripts/download-stats.mjs --dry-run --notify  # test the card, archive nothing
//   node scripts/download-stats.mjs --print-payload     # dump the card JSON
//
// Environment:
//   GITHUB_TOKEN          optional; lifts the 60 req/hour anonymous rate limit
//   LARK_WEBHOOK          optional; Feishu/Lark custom-bot webhook URL
//   LARK_WEBHOOK_SECRET   optional; the bot's signing secret, if signing is on
//   SPIKE_THRESHOLD       optional; daily growth that counts as an anomaly
import { createHmac } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = join(rootDir, 'data')
const REPORT_DIR = join(rootDir, 'reports', 'downloads')
const HISTORY_FILE = join(DATA_DIR, 'downloads-history.json')
const LATEST_FILE = join(DATA_DIR, 'downloads-latest.json')
const CSV_FILE = join(DATA_DIR, 'downloads-daily.csv')

const PRODUCT_REPO = 'shimodocs/shimodocs'
const RELEASE_PAGE = `https://github.com/${PRODUCT_REPO}/releases`

// The report is written for the people who read it, not for the runner, so the
// day boundary is Beijing time. A run at 01:00 UTC is 09:00 in Shanghai, which
// is deliberately after midnight there: a "day" in the report is a full day.
const REPORT_TIME_ZONE = 'Asia/Shanghai'

// A daily jump this large is almost never customers. It is a mirror, a bot, or
// a crawler that walked the release page — worth flagging, not worth alerting on.
const SPIKE_THRESHOLD = Number(process.env.SPIKE_THRESHOLD || 200)

const dryRun = process.argv.includes('--dry-run')
// Lets a dry run exercise the webhook without archiving a snapshot, which is
// how the card is tested before the schedule is trusted with the real thing.
const notifyInDryRun = process.argv.includes('--notify')

// GH_TOKEN is what the GitHub CLI exports; accepting both means a local run
// picks up whichever token the developer already has.
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''

// --------------------------------------------------------------- GitHub API

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function github(path, attempt = 1) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'shimodocs-download-stats',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  })
  if (res.ok) return res.json()

  // A scheduled job gets one chance a day. A transient 5xx or a secondary rate
  // limit at 09:00 would otherwise cost that day permanently, because the
  // counter is cumulative and the next snapshot can only measure from itself.
  if ((res.status === 403 || res.status === 429 || res.status >= 500) && attempt < 3) {
    const wait = 2000 * attempt
    console.log(`GitHub ${path} returned ${res.status}; retrying in ${wait}ms (attempt ${attempt + 1}/3)`)
    await sleep(wait)
    return github(path, attempt + 1)
  }

  const remaining = res.headers.get('x-ratelimit-remaining')
  const reset = Number(res.headers.get('x-ratelimit-reset') || 0) * 1000
  const hint =
    remaining === '0' && reset
      ? ` — rate limit exhausted, resets at ${new Date(reset).toISOString()}${
          token ? '' : '; set GITHUB_TOKEN to lift the 60-requests-per-hour anonymous limit'
        }`
      : ''
  throw new Error(`GitHub ${path} failed: ${res.status} ${res.statusText}${hint}`)
}

async function fetchReleases() {
  const releases = []
  for (let page = 1; page <= 10; page += 1) {
    const batch = await github(`/repos/${PRODUCT_REPO}/releases?per_page=100&page=${page}`)
    releases.push(...batch)
    if (batch.length < 100) break
  }
  return releases
}

// Assets are tracked by id, never by file name. A rebuilt installer is uploaded
// under the same name and GitHub starts its counter at zero, so a name-based
// diff would report a huge negative day and hide the new build behind it.
function snapshotAssets(releases) {
  const assets = []
  for (const release of releases) {
    for (const asset of release.assets || []) {
      assets.push({
        key: `${release.id}:${asset.id}`,
        releaseId: release.id,
        releaseTag: release.tag_name,
        assetId: asset.id,
        name: asset.name,
        arch: (/-(amd64|arm64)-/.exec(asset.name) || [])[1] || null,
        sizeBytes: asset.size,
        downloads: asset.download_count,
        // Asset timestamps expose a re-upload even when the name is unchanged.
        updatedAt: asset.updated_at,
      })
    }
  }
  return assets.sort((a, b) => a.name.localeCompare(b.name))
}

// ------------------------------------------------------------ date handling

function dayIn(timeZone, date = new Date()) {
  // en-CA renders as YYYY-MM-DD, which is also the ISO form we want to store.
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date)
}

function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

// ------------------------------------------------------------------- history

function readHistory() {
  if (!existsSync(HISTORY_FILE)) {
    return { repo: PRODUCT_REPO, generatedAt: null, days: [] }
  }
  const parsed = JSON.parse(readFileSync(HISTORY_FILE, 'utf8'))
  if (!Array.isArray(parsed.days)) throw new Error(`${HISTORY_FILE} has no days array`)
  return parsed
}

function sumByArch(assets) {
  const totals = { amd64: null, arm64: null }
  for (const arch of Object.keys(totals)) {
    const matching = assets.filter(asset => asset.arch === arch)
    if (matching.length) totals[arch] = matching.reduce((sum, asset) => sum + asset.downloads, 0)
  }
  return totals
}

// Deltas are per asset, then added up. Summing first and subtracting after would
// let a deleted release cancel out a new one and report a calm day.
function deltasFor(assets, previousAssets) {
  const previous = new Map((previousAssets || []).map(asset => [asset.key, asset.downloads]))
  const byAsset = []
  let total = 0
  for (const asset of assets) {
    if (!previous.has(asset.key)) {
      // First sighting of a new asset: its whole count is growth for the day,
      // because an upload cannot have been downloaded before it existed.
      byAsset.push({ key: asset.key, name: asset.name, delta: asset.downloads, isNew: true })
      total += asset.downloads
      continue
    }
    const delta = asset.downloads - previous.get(asset.key)
    byAsset.push({ key: asset.key, name: asset.name, delta, isNew: false })
    total += delta
  }
  return { total, byAsset }
}

function buildSnapshot(date, repo, assets, previous) {
  const downloads = assets.reduce((sum, asset) => sum + asset.downloads, 0)
  const deltas = previous ? deltasFor(assets, previous.assets) : null
  return {
    date,
    capturedAt: new Date().toISOString(),
    downloads,
    delta: deltas ? deltas.total : null,
    deltaByAsset: deltas ? deltas.byAsset : null,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    byArch: sumByArch(assets),
    assets: assets.map(asset => ({
      key: asset.key,
      releaseTag: asset.releaseTag,
      name: asset.name,
      arch: asset.arch,
      downloads: asset.downloads,
    })),
  }
}

// Three flat days in a row is the shape of a broken download link rather than a
// quiet weekend, so the report says so instead of printing "0" forever.
function anomalies(snapshot, days) {
  const notes = []
  if (snapshot.delta !== null && snapshot.delta > SPIKE_THRESHOLD) {
    notes.push(`单日 +${snapshot.delta}，超过阈值 ${SPIKE_THRESHOLD}，疑似镜像或爬虫`)
  }
  for (const asset of snapshot.deltaByAsset || []) {
    if (asset.delta < 0) notes.push(`${asset.name} 减少 ${-asset.delta}，该 asset 可能被重新上传（计数器归零）`)
  }
  const recent = days.slice(-4)
  if (recent.length >= 4 && recent.slice(-3).every(day => day.delta === 0)) {
    notes.push('连续 3 天零增长，检查下载入口是否失效')
  }
  return notes
}

// ------------------------------------------------------------------- output

function csvCell(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function writeCsv(days) {
  const header = 'date,total,delta,amd64,arm64,stars,forks'
  const rows = days.map(day =>
    [day.date, day.downloads, day.delta, day.byArch?.amd64, day.byArch?.arm64, day.stars, day.forks]
      .map(csvCell)
      .join(','),
  )
  return `${[header, ...rows].join('\n')}\n`
}

function writeMonthReport(days, month) {
  const inMonth = days.filter(day => day.date.startsWith(month))
  const first = inMonth[0]
  const last = inMonth[inMonth.length - 1]
  const gained = first && last && first !== last ? last.downloads - first.downloads : null
  const totalDelta = inMonth.reduce((sum, day) => sum + (day.delta || 0), 0)

  const lines = [
    `# ShimoDocs 下载日报 · ${month}`,
    '',
    `数据源：[${PRODUCT_REPO} releases](${RELEASE_PAGE}) 的 asset \`download_count\`（累计值，按天做差）。`,
    '由 `.github/workflows/download-stats.yml` 每天北京时间 09:00 自动更新，请勿手工编辑。',
    '',
    '## 本月概览',
    '',
    `- 覆盖天数：${inMonth.length}`,
    `- 月末累计下载：${last ? last.downloads : '—'}`,
    gained === null ? '- 本月净增：—（不足两天数据）' : `- 本月净增：${gained >= 0 ? '+' : ''}${gained}`,
    `- 日报增量合计：${totalDelta >= 0 ? '+' : ''}${totalDelta}`,
    last ? `- Stars ${last.stars} · Forks ${last.forks}` : '',
    '',
    '## 每日明细',
    '',
    '| 日期 | 累计 | 当日增量 | amd64 | arm64 | Stars |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...inMonth.map(day => {
      const cells = [
        day.date,
        day.downloads,
        day.delta === null ? '基线' : `${day.delta >= 0 ? '+' : ''}${day.delta}`,
        day.byArch?.amd64 ?? '—',
        day.byArch?.arm64 ?? '—',
        day.stars,
      ]
      return `| ${cells.join(' | ')} |`
    }),
    '',
    '## 口径与已知偏差',
    '',
    '- GitHub 只提供**累计**下载数，不提供按天、按国家、按来源的拆分；本报表的"当日增量"是两次快照之差。',
    '- 该计数包含 GitHub 站内检索、镜像站、爬虫与 CDN 预热带来的下载，不等于官网真实获客数。',
    '- asset 被重新上传（同名新包）时计数器归零，因此按 `asset id` 追踪；归零会记为一次负增量并在异常里提示。',
    '- 官网来源的转化要看 Cloudflare/nginx 日志，与这里的数字对不上是正常的。',
    '',
  ].filter(line => line !== undefined)

  return `${lines.join('\n')}\n`
}

function printSummary(snapshot, days, notes) {
  const previousDay = days.length > 1 ? days[days.length - 2] : null
  const week = days.length > 7 ? snapshot.downloads - days[days.length - 8].downloads : null
  const delta = snapshot.delta === null ? '基线' : `${snapshot.delta >= 0 ? '+' : ''}${snapshot.delta}`
  console.log(`ShimoDocs 下载日报 ${snapshot.date}（北京时间）`)
  console.log(`  累计 ${snapshot.downloads}（${delta}）`)
  if (week !== null) console.log(`  近 7 日 +${week}`)
  console.log(`  amd64 ${snapshot.byArch.amd64 ?? '—'} · arm64 ${snapshot.byArch.arm64 ?? '—'}`)
  console.log(`  Stars ${snapshot.stars} · Forks ${snapshot.forks}`)
  if (previousDay) console.log(`  上一快照 ${previousDay.date}`)
  console.log(notes.length ? `  异常：${notes.join('；')}` : '  异常：无')
}

// ---------------------------------------------------------------- 飞书卡片

function feishuSign(secret, timestamp) {
  // Feishu signs the timestamp and secret as the HMAC key, with an empty body.
  return createHmac('sha256', `${timestamp}\n${secret}`).update('').digest('base64')
}

function cardPayload(snapshot, days, notes, link) {
  const delta = snapshot.delta === null ? '基线快照' : `${snapshot.delta >= 0 ? '+' : ''}${snapshot.delta}`
  const week = days.length > 7 ? `+${snapshot.downloads - days[days.length - 8].downloads}` : '—'
  const field = (label, value) => ({
    is_short: true,
    text: { tag: 'lark_md', content: `**${label}**\n${value}` },
  })

  return {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        template: notes.length ? 'orange' : 'blue',
        title: { tag: 'plain_text', content: `ShimoDocs 下载日报 · ${snapshot.date}` },
      },
      elements: [
        {
          tag: 'div',
          fields: [
            field('累计下载', `**${snapshot.downloads}**（${delta}）`),
            field('近 7 日', week),
            field('amd64', String(snapshot.byArch.amd64 ?? '—')),
            field('arm64', String(snapshot.byArch.arm64 ?? '—')),
            field('Stars', String(snapshot.stars)),
            field('Forks', String(snapshot.forks)),
          ],
        },
        ...(notes.length
          ? [
              { tag: 'hr' },
              { tag: 'div', text: { tag: 'lark_md', content: `⚠️ ${notes.join('\n⚠️ ')}` } },
            ]
          : []),
        {
          tag: 'note',
          elements: [
            {
              tag: 'lark_md',
              content: `GitHub 累计值按天做差 · 含镜像与爬虫 · [查看 releases](${link})`,
            },
          ],
        },
      ],
    },
  }
}

async function notifyLark(snapshot, days, notes) {
  const webhook = process.env.LARK_WEBHOOK
  if (!webhook) {
    console.log('未配置 LARK_WEBHOOK，跳过飞书通知。')
    return 'skipped'
  }
  const body = cardPayload(snapshot, days, notes, RELEASE_PAGE)
  const secret = process.env.LARK_WEBHOOK_SECRET
  if (secret) {
    const timestamp = String(Math.floor(Date.now() / 1000))
    body.timestamp = timestamp
    body.sign = feishuSign(secret, timestamp)
  }
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  // A webhook answers 200 with a non-zero `code` when the card is malformed or
  // the bot was removed, so the body has to be checked, not just the status.
  let parsed = null
  try {
    parsed = JSON.parse(text)
  } catch {
    // A non-JSON body is handled below by the status check.
  }
  if (!res.ok || (parsed && parsed.code !== undefined && parsed.code !== 0)) {
    throw new Error(`飞书推送失败: ${res.status} ${text.slice(0, 300)}`)
  }
  return 'sent'
}

// --------------------------------------------------------------------- main

async function main() {
  const date = dayIn(REPORT_TIME_ZONE)
  const [releases, repo] = await Promise.all([
    fetchReleases(),
    github(`/repos/${PRODUCT_REPO}`),
  ])
  const assets = snapshotAssets(releases)

  const history = readHistory()
  // Whether this is the first snapshot of the day, and whether the card for it
  // already went out. The workflow runs twice a day precisely so a failure at
  // 09:00 can be recovered at 21:00, which means the second run has to know not
  // to send the same card again — unless the first attempt failed to send it.
  const existing = history.days.find(day => day.date === date)
  const alreadyNotified = Boolean(existing?.notified)
  const forceNotify = process.argv.includes('--force-notify')

  const days = history.days.filter(day => day.date !== date)
  const previous = days.length ? days[days.length - 1] : null
  const snapshot = buildSnapshot(date, repo, assets, previous)
  snapshot.notified = alreadyNotified
  const nextDays = [...days, snapshot].sort((a, b) => a.date.localeCompare(b.date))
  const notes = anomalies(snapshot, nextDays)

  printSummary(snapshot, nextDays, notes)
  if (previous) console.log(`  距上一快照 ${daysBetween(previous.date, date)} 天`)
  if (existing) console.log(`  今天已有一份快照${alreadyNotified ? '，且日报已推送' : '，但日报尚未推送'}`)

  if (dryRun) {
    // Dumping the payload is how the card is reviewed without a webhook: a
    // malformed card is rejected by Feishu with HTTP 200 and a non-zero code,
    // so being able to read the JSON before wiring the bot matters.
    if (process.argv.includes('--print-payload')) {
      console.log(`\n${JSON.stringify(cardPayload(snapshot, nextDays, notes, RELEASE_PAGE), null, 2)}`)
    }
    if (notifyInDryRun) {
      try {
        console.log(`\n飞书通知（测试）：${await notifyLark(snapshot, nextDays, notes)}`)
      } catch (error) {
        console.log(`::warning::${error.message}`)
      }
    }
    console.log('\n--dry-run：未写入任何文件。')
    return
  }

  mkdirSync(DATA_DIR, { recursive: true })
  mkdirSync(REPORT_DIR, { recursive: true })

  const month = date.slice(0, 7)
  const writeArchive = () => {
    writeFileSync(
      HISTORY_FILE,
      `${JSON.stringify({ repo: PRODUCT_REPO, generatedAt: snapshot.capturedAt, days: nextDays }, null, 2)}\n`,
    )
    writeFileSync(LATEST_FILE, `${JSON.stringify({ ...snapshot, notes }, null, 2)}\n`)
  }

  // The archive is written before the notification, not after it: talking to a
  // webhook can hang, and a day of history must not depend on the bot
  // answering.
  writeFileSync(CSV_FILE, writeCsv(nextDays))
  writeFileSync(join(REPORT_DIR, `${month}.md`), writeMonthReport(nextDays, month))
  writeArchive()

  let notification = 'skipped'
  if (alreadyNotified && !forceNotify) {
    // The second run of the day refreshes the number but must not repeat the
    // card; --force-notify exists for resending one that was lost.
    notification = 'skipped（今天的日报已经推送过）'
  } else {
    try {
      notification = await notifyLark(snapshot, nextDays, notes)
      if (notification === 'sent') {
        // Recorded in the snapshot so a later run the same day knows the card
        // is out, and so a send that failed is retried at 21:00 rather than
        // lost.
        snapshot.notified = true
        writeArchive()
      }
    } catch (error) {
      // The archive on disk already covers the day, so this is a warning rather
      // than a failure; the next scheduled run retries the card.
      notification = `failed: ${error.message}`
      console.log(`::warning::${error.message}`)
    }
  }

  console.log(
    `已写入 data/downloads-history.json（${nextDays.length} 天）、data/downloads-daily.csv、` +
      `data/downloads-latest.json、reports/downloads/${month}.md；飞书通知：${notification}`,
  )
}

// A snapshot of a cumulative counter is the one thing here that cannot be
// recomputed later: missing a day leaves a permanent hole in the history. Two
// failures therefore deserve opposite outcomes.
//
// If the failure happens before the day is recorded, the run must fail loudly —
// the workflow is scheduled twice a day so the second attempt can still save
// the day. If the day is already archived, the same failure costs nothing, and
// failing the run would only paint the Actions tab red for no reason.
try {
  await main()
} catch (error) {
  let archived = false
  try {
    archived = !dryRun && readHistory().days.some(day => day.date === dayIn(REPORT_TIME_ZONE))
  } catch {
    archived = false
  }
  if (!archived) throw error
  console.log(`::warning::${error.message}`)
  console.log('今天的快照已经在库里，这次失败不影响这一天，按成功退出。')
}
