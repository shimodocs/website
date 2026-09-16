#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE_TOKEN = 'QRQWbBAeUafjX5svYTHcHRkGn6b';
const TABLE_ID = 'tblrA7s26Ehuqzqd';
const REPO = 'shimodocs/shimodocs';
const TZ = 'Asia/Shanghai';
const FIELDS = ['日期', '总计', 'amd64', 'arm64', '当日增量', '备注'];
const SOURCE = 'GitHub releases asset download_count（累计下载请求，含自动化/爬虫，非纯人类下载）；日期为北京时间采集日；当日增量为本次累计减前次日期快照，非自然日下载量';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const formatDate = date => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const normDate = value => typeof value === 'number' ? formatDate(new Date(value)) : String(value || '').match(/\d{4}-\d{2}-\d{2}/)?.[0];
const baseArgs = ['--base-token', BASE_TOKEN, '--table-id', TABLE_ID, '--as', 'user'];

function cli(args) {
  const result = JSON.parse(execFileSync('lark-cli', args, { encoding: 'utf8', timeout: 120_000, maxBuffer: 8 * 1024 * 1024 }));
  if (result.ok === false || (typeof result.code === 'number' && result.code !== 0)) {
    throw new Error(`lark-cli ${args.slice(0, 2).join(' ')} failed: ${JSON.stringify(result.error || result.msg || result.code)}`);
  }
  return result;
}

// NDJSON reads are explicitly paginated; never silently use the first 100/2000 rows.
function readRows() {
  const dir = mkdtempSync('/tmp/shimodocs-downloads-');
  const rows = [];
  const ids = new Set();
  try {
    for (let offset = 0; ; ) {
      const output = join(dir, `records-${offset}.ndjson`);
      const manifest = cli(['base', '+record-list', ...baseArgs, ...FIELDS.flatMap(field => ['--field-id', field]), '--format', 'ndjson', '--output', output, '--offset', String(offset), '--limit', '2000']);
      const page = readFileSync(output, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
      if (manifest.records_count !== page.length || typeof manifest.has_more !== 'boolean') throw new Error('Invalid record-list manifest');
      for (const row of page) {
        if (!row.record_id || ids.has(row.record_id)) throw new Error('Missing/duplicate record ID while paginating');
        ids.add(row.record_id);
        rows.push(row);
      }
      if (!manifest.has_more) return rows;
      if (!page.length) throw new Error('Empty record page with has_more=true');
      offset += page.length;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Reuse the installed gh authentication and proxy handling without extracting credentials.
async function githubFetch(url, options) {
  if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
    try {
      const body = execFileSync('gh', ['api', url], { encoding: 'utf8', timeout: 30_000, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
      return { ok: true, json: async () => JSON.parse(body) };
    } catch (error) {
      if (error.code !== 'ENOENT') {
        const stderr = String(error.stderr || '');
        const reason = /rate limit/i.test(stderr) ? 'GitHub API rate limit exceeded (HTTP 403/429)' : /HTTP 403/.test(stderr) ? 'GitHub API HTTP 403 forbidden' : `GitHub gh api request failed (${error.status ?? error.code})`;
        throw new Error(`${reason}; check gh auth status/network`);
      }
    }
  }
  return fetch(url, options);
}

export async function githubReleases(fetcher = githubFetch) {
  const headers = { 'User-Agent': 'shimodocs-downloads-script', Accept: 'application/vnd.github+json' };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const releases = [];
  for (let page = 1; ; page++) {
    let batch;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetcher(`https://api.github.com/repos/${REPO}/releases?per_page=100&page=${page}`, { headers, signal: AbortSignal.timeout(30_000) });
        if (!response.ok) throw new Error(`GitHub releases page ${page}: HTTP ${response.status}`);
        batch = await response.json();
        if (!Array.isArray(batch)) throw new Error('Invalid GitHub release response');
        break;
      } catch (error) {
        if (attempt === 2) throw error;
        await sleep(2 ** (attempt + 1) * 1000);
      }
    }
    releases.push(...batch);
    if (batch.length < 100) return releases;
  }
}

export function downloadTotals(releases) {
  const totals = { 总计: 0, amd64: 0, arm64: 0 };
  for (const release of releases) {
    for (const asset of release.assets || []) {
      const count = asset.download_count;
      if (!Number.isSafeInteger(count) || count < 0) throw new Error(`Invalid download_count for ${asset.name}`);
      totals.总计 += count;
      if (/-amd64-/.test(asset.name || '')) totals.amd64 += count;
      if (/-arm64-/.test(asset.name || '')) totals.arm64 += count;
    }
  }
  return totals;
}

export function snapshot(rows, totals, collectedAt = new Date()) {
  const date = formatDate(collectedAt);
  const dated = rows.map(row => ({ ...row, date: normDate(row.日期) }));
  const sameDay = dated.filter(row => row.date === date);
  if (sameDay.length > 1) throw new Error(`Duplicate snapshot date ${date}; refusing ambiguous update`);
  const previous = dated.filter(row => row.date && row.date < date).sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  let delta = null;
  let note = `${SOURCE}；采集时间 ${collectedAt.toISOString()}`;
  if (previous) {
    if (typeof previous.总计 !== 'number' || !Number.isFinite(previous.总计)) throw new Error('Previous snapshot total is missing/invalid');
    delta = totals.总计 - previous.总计;
    const gap = Math.round((Date.parse(`${date}T00:00:00+08:00`) - Date.parse(`${previous.date}T00:00:00+08:00`)) / 864e5);
    note += `；前次日期 ${previous.date}`;
    if (gap > 1) note += `；增量跨 ${gap} 天，中间日期无法补算`;
    if (delta < 0) note += '；累计值下降，可能删除/替换了 release 资产，增量不可当作新增下载';
    if (!String(previous.备注 || '').includes('采集时间 ')) note += '；前次采集时刻未记录，9点改8点的首个间隔可能不足24小时';
  } else note += '；基线，无前次日期可比';
  return { date, existingId: sameDay[0]?.record_id, payload: { ...totals, 当日增量: delta, 备注: note } };
}

export async function main(args = process.argv.slice(2)) {
  if (args.some(arg => arg !== '--dry-run')) throw new Error('Usage: github-downloads-daily.mjs [--dry-run]');
  const dryRun = args.includes('--dry-run');
  const auth = cli(['auth', 'status']);
  const user = auth.identities?.user;
  if (user?.status !== 'ready') throw new Error(`飞书授权状态: ${user?.status || 'unknown'}；请重新登录 lark-cli`);
  const scopes = String(user.scope || '').split(/\s+/);
  if (!dryRun) for (const scope of ['base:record:create', 'base:record:update']) if (!scopes.includes(scope)) throw new Error(`缺少必要 scope: ${scope}`);
  const fields = cli(['base', '+field-list', ...baseArgs, '--json']);
  const names = (fields.data?.fields || []).map(field => field.name);
  const missing = FIELDS.filter(field => !names.includes(field));
  if (missing.length) throw new Error(`字段缺失: ${missing.join(', ')}`);
  const releases = await githubReleases();
  const plan = snapshot(readRows(), downloadTotals(releases));
  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, releases: releases.length, ...plan }, null, 2));
    return;
  }
  if (plan.existingId) {
    cli(['base', '+record-batch-update', ...baseArgs, '--json', JSON.stringify({ update_records: { [plan.existingId]: plan.payload } })]);
  } else {
    cli(['base', '+record-batch-create', ...baseArgs, '--json', JSON.stringify({ create_records: [{ 日期: plan.date, ...plan.payload }] })]);
  }
  let verified = false;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await sleep(2000);
    const matches = readRows().filter(row => normDate(row.日期) === plan.date);
    verified = matches.length === 1 && Object.entries(plan.payload).every(([field, value]) => matches[0][field] === value);
    if (verified) break;
  }
  if (!verified) throw new Error('回读验证失败');
  const refreshWarning = user.refreshExpiresAt && new Date(user.refreshExpiresAt).getTime() - Date.now() < 3 * 864e5;
  console.log(JSON.stringify({ date: plan.date, verified, releases: releases.length, action: plan.existingId ? 'updated' : 'created', ...plan.payload, ...(refreshWarning ? { warning: '飞书授权即将过期' } : {}) }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
