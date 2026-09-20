#!/usr/bin/env node
// Cloudflare daily aggregates: one complete Asia/Shanghai calendar day.
// Adaptive groups are estimates; UA identities are not verified crawler identities.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASE_TOKEN, FEISHU_IDENTITY, TABLES, larkArgs, larkEnv } from './analytics-target.mjs'
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TABLE_ID = TABLES.traffic
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
function option(name) {
  if (!args.includes(name)) return null
  const value = args[args.indexOf(name) + 1]
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`)
  return value
}
const outputArg = option('--output')
const dateArg = option('--date')
const catalog = [
  ['Anthropic','ClaudeBot','训练'], ['Anthropic','Claude-SearchBot','搜索'], ['Anthropic','Claude-User','用户触发'], ['Anthropic','anthropic-ai','训练'],
  ['ByteDance','Bytespider','训练'], ['Google','Googlebot','搜索'], ['Google','Google-Extended','训练'],
  ['Microsoft','Bingbot','搜索'], ['OpenAI','GPTBot','训练'], ['OpenAI','OAI-SearchBot','搜索'], ['OpenAI','ChatGPT-User','用户触发'],
  ['Huawei','PetalBot','搜索'], ['Perplexity','PerplexityBot','搜索'], ['Perplexity','Perplexity-User','用户触发'],
  ['Apple','Applebot-Extended','训练'], ['Apple','Applebot','搜索'], ['Common Crawl','CCBot','训练'], ['DuckDuckGo','DuckAssistBot','搜索'],
  ['Meta','meta-externalagent','训练'], ['Amazon','Amazonbot','搜索/其他'], ['Yandex','YandexBot','搜索'],
]
const BOT_HINT = /bot|crawler|spider|slurp|curl|wget|python|node|go-http|java|scan|libwww|okhttp|axios/i
function token() {
  const file = join(rootDir, 'seo/data/cloudflare-token.txt')
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN.trim()
  if (!existsSync(file)) throw new Error('Missing Cloudflare API token')
  return readFileSync(file, 'utf8').trim()
}
async function request(url, body) {
  const res = await fetch(url, {method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(60000),
    headers: {authorization: `Bearer ${token()}`, 'content-type':'application/json'}, ...(body ? {body: JSON.stringify(body)} : {})})
  const json = await res.json()
  if (!res.ok || json.success === false || json.errors?.length) throw new Error(`Cloudflare: ${json.errors?.[0]?.message || res.status}`)
  return json
}
async function zoneId() {
  if (process.env.CLOUDFLARE_ZONE_ID) return process.env.CLOUDFLARE_ZONE_ID
  const json = await request('https://api.cloudflare.com/client/v4/zones?name=shimodocs.com')
  if (!json.result?.[0]) throw new Error('No shimodocs.com zone visible')
  return json.result[0].id
}
const day = dateArg || new Date(Date.now() + 8 * 3600000 - 86400000).toISOString().slice(0,10)
if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(`${day}T00:00:00Z`).toISOString().slice(0,10) !== day) throw new Error('Invalid --date')
const start = Date.parse(`${day}T00:00:00+08:00`)
const end = start + 86400000
if (end > Date.now()) throw new Error('Refusing an incomplete calendar day')
const scope = '北京时间自然日；Cloudflare Adaptive；eyeball；shimodocs.com/www.shimodocs.com；UA估算，非验证Bot；独立IP不可获取'
async function collect(zone) {
  const counts = {total:0, '404':0, '301':0, '5xx':0}
  const bots = {crawl:0,googlebot:0,bingbot:0,yandexbot:0,ai:0}
  const countries = new Map(), crawlers = new Map()
  let bytes = 0, cached = 0, sampleIntervalMax = 0
  const intervals = []
  for (let i = 0; i < 24; i++) {
    const from = new Date(start+i*3600000).toISOString(), to = new Date(start+(i+1)*3600000).toISOString()
    const query = `{viewer{zones(filter:{zoneTag:"${zone}"}){httpRequestsAdaptiveGroups(limit:10000,filter:{datetime_geq:"${from}",datetime_lt:"${to}",requestSource:"eyeball",clientRequestHTTPHost_in:["shimodocs.com","www.shimodocs.com"]}){count sum{edgeResponseBytes} avg{sampleInterval} dimensions{edgeResponseStatus userAgent clientCountryName cacheStatus clientRequestPath}}}}}`
    const json = await request('https://api.cloudflare.com/client/v4/graphql', {query})
    const rows = json.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups
    if (!Array.isArray(rows)) throw new Error(`Missing Adaptive response for ${from}`)
    if (rows.length >= 10000) throw new Error(`Group limit reached for ${from}; refusing truncated report`)
    intervals.push({from,to,groups:rows.length})
    for (const r of rows) {
      if (!Number.isFinite(r.count) || !Number.isFinite(r.sum?.edgeResponseBytes) || !Number.isFinite(r.avg?.sampleInterval)) throw new Error(`Invalid aggregate in ${from}`)
      const d = r.dimensions, n = r.count, ua = d.userAgent || '', code = d.edgeResponseStatus
      counts.total += n; bytes += r.sum.edgeResponseBytes
      if (d.cacheStatus === 'hit') cached += n
      sampleIntervalMax = Math.max(sampleIntervalMax,r.avg.sampleInterval)
      if (code === 404) counts['404'] += n
      if ([301,302].includes(code)) counts['301'] += n
      if (code >= 500) counts['5xx'] += n
      countries.set(d.clientCountryName,(countries.get(d.clientCountryName)||0)+n)
      // Match named crawlers first: ChatGPT-User and Claude-User lack "bot".
      const bot = catalog.find(([,name]) => ua.toLowerCase().includes(name.toLowerCase()))
      if (bot || BOT_HINT.test(ua)) bots.crawl += n
      if (/googlebot/i.test(ua)) bots.googlebot += n
      if (/bingbot/i.test(ua)) bots.bingbot += n
      if (/yandexbot/i.test(ua)) bots.yandexbot += n
      if (bot && !['Googlebot','Bingbot','PetalBot','Applebot','YandexBot'].includes(bot[1])) bots.ai += n
      if (!bot) continue
      const [vendor,name,purpose] = bot, path = d.clientRequestPath || '/'
      const key = JSON.stringify([name,path])
      const row = crawlers.get(key) || {日期:day,厂商:vendor,Bot:name,用途:purpose,页面:path,请求:0,成功请求:0,重定向请求:0,失败请求:0,识别方式:'Cloudflare User-Agent匹配（可伪造，非验证身份）',统计范围:scope}
      row.请求 += n
      if (code >= 200 && code < 300) row.成功请求 += n
      else if (code >= 300 && code < 400) row.重定向请求 += n
      else if (code >= 400) row.失败请求 += n
      crawlers.set(key,row)
    }
  }
  return {counts,bots,bytes,cached,sampleIntervalMax,intervals,crawlerRows:[...crawlers.values()],top:[...countries].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c,n])=>`${c} ${n}`).join(' / ')}
}
function lark(args) {
  const json = JSON.parse(execFileSync('lark-cli',larkArgs(args),{env:larkEnv,encoding:'utf8',timeout:90000,maxBuffer:8*1024*1024}))
  if (json.ok === false || json.success === false || (json.code !== undefined && json.code !== 0)) throw new Error(`lark-cli failed: ${JSON.stringify(json)}`)
  return json
}
function records(fields) {
  // lark-cli only writes --output under cwd, /tmp or ~/files; macOS tmpdir() is elsewhere.
  const dir=mkdtempSync('/tmp/cf-records-'), all=[]
  try {
    for(let offset=0;;) {
      const file=join(dir,`${offset}.ndjson`)
      const meta=lark(['base','+record-list','--base-token',BASE_TOKEN,'--table-id',TABLE_ID,'--as',FEISHU_IDENTITY,'--format','ndjson','--output',file,'--limit','2000','--offset',String(offset),...fields.flatMap(x=>['--field-id',x])])
      all.push(...readFileSync(file,'utf8').split('\n').filter(Boolean).map(x=>JSON.parse(x)))
      if(meta.has_more === false) return all
      if(!Number.isInteger(meta.next_offset)||meta.next_offset<=offset) throw new Error('Incomplete record pagination')
      offset=meta.next_offset
    }
  } finally {rmSync(dir,{recursive:true,force:true})}
}
async function main() {
  const per=await collect(await zoneId()), collectedAt=new Date().toISOString()
  const row={日期:day,总请求:per.counts.total,独立IP:null,流量MB:Number((per.bytes/1048576).toFixed(1)),缓存命中率:per.counts.total?Number((per.cached/per.counts.total*100).toFixed(1)):null,
    '404数':per.counts['404'],'301数':per.counts['301'],'5xx数':per.counts['5xx'],爬虫请求:per.bots.crawl,Googlebot:per.bots.googlebot,Bingbot:per.bots.bingbot,YandexBot:per.bots.yandexbot,AI爬虫:per.bots.ai,Top国家:per.top,
    异常:'爬虫按UA估算；非爬虫请求不可直接当作人类访问；成功响应不等于Allowed；缓存命中仅cacheStatus=hit',采集起始:new Date(start).toISOString(),采集截止:new Date(end).toISOString(),采集时间:collectedAt,统计口径:scope,采样情况:`Adaptive估算；最大平均采样间隔 ${per.sampleIntervalMax}；24小时完整；分组上限未触发`}
  const report={collectedAt,date:day,row,crawlerRows:per.crawlerRows,daily:{date:day,requests:per.counts.total,cached:per.cached,bytes:per.bytes,uniques:null},per:{...per,window:{from:row.采集起始,to:row.采集截止}},caveats:[scope,'Success is 2xx, not Cloudflare Allowed. No absence-of-bot claim proves human traffic.']}
  if(outputArg) writeFileSync(resolve(outputArg),JSON.stringify(report,null,2)+'\n')
  console.log(JSON.stringify(row,null,2))
  if(dryRun) {console.log('--dry-run：未写入飞书。');return}
  const matches=records(['日期']).filter(r=>String(r.日期).slice(0,10)===day)
  if(matches.length>1) throw new Error(`Duplicate traffic date ${day}; refusing arbitrary update`)
  const common=['--base-token',BASE_TOKEN,'--table-id',TABLE_ID,'--as',FEISHU_IDENTITY]
  if(matches[0]) lark(['base','+record-batch-update',...common,'--json',JSON.stringify({update_records:{[matches[0].record_id]:row}})])
  else lark(['base','+record-batch-create',...common,'--json',JSON.stringify({create_records:[row]})])
  for(let attempt=0;attempt<5;attempt++) {
    const saved=records(Object.keys(row)).filter(r=>String(r.日期).slice(0,10)===day)
    if(saved.length===1 && Object.entries(row).every(([k,v])=>k==='日期'||(saved[0][k]??null)===v)) {console.log(`已写入并回读校验 ${day}`);return}
    await new Promise(r=>setTimeout(r,2000))
  }
  throw new Error('Write returned but full row read-back verification failed')
}
await main().catch(error=>{console.error(`失败：${error.message}`);process.exitCode=1})
