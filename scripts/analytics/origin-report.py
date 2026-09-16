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
    day=dt.date.fromisoformat(date); counts=collections.Counter(); visitors=set(); groups={}; times=[]; legacy=False; bad=0
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
                if len(parts)!=3 or parts[0]!='GET': continue
                try: u=urlsplit(parts[1]); path=unquote(u.path)
                except ValueError: continue
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
    rows=[]
    note='可信Cloudflare代理+域名过滤；UA估算非验证人类；仅源站非边缘缓存/拦截；来源URL省略查询参数；页面以当前发布路由识别；IP去重不是人数'
    for key,g in sorted(groups.items(),key=lambda x:-x[1]['count']):
        channel,host,ref,path,us,um,uc=key
        rows.append({'日期':date,'渠道':channel,'来源域名':host or '未知','来源URL':ref or '未知','落地页':path,'utm_source':us,'utm_medium':um,'utm_campaign':uc,'入口请求':g['count'],'独立IP估算':len(g['ips']),'口径':note})
    return {'date':date,'sourceRows':rows,'summary':{'疑似人类页面浏览':counts['疑似人类页面浏览'],'疑似人类独立IP':len(visitors),'未知页面请求':counts['未知'],'已知自动化页面请求':counts['已知自动化（UA估算）']},'coverage':{'firstObserved':min(times),'lastObserved':max(times),'unparsedLines':bad,'note':note}}
if __name__=='__main__':
    print(json.dumps(report(sys.argv[1]),ensure_ascii=False))
