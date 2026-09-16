#!/usr/bin/env node
// One daily run; source failures are isolated. No raw IP, credentials or UA archives.
import {execFileSync,spawnSync} from 'node:child_process'
import {readFileSync,writeFileSync,mkdirSync,rmSync,existsSync} from 'node:fs'
import {resolve,dirname,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root)
const BASE='QRQWbBAeUafjX5svYTHcHRkGn6b'
const dry=process.argv.includes('--dry-run'), setup=process.argv.includes('--setup')
const dateFlag=process.argv.indexOf('--date')
const date=dateFlag<0?new Date(Date.now()+8*3600000-86400000).toISOString().slice(0,10):process.argv[dateFlag+1]
if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'') || new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('Invalid --date')
if(dateFlag>=0&&!dry&&!setup)throw Error('--date is supported for dry-run inspection only; GitHub cannot backfill daily snapshots')
const text=name=>({name,type:'text'}),num=name=>({name,type:'number'})
const schemas={
 '来源与落地页日报':[...['记录键','日期','渠道','来源域名','来源URL','落地页','utm_source','utm_medium','utm_campaign','口径','数据状态'].map(text),...['入口请求','独立IP估算'].map(num)],
 '爬虫抓取明细':[...['记录键','日期','厂商','Bot','用途','页面','识别方式','统计范围','数据状态'].map(text),...['请求','成功请求','重定向请求','失败请求'].map(num)],
 '每日采集状态':[...['记录键','日期','数据源','状态','采集时间','说明'].map(text)],
}
const trafficFields=[...['采集起始','采集截止','采集时间','统计口径','采样情况','源站统计口径'].map(text),...['疑似人类页面浏览','疑似人类独立IP','未知页面请求','已知自动化页面请求'].map(num)]
function cli(args){
 const raw=execFileSync('lark-cli',args,{encoding:'utf8',timeout:120000,maxBuffer:12*1024*1024})
 const j=JSON.parse(raw);if(j.ok!==true)throw Error(j.error?.message||'Feishu operation failed');return j.data
}
const common=table=>['--base-token',BASE,'--table-id',table,'--as','user']
function preflight(){
 const user=JSON.parse(execFileSync('lark-cli',['auth','status','--json'],{encoding:'utf8',timeout:60000})).identities?.user
 if(user?.status!=='ready'){console.error(`飞书授权不可用（${user?.status||'unknown'}）。请运行：lark-cli auth login --no-wait --json --domain base,docs\n然后在浏览器打开返回的 verification_url 完成授权，完成后重新触发本任务。`);process.exit(2)}
 const scopes=String(user.scope||'').split(/\s+/)
 const missing=['base:table:create','base:field:create','base:record:create','base:record:update'].filter(s=>!scopes.includes(s))
 if(missing.length){console.error(`飞书授权缺少 scope：${missing.join('、')}。请运行：lark-cli auth login --no-wait --json --domain base,docs 重新授权后重试。`);process.exit(2)}
}
function fields(table){return cli(['base','+field-list',...common(table),'--json']).fields||[]}
function tableMap(){return new Map((cli(['base','+table-list','--base-token',BASE,'--as','user','--json']).tables||[]).map(t=>[t.name,t.id]))}
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
 const have=new Set(fields('tbl7IrEmsG0q4rEh').map(f=>f.name));const missing=trafficFields.filter(f=>!have.has(f.name))
 if(missing.length)cli(['base','+field-create',...common('tbl7IrEmsG0q4rEh'),'--json',JSON.stringify(missing)])
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
  const raw=execFileSync('lark-cli',['base','+record-list',...common(table),'--format','ndjson','--output',file,'--overwrite','--limit','2000','--offset',String(offset)],{encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024})
  const manifest=JSON.parse(raw);if(manifest.ok===false)throw Error('Feishu list failed')
  const batch=readFileSync(manifest.record_file||file,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);rows.push(...batch)
  if(!manifest.has_more)return rows
  if(!batch.length)throw Error('Feishu pagination made no progress');offset+=batch.length
 }
}
function key(row){return createHash('sha256').update(JSON.stringify(row)).digest('hex').slice(0,32)}
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
 const verify=new Map(list(table).map(r=>[r['记录键'],r]))
 for(const row of rows){const found=verify.get(row['记录键']);if(!found||Object.entries(row).some(([k,v])=>found[k]!==v))throw Error('Readback mismatch: '+table)}
}
function run(file,args=[]){
 const p=spawnSync(process.execPath,[file,...args],{cwd:root,encoding:'utf8',timeout:600000,maxBuffer:4*1024*1024})
 if(p.error||p.status!==0)throw Error((p.stderr||p.stdout||p.error?.message||'Process failed').slice(-1800))
 console.log(p.stdout.trim())
}
function origin(){
 const script=readFileSync(join(root,'scripts/analytics/origin-report.py'),'utf8')
 const raw=execFileSync('ssh',['-i',join(process.env.HOME,'.ssh/shimodocs_actions'),'-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=10','ubuntu@43.172.115.22','sudo -n python3 - '+date],{input:script,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024})
 return JSON.parse(raw)
}
let failed=false
if(setup){setupTables();console.log('Schema verified.');process.exit(0)}
const tables=tableMap();if(!dry){for(const n of Object.keys(schemas))if(!tables.has(n))throw Error('Missing table '+n+'; run --setup first')}
const statuses=[]
async function stage(name,fn){
 try{await fn();statuses.push({数据源:name,状态:'成功',说明:'采集及回读验证通过'})}
 catch(e){const msg=e.message.replace(/zone '[^']+'/g,'zone');const warmup=msg.includes('WARMUP:');if(!warmup)failed=true;console.error(name+': '+msg);statuses.push({数据源:name,状态:warmup?'待累计完整日':'失败',说明:msg})}
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
  const dayRows=list('tbl7IrEmsG0q4rEh').filter(r=>String(r.日期).slice(0,10)===date)
  if(dayRows.length!==1)throw Error('Need exactly one Cloudflare daily row before attaching origin summary')
  cli(['base','+record-batch-update',...common('tbl7IrEmsG0q4rEh'),'--json',JSON.stringify({update_records:{[dayRows[0].record_id]:{...data.summary,源站统计口径:JSON.stringify(data.coverage)}}})])
  const verified=list('tbl7IrEmsG0q4rEh').find(r=>r.record_id===dayRows[0].record_id)
  if(Object.entries(data.summary).some(([k,v])=>verified[k]!==v))throw Error('Origin summary readback mismatch')
 }
 console.log('Source rows:',rows.length,'Origin summary:',JSON.stringify(data.summary))
})
await stage('GitHub下载快照',()=>run('scripts/github-downloads-daily.mjs',dry?['--dry-run']:[]))
statuses.push({数据源:'Google Search Console收录',状态:'未接入',说明:'现有数据为手工导出基线；无自动API授权，不重写旧数据，不把未采集写0'})
const now=new Date().toISOString()
const rows=statuses.map(r=>({...r,说明:String(r.说明).replace(/\s+/g,' ').slice(0,500),日期:date,采集时间:now,记录键:key([date,r.数据源])}))
writeFileSync(join(artifactDir,'run.json'),JSON.stringify({date,dryRun:dry,collectedAt:now,statuses},null,2)+'\n',{mode:0o600})
if(!dry){try{upsert(tables.get('每日采集状态'),rows)}catch(e){console.error('Status write failed:',e.message);failed=true}}
console.log(`${date} | ${dry?'dry-run':'更新'} | ${failed?'部分失败':'完成'} | GSC未接入`)
process.exitCode=failed?1:0
