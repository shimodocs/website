#!/usr/bin/env python3
"""Aggregate origin access logs; raw IPs never leave the origin."""
import collections, datetime as dt, gzip, json, pathlib, re, sys, ipaddress
from urllib.parse import urlsplit, parse_qs, unquote
TZ=dt.timezone(dt.timedelta(hours=8))
BOT=re.compile(r'bot|crawl|spider|slurp|curl|wget|python|node|go-http|java|scan|libwww|okhttp|axios|headless|playwright|puppeteer|anthropic|perplexity|chatgpt|claude[-/ ]|google-extended|meta-external|duckassist|oai-search|googleother|google-inspectiontool|bingpreview|microsoftpreview|bingvideopreview|facebookexternalhit|facebookcatalog|twitterbot|linkedinbot|slackbot|discordbot',re.I)
LINE=re.compile(r'^(\S+) .*?\[([^]]+)\] "([^"]*)" (\d+) \d+ "([^"]*)" "([^"]*)"')
HOSTS={'shimodocs.com','www.shimodocs.com'}
def classify(ua):
    if BOT.search(ua): return '已知自动化（UA估算）'
    if re.search(r'Mozilla/5\.0.*(?:Chrome/|Firefox/|Safari/|Edg/)',ua): return '疑似人类'
    return '未知'
def source(ref,query):
    utm={k:(parse_qs(query).get(k,[''])[0])[:200] for k in ['utm_source','utm_medium','utm_campaign']}
    try:
        u=urlsplit(ref); host=(u.hostname or '').lower()
        clean=f'{u.scheme}://{host}{u.path}' if u.scheme in ['http','https'] and host else ''
    except ValueError: host=clean=''
    if host in HOSTS: channel='站内'
    elif utm['utm_source']: channel='推广（UTM）'
    elif host in ['chatgpt.com','chat.openai.com','perplexity.ai','claude.ai','gemini.google.com','copilot.microsoft.com'] or host.endswith('.perplexity.ai'): channel='AI引荐'
    elif host in ['www.google.com','www.bing.com','search.yahoo.com','duckduckgo.com'] or host.startswith('www.google.'): channel='搜索引荐'
    elif host: channel='外部引荐'
    else: channel='直接/来源未知'
    return channel,host,clean[:1000],utm

def report(date,log_dir='/var/log/nginx',root='/var/www/shimodocs/current'):
    day=dt.date.fromisoformat(date); counts=collections.Counter(); visitors=set(); groups={}; event_groups={}; times=[]; legacy=False; bad=0
    cidr_file=pathlib.Path('/var/lib/shimodocs-analytics/cloudflare-ips.txt')
    if not cidr_file.exists(): cidr_file=pathlib.Path('scripts/analytics/cloudflare-ips.txt')
    nets=[ipaddress.ip_network(n.strip()) for n in cidr_file.read_text().splitlines() if n.strip()]
    files=sorted(pathlib.Path(log_dir).glob('shimodocs-analytics.log*'))
    if not files: raise RuntimeError('Dedicated origin analytics logs not yet available; no legacy substitute')
    for p in files:
        op=gzip.open if p.suffix=='.gz' else open
        with op(p,'rt',errors='replace') as f:
            for line in f:
                try:
                    entry=json.loads(line)
                    stamp=dt.datetime.fromisoformat(entry['time']).astimezone(TZ)
                    peer=ipaddress.ip_address(entry['peer'])
                    if entry['host'] not in HOSTS or not any(peer in n for n in nets): continue
                    ip=str(ipaddress.ip_address(entry['client']))
                    req=f"{entry['method']} {entry['uri']} HTTP/1.1"
                    status=str(entry['status']);ref=entry['referer'];ua=entry['ua']
                except (ValueError,KeyError): bad+=1; continue
                if stamp.date()!=day: continue
                times.append(stamp.isoformat()); parts=req.split()
                if len(parts)!=3: continue
                try: u=urlsplit(parts[1]); path=unquote(u.path)
                except ValueError: continue
                # Browser click beacons use the same dedicated log. They are
                # intentionally parsed before the page-only GET gate: the
                # request may be a POST and the endpoint has no static file.
                # The query is untrusted and only a small,
                # allow-listed event shape is accepted.
                if path=='/__analytics/event':
                    if parts[0]!='POST' or status!='204' or classify(ua)!='疑似人类': continue
                    try:
                        query=parse_qs(u.query,keep_blank_values=True,max_num_fields=8)
                        if any(len(values)!=1 for values in query.values()): continue
                        if set(query)-{'event','arch','surface','page','entry_host','entry_path','release'}: continue
                        event=query.get('event',[''])[0]; arch=query.get('arch',[''])[0]
                        surface=query.get('surface',[''])[0]; page=query.get('page',[''])[0]
                        ref_url=urlsplit(ref)
                        if ref_url.scheme not in {'http','https'} or ref_url.hostname not in HOSTS or ref_url.path!=page: continue
                        if not page.startswith('/') or page.startswith('//') or '..' in pathlib.PurePosixPath(page).parts: continue
                        if '?' in page or '#' in page or not (pathlib.Path(root)/page.lstrip('/')/'index.html').is_file(): continue
                        valid=(event=='download_click' and arch in {'amd64','arm64'} and
                               ((page=='/' and surface in {'home_hero','home_meta'}) or
                                (page=='/download' and surface in {'download_primary','download_package'}))) or (
                               event=='license_request_click' and not arch and
                               (surface=='footer' or (page=='/' and surface=='home_hero') or
                                (page=='/download' and surface=='download_license'))) or (
                               event in {'contact_sales_start','contact_sales_submit','contact_sales_success'} and
                               not arch and page=='/contact-sales' and surface=='contact_sales_form') or (
                               event=='contact_sales_cta' and not arch and surface in {'contact_link','hub_cta'})
                        if not valid: continue
                        entry_host=query.get('entry_host',[''])[0].lower()
                        if entry_host and (len(entry_host)>120 or not re.fullmatch(r'[a-z0-9]+(?:[.-][a-z0-9]+)*',entry_host)): continue
                        entry_path=query.get('entry_path',[''])[0]
                        if entry_path and (not entry_path.startswith('/') or entry_path.startswith('//')): continue
                        entry_path=urlsplit(entry_path).path[:500]
                    except ValueError: continue
                    key=(event,arch,surface,page,entry_host or '未知',entry_path)
                    g=event_groups.setdefault(key,{'count':0,'ips':set()});g['count']+=1;g['ips'].add(ip)
                    continue
                if parts[0]!='GET': continue
                # Only real prerendered pages, not extensions, probes or assets.
                if '..' in pathlib.PurePosixPath(path).parts: continue
                target=pathlib.Path(root)/path.lstrip('/')/'index.html'
                if not target.is_file(): continue
                kind=classify(ua); counts[kind]+=1
                if kind!='疑似人类' or int(status)!=200: continue
                counts['疑似人类页面浏览']+=1; visitors.add(ip)
                channel,host,clean,utm=source(ref,u.query)
                if channel=='站内': continue
                key=(channel,host,clean,u.path,utm['utm_source'],utm['utm_medium'],utm['utm_campaign'])
                g=groups.setdefault(key,{'count':0,'ips':set()});g['count']+=1;g['ips'].add(ip)
    installed=pathlib.Path('/var/lib/shimodocs-analytics/installed-at.txt')
    if installed.exists() and day <= dt.datetime.fromisoformat(installed.read_text().strip()).astimezone(TZ).date():
        started=dt.datetime.fromisoformat(installed.read_text().strip()).astimezone(TZ).date()
        first=started+dt.timedelta(days=1);available=started+dt.timedelta(days=2)
        raise RuntimeError(f'WARMUP: 专用日志从{started}开始；首个完整北京时间日为{first}，{available} 08:00可更新；历史数据不伪造')
    if not times: raise RuntimeError('No trusted Cloudflare records for requested date; refusing zero substitute')
    rows=[]; event_rows=[]
    note='可信Cloudflare代理+域名过滤；UA估算非验证人类；仅源站非边缘缓存/拦截；来源URL省略查询参数；页面以当前发布路由识别；IP去重不是人数'
    for key,g in sorted(groups.items(),key=lambda x:-x[1]['count']):
        channel,host,ref,path,us,um,uc=key
        rows.append({'日期':date,'渠道':channel,'来源域名':host or '未知','来源URL':ref or '未知','落地页':path,'utm_source':us,'utm_medium':um,'utm_campaign':uc,'入口请求':g['count'],'独立IP估算':len(g['ips']),'口径':note})
    event_note='同源浏览器事件 beacon；按可信 Cloudflare 代理日志聚合；点击不等于下载成功、安装完成或销售线索；首次可观察来源由浏览器 sessionStorage 提供，可能为空或被客户端伪造；站内来源不代表外部首次来源，静态文章入口的外部来源无法关联；来源路径省略查询参数与片段'
    for key,g in sorted(event_groups.items(),key=lambda x:-x[1]['count']):
        event,arch,surface,page,entry_host,entry_path=key
        event_rows.append({'日期':date,'事件':event,'页面':page,'位置':surface or '未知','架构':arch or '不适用','来源域名':entry_host,'来源路径':entry_path,'点击次数':g['count'],'独立IP估算':len(g['ips']),'口径':event_note,'数据状态':'有效'})
    return {'date':date,'sourceRows':rows,'eventRows':event_rows,'summary':{'疑似人类页面浏览':counts['疑似人类页面浏览'],'疑似人类独立IP':len(visitors),'未知页面请求':counts['未知'],'已知自动化页面请求':counts['已知自动化（UA估算）']},'coverage':{'firstObserved':min(times),'lastObserved':max(times),'unparsedLines':bad,'note':note,'eventNote':event_note}}
if __name__=='__main__':
    print(json.dumps(report(sys.argv[1]),ensure_ascii=False))
