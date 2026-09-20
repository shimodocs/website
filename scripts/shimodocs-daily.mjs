#!/usr/bin/env node
// One daily run; source failures are isolated. No raw IP, credentials or UA archives.
import {execFileSync,spawnSync} from 'node:child_process'
import {readFileSync,writeFileSync,mkdirSync,rmSync,existsSync} from 'node:fs'
import {resolve,dirname,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {BASE_TOKEN as BASE,FEISHU_AUTH_COMMAND,SSH_PROXY,TABLES,larkArgs,larkEnv} from './analytics-target.mjs'
import {DEFAULT_KEY_PATH,DEFAULT_SITE,createGscClient,indexLedger,sitemapUrls} from './gsc-client.mjs'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root)
const dry=process.argv.includes('--dry-run'), setup=process.argv.includes('--setup')
const dateFlag=process.argv.indexOf('--date')
const date=dateFlag<0?new Date(Date.now()+8*3600000-86400000).toISOString().slice(0,10):process.argv[dateFlag+1]
const ORIGIN_FIRST_FULL_DAY='2026-09-17'
if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'') || new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('Invalid --date')
if(dateFlag>=0&&!dry&&!setup)throw Error('--date is supported for dry-run inspection only; GitHub cannot backfill daily snapshots')
const text=name=>({name,type:'text'}),num=name=>({name,type:'number'})
const schemas={
 '来源与落地页日报':[...['记录键','日期','渠道','来源域名','来源URL','落地页','utm_source','utm_medium','utm_campaign','口径','数据状态'].map(text),...['入口请求','独立IP估算'].map(num)],
 '爬虫抓取明细':[...['记录键','日期','厂商','Bot','用途','页面','识别方式','统计范围','数据状态'].map(text),...['请求','成功请求','重定向请求','失败请求'].map(num)],
 '每日采集状态':[...['记录键','日期','数据源','状态','采集时间','说明'].map(text)],
 '真实用户来源日报':[...['记录键','日期','来源域名','来源路径','落地页','口径'].map(text),...['页面浏览','会话'].map(num)],
 '真实用户画像日报':[...['记录键','日期','国家','设备','浏览器','系统','口径'].map(text),...['页面浏览','会话'].map(num)],
 'Google搜索查询×页面明细':[
  ...['记录键','采集日','窗口起始','窗口截止','查询','页面','规范页面','品牌分类','机会分类','意图簇','数据源','口径'].map(text),
  ...['点击','曝光'].map(num),
  {name:'点击率',type:'number',style:{type:'plain',precision:4,percentage:true}},
  {name:'平均排名',type:'number',style:{type:'plain',precision:2,percentage:false}},
 ],
}
const trafficFields=[...['采集起始','采集截止','采集时间','统计口径','采样情况','源站统计口径'].map(text),...['疑似人类页面浏览','疑似人类独立IP','未知页面请求','已知自动化页面请求','真实用户页面浏览','真实用户会话'].map(num)]
// lark-cli intermittently fails with "TLS handshake timeout" against open.feishu.cn.
// Reads retry; writes stay single-shot so a timed-out create cannot duplicate a row.
const transient=/timeout|network|TLS|EOF|ECONN|socket hang up/i
const sleep=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms)
function cli(args,attempts=1){
 for(let i=0;;i++){
  try{
   const raw=execFileSync('lark-cli',larkArgs(args),{env:larkEnv,encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024})
   const j=JSON.parse(raw);if(j.ok!==true)throw Error(j.error?.message||'Feishu operation failed');return j.data
  }catch(e){
   if(i>=attempts-1||!transient.test(String(e.message||'')+String(e.stderr||'')))throw e
   sleep(2000*(i+1))
  }
 }
}
const common=table=>['--base-token',BASE,'--table-id',table,'--as','user']
// An expired access token does not need a new browser login: the CLI refreshes it on the
// next user-scoped call. `auth status` alone never triggers that refresh, so a run that
// starts more than two hours after the previous one would read `needs_refresh` and abort
// even though the token is perfectly recoverable — measured 2026-09-17: status said
// needs_refresh, one `base +record-list` call flipped it to valid. Probe once, then decide.
function larkUser(){
 return JSON.parse(execFileSync('lark-cli',larkArgs(['auth','status','--json']),{env:larkEnv,encoding:'utf8',timeout:60000})).identities?.user
}
function refreshLarkUser(){
 try{
  execFileSync('lark-cli',larkArgs(['base','+record-list',...common(TABLES.collectionStatus),'--limit','1','--json']),{env:larkEnv,encoding:'utf8',timeout:90000,maxBuffer:4*1024*1024,stdio:['ignore','ignore','ignore']})
 }catch(error){
  console.error(`刷新飞书 token 的探测调用失败：${String(error.message||error).slice(0,200)}`)
 }
 return larkUser()
}
function preflight(){
 let user=larkUser()
 if(user?.status!=='ready')user=refreshLarkUser()
 if(user?.status!=='ready'){console.error(`飞书授权不可用（${user?.status||'unknown'}）。请运行：${FEISHU_AUTH_COMMAND}\n然后在浏览器打开返回的 verification_url，使用有 officesdk 工作区权限的账号完成授权；完成后重新触发本任务。`);process.exit(2)}
 const scopes=String(user.scope||'').split(/\s+/)
 const missing=['base:table:create','base:field:create','base:record:create','base:record:update'].filter(s=>!scopes.includes(s))
 if(missing.length){console.error(`飞书授权缺少 scope：${missing.join('、')}。请运行：${FEISHU_AUTH_COMMAND} 重新授权后重试。`);process.exit(2)}
}
function fields(table){return cli(['base','+field-list',...common(table),'--json'],5).fields||[]}
function tableMap(){return new Map((cli(['base','+table-list','--base-token',BASE,'--as','user','--json'],5).tables||[]).map(t=>[t.name,t.id]))}
function setupTables(){
 const tables=tableMap()
 for(const [name,schema] of Object.entries(schemas)){
  if(!tables.has(name)){
   const data=cli(['base','+table-create','--base-token',BASE,'--name',name,'--fields',JSON.stringify(schema),'--as','user','--json'])
   console.log('Created table:',name);tables.clear();for(const [n,id]of tableMap())tables.set(n,id)
  }
  const have=new Set(fields(tables.get(name)).map(f=>f.name));const missing=schema.filter(f=>!have.has(f.name))
  if(missing.length)cli(['base','+field-create',...common(tables.get(name)),'--json',JSON.stringify(missing)])
 }
 const have=new Set(fields(TABLES.traffic).map(f=>f.name));const missing=trafficFields.filter(f=>!have.has(f.name))
 if(missing.length)cli(['base','+field-create',...common(TABLES.traffic),'--json',JSON.stringify(missing)])
 return tables
}
const lockDir=join(root,'seo/data/.daily-update-lock')
preflight()
if(!dry&&!setup){
 mkdirSync(dirname(lockDir),{recursive:true,mode:0o700})
 try{mkdirSync(lockDir,{mode:0o700})}
 catch(e){
  if(e.code!=='EEXIST')throw e
  let pid;try{pid=Number(readFileSync(join(lockDir,'pid'),'utf8'))}catch{throw Error('Daily update lock incomplete; inspect before retry')}
  try{process.kill(pid,0);throw Error('Another daily update is running')}catch(err){if(err.code!=='ESRCH')throw err}
  rmSync(lockDir,{recursive:true});mkdirSync(lockDir,{mode:0o700})
 }
 writeFileSync(join(lockDir,'pid'),String(process.pid),{mode:0o600})
 process.on('exit',()=>rmSync(lockDir,{recursive:true,force:true}))
}
const artifactDir=join(root,'seo/data/daily',date);mkdirSync(artifactDir,{recursive:true,mode:0o700})
function list(table){
 let offset=0,rows=[]
 for(;;){
  const file=join(artifactDir,`records-${table}-${offset}.ndjson`)
  let manifest
  for(let attempt=0;;attempt++){
   try{
    const raw=execFileSync('lark-cli',larkArgs(['base','+record-list',...common(table),'--format','ndjson','--output',file,'--overwrite','--limit','2000','--offset',String(offset)]),{env:larkEnv,encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024})
    manifest=JSON.parse(raw);if(manifest.ok===false)throw Error('Feishu list failed');break
   }catch(e){
    if(attempt>=4||!transient.test(String(e.message||'')+String(e.stderr||'')))throw e
    sleep(2000*(attempt+1))
   }
  }
  const batch=readFileSync(manifest.record_file||file,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);rows.push(...batch)
  if(!manifest.has_more)return rows
  if(!batch.length)throw Error('Feishu pagination made no progress');offset+=batch.length
 }
}
function key(row){return createHash('sha256').update(JSON.stringify(row)).digest('hex').slice(0,32)}
const same=(a,b)=>(a??'')===(b??'')
const canonicalBlogPages=new Map([
 ['/blogs/private-cloud-collaboration-guide','https://shimodocs.com/blog/what-is-private-cloud-document-collaboration'],
 ['/blogs/secure-cloud-collaboration','https://shimodocs.com/blog/secure-cloud-collaboration'],
 ['/blogs/google-docs-alternative-private-cloud','https://shimodocs.com/blog/google-docs-alternative-private-cloud'],
 ['/blogs/data-sovereignty-enterprise-control','https://shimodocs.com/blog/data-sovereignty-document-collaboration'],
 ['/blogs/private-cloud-vs-public-cloud-document-collaboration','https://shimodocs.com/blog/what-is-private-cloud-document-collaboration'],
 ['/blogs/web3-security-tools-resources','https://shimodocs.com/blog/web3-security-tools-resources'],
])
function canonicalPage(page){
 try{
  const value=String(page||''),url=new URL(value)
  return canonicalBlogPages.get(url.pathname.replace(/\/+$/,'')||'/') || value
 }catch{return String(page||'')}
}
// Feishu reads can return the pre-write revision; re-read before calling a write wrong.
function verifyRows(table,rows){
 for(let attempt=0;;attempt++){
  const found=new Map(list(table).map(r=>[r['记录键'],r]))
  const bad=rows.filter(row=>{const hit=found.get(row['记录键']);return !hit||Object.entries(row).some(([k,v])=>!same(hit[k],v))})
  if(!bad.length)return
  if(attempt>=4)throw Error('Readback mismatch: '+table)
  sleep(2000)
 }
}
function upsert(table,rows){
 const dimensionTable=table===tables.get('来源与落地页日报')||table===tables.get('爬虫抓取明细')
 const existing=list(table),index=new Map()
 if(dimensionTable){
  rows=rows.map(r=>({...r,数据状态:'有效'}))
  const wanted=new Set(rows.map(r=>r['记录键']))
  const schema=schemas[table===tables.get('来源与落地页日报')?'来源与落地页日报':'爬虫抓取明细']
  for(const old of existing){
   if(old.日期===date&&!wanted.has(old['记录键'])){
    const expired={记录键:old['记录键'],数据状态:'已失效（本次采集未出现）'}
    for(const f of schema.filter(f=>f.type==='number'))expired[f.name]=0
    rows.push(expired)
   }
  }
 }
 if(!rows.length)return
 for(const row of existing){if(index.has(row['记录键']))throw Error('Duplicate record key in '+table);index.set(row['记录键'],row.record_id)}
 for(let i=0;i<rows.length;i+=100){
  const create=[],update={}
  for(const row of rows.slice(i,i+100)){const id=index.get(row['记录键']);if(id)update[id]=row;else create.push(row)}
  if(create.length)cli(['base','+record-batch-create',...common(table),'--json',JSON.stringify({create_records:create})])
  if(Object.keys(update).length)cli(['base','+record-batch-update',...common(table),'--json',JSON.stringify({update_records:update})])
 }
 verifyRows(table,rows)
}
function run(file,args=[]){
 const p=spawnSync(process.execPath,[file,...args],{cwd:root,encoding:'utf8',timeout:600000,maxBuffer:4*1024*1024})
 if(p.error||p.status!==0)throw Error((p.stderr||p.stdout||p.error?.message||'Process failed').slice(-1800))
 console.log(p.stdout.trim())
}
function origin(){
 if(date<ORIGIN_FIRST_FULL_DAY)throw Error(`WARMUP: 专用日志从2026-09-16开始；首个完整北京时间日为${ORIGIN_FIRST_FULL_DAY}，2026-09-18 08:00可更新；历史数据不伪造`)
 const script=readFileSync(join(root,'scripts/analytics/origin-report.py'),'utf8')
 const args=['-i',join(process.env.HOME,'.ssh/shimodocs_actions'),'-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=10','-o',`ProxyCommand=nc -x ${SSH_PROXY} -X connect %h %p`,'ubuntu@43.172.115.22','sudo -n python3 - '+date]
 for(let attempt=0;;attempt++){
  try{return JSON.parse(execFileSync('ssh',args,{input:script,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024}))}
  catch(e){
   const message=String(e.message||'')+String(e.stderr||'')
   if(message.includes('WARMUP:')||attempt>=2||!transient.test(message))throw e
   sleep(2000*(attempt+1))
  }
 }
}
let failed=false
if(setup){setupTables();console.log('Schema verified.');process.exit(0)}
const tables=tableMap();if(!dry){for(const n of Object.keys(schemas))if(!tables.has(n))throw Error('Missing table '+n+'; run --setup first')}
const statuses=[]
// The 08:00 automation runs outside version control and has no alerting, so a day that
// never ran is invisible: nothing writes a row about a run that did not happen, and
// Cloudflare's per-request dataset has a one-day window, so the miss cannot be
// backfilled. Look for the previous day's artifact and record the gap here instead.
const CONTINUITY_FROM=process.env.SHIMODOCS_CONTINUITY_FROM||'2026-09-16'
const previousDay=new Date(new Date(date+'T00:00:00Z').getTime()-86400000).toISOString().slice(0,10)
if(previousDay>=CONTINUITY_FROM&&!existsSync(join(root,'seo/data/daily',previousDay,'run.json'))){
 console.error(`采集连续性：${previousDay} 没有 run.json`)
 statuses.push({数据源:'采集连续性（前一日）',状态:'失败',说明:`${previousDay} 没有 run.json：当天 08:00 采集未运行或未落盘。Cloudflare per-request 数据集只有 1 天窗口，该日数据已无法回补；源站日志保留 14 天，可按需补读。`})
}
async function stage(name,fn){
 try{const note=await fn();statuses.push({数据源:name,状态:'成功',说明:typeof note==='string'&&note?note:'采集及回读验证通过'});return note}
 catch(e){const msg=e.message.replace(/zone '[^']+'/g,'zone');const warmup=msg.includes('WARMUP:');if(!warmup)failed=true;console.error(name+': '+msg);statuses.push({数据源:name,状态:warmup?'待累计完整日':'失败',说明:msg});return null}
}
await stage('Cloudflare / SEO-GEO抓取',()=>{
 const output=join(artifactDir,'cloudflare.json')
 run('scripts/cloudflare-daily.mjs',[...(dry?['--dry-run']:[]),'--date',date,'--output',output])
 const cf=JSON.parse(readFileSync(output,'utf8'))
 const rows=(cf.crawlerRows||[]).map(r=>({...r,记录键:key([r.日期,r.厂商,r.Bot,r.用途,r.页面])}))
 if(!cf.crawlerRows)throw Error('Missing crawlerRows in collector output')
 if(!dry)upsert(tables.get('爬虫抓取明细'),rows)
 console.log('Crawler rows:',rows.length)
})
await stage('源站来源 / 疑似人类',()=>{
 const data=origin();writeFileSync(join(artifactDir,'origin.json'),JSON.stringify(data,null,2)+'\n',{mode:0o600})
 const rows=data.sourceRows.map(r=>({...r,记录键:key([r.日期,r.渠道,r.来源域名,r.来源URL,r.落地页,r.utm_source,r.utm_medium,r.utm_campaign])}))
 if(!dry){
  upsert(tables.get('来源与落地页日报'),rows)
  const dayRows=list(TABLES.traffic).filter(r=>String(r.日期).slice(0,10)===date)
  if(dayRows.length!==1)throw Error('Need exactly one Cloudflare daily row before attaching origin summary')
  cli(['base','+record-batch-update',...common(TABLES.traffic),'--json',JSON.stringify({update_records:{[dayRows[0].record_id]:{...data.summary,源站统计口径:JSON.stringify(data.coverage)}}})])
  let verified
  for(let attempt=0;;attempt++){
   verified=list(TABLES.traffic).find(r=>r.record_id===dayRows[0].record_id)
   if(!Object.entries(data.summary).some(([k,v])=>!same(verified?.[k],v)))break
   if(attempt>=4)throw Error('Origin summary readback mismatch')
   sleep(2000)
  }
 }
 console.log('Source rows:',rows.length,'Origin summary:',JSON.stringify(data.summary))
})
await stage('GitHub下载快照',()=>run('scripts/github-downloads-daily.mjs',dry?['--dry-run']:[]))
await stage('Cloudflare RUM 真实用户',()=>run('scripts/rum-daily.mjs',dry?['--dry-run']:[]))
// Google Search Console is a point-in-time reading, not a daily aggregate: the sitemap's
// last-download date and the per-URL index verdicts describe the moment of collection.
// Coverage (Indexing > Pages) has no API, so this replaces it as the daily index signal
// and the two must never be added together. The full sweep is 133 inspections against a
// 2,000/day quota; --no-gsc-inspect keeps the rest of the run fast when that is enough.
let gscNote='GSC API：本次未运行（--no-gsc-inspect）'
if(process.argv.includes('--no-gsc-inspect')){
 statuses.push({数据源:'Google Search Console API',状态:'已跳过',说明:'--no-gsc-inspect：本次只跑其余四个数据源'})
}else{
gscNote=await stage('Google Search Console API',async()=>{
 const gsc=createGscClient({keyPath:join(root,process.env.GSC_SERVICE_ACCOUNT||DEFAULT_KEY_PATH),site:process.env.GSC_SITE||DEFAULT_SITE})
 const sites=await gsc.listSites()
 const entry=(sites.siteEntry||[]).find(e=>e.siteUrl===gsc.site)
 if(!entry)throw Error(`服务账号 ${gsc.clientEmail} 看不到 ${gsc.site}；检查 Search Console 的用户与权限`)
 const sitemaps=await gsc.listSitemaps()
 const urls=await sitemapUrls(300)
 const rows=await gsc.inspect(urls,{concurrency:4})
 // Only the stable buckets go into the note. The discovered-vs-unknown split flips on
 // repeated calls for the same URL, so quoting it would make the status row churn daily.
 const ledger=indexLedger(rows)
 const end=new Date(Date.now()-86400000).toISOString().slice(0,10)
 const start=new Date(Date.now()-28*86400000).toISOString().slice(0,10)
 const queries=await gsc.searchAnalytics(['query'],{startDate:start,endDate:end})
 const queryPages=await gsc.searchAnalytics(['query','page'],{startDate:start,endDate:end,rowLimit:1000})
 const totals=(queries.rows||[]).reduce((a,r)=>({clicks:a.clicks+(r.clicks||0),impressions:a.impressions+(r.impressions||0)}),{clicks:0,impressions:0})
 writeFileSync(join(artifactDir,'gsc-sitemaps.json'),JSON.stringify(sitemaps,null,2)+'\n')
 writeFileSync(join(artifactDir,'gsc-index.json'),JSON.stringify({site:gsc.site,inspectedAt:new Date().toISOString(),ledger,rows},null,2)+'\n')
 writeFileSync(join(artifactDir,'gsc-analytics.json'),JSON.stringify({startDate:start,endDate:end,totals,queries},null,2)+'\n')
 writeFileSync(join(artifactDir,'gsc-query-page.json'),JSON.stringify({startDate:start,endDate:end,queryPages},null,2)+'\n')
 const queryPageTable=tables.get('Google搜索查询×页面明细') || TABLES.queryPage
 if(!dry&&queryPageTable){
  const classifyBrand=query=>/\bshimo(?:docs?|office)?\b/i.test(query)?'品牌':'非品牌'
  const classifyIntent=query=>{
   const q=query.toLowerCase()
   if(/nextcloud/.test(q))return'Nextcloud竞品'
   if(/google\s*docs?|google\s*document/.test(q)&&/(alternative|replacement|private|self.hosted|on.?prem|deployment|cloud)/.test(q))return'Google Docs私有化替代'
   if(/private.?cloud|self.hosted|on.?prem|air.?gapped|data sovereignty/.test(q))return'私有化/部署'
   if(/\b(?:secure|security|compliance|sovereignty|gdpr|iso(?:27001)?)\b/.test(q))return'安全/合规'
   return'其他'
  }
  const classifyOpportunity=row=>{
   if((row.clicks||0)>0)return'已有点击'
   if((row.impressions||0)>=10&&(row.position||999)<=10)return'高排名零点击'
   if((row.impressions||0)>=5&&(row.position||999)<=20)return'中排名零点击'
   if((row.impressions||0)>=5)return'有量待观察'
   return'低样本'
  }
  const queryPageRows=(queryPages.rows||[]).map(row=>{
   const query=String(row.keys?.[0]||''),page=String(row.keys?.[1]||'')
   return {
    '记录键':key([date,start,end,query,page]),'采集日':date,'窗口起始':start,'窗口截止':end,
    '查询':query,'页面':page,'规范页面':canonicalPage(page),'品牌分类':classifyBrand(query),'机会分类':classifyOpportunity(row),
    '意图簇':classifyIntent(query),'数据源':'Google Search Console',
    '口径':'28天 Search Analytics query×page 聚合；按窗口快照保存；不与访问日志相加',
    '点击':row.clicks||0,'曝光':row.impressions||0,'点击率':row.ctr||0,'平均排名':row.position||0,
   }
  })
  upsert(queryPageTable,queryPageRows)
  console.log('Query×page rows:',queryPageRows.length)
 }
 const first=(sitemaps.sitemap||[])[0]||{}
 return `采集时刻读数（非当日聚合）：sitemap lastDownloaded=${first.lastDownloaded||'-'} ${(first.contents||[]).map(c=>`${c.type}:${c.submitted}`).join(' ')}；索引 ${ledger.total} 条 sitemap URL：${ledger.indexed} 已收录 / ${ledger.notIndexed} 未收录（${ledger.queued} 已排队或未知 + ${ledger.crawled} 抓过未收录 + ${ledger.excluded} noindex + ${ledger.errored} 查询失败）；Search Analytics ${start}→${end} ${totals.clicks} 点击 / ${totals.impressions} 展示；query×page ${(queryPages.rows||[]).length} 行`
})
}
const now=new Date().toISOString()
const rows=statuses.map(r=>({...r,说明:String(r.说明).replace(/\s+/g,' ').slice(0,500),日期:date,采集时间:now,记录键:key([date,r.数据源])}))
writeFileSync(join(artifactDir,'run.json'),JSON.stringify({date,dryRun:dry,collectedAt:now,statuses},null,2)+'\n',{mode:0o600})
if(!dry){try{upsert(tables.get('每日采集状态'),rows)}catch(e){console.error('Status write failed:',e.message);failed=true}}
console.log(`${date} | ${dry?'dry-run':'更新'} | ${failed?'部分失败':'完成'}`)
console.log(`  GSC：${gscNote||'采集失败'}`)
process.exitCode=failed?1:0
