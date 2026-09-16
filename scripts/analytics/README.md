# Daily acquisition and traffic reports

Run `node scripts/shimodocs-daily.mjs --dry-run` to inspect all sources without
Feishu writes. Run `--setup` once to create/validate the three additional tables
and traffic metadata fields, then run without flags to update and read back data.
The local Codex automation runs this entry point at 08:00 Asia/Shanghai. It needs
this Mac available, its SSH key, `lark-cli` user authorization, `gh` authorization,
and the existing Cloudflare token (outside version control). Credentials are not
copied to the server. This is not an unattended server scheduler.

Cloudflare and source tables use the previous complete Beijing calendar day.
GitHub rows are cumulative snapshots on the actual collection date; the delta is
from the latest earlier snapshot and includes automated downloads. GSC remains
manual until a Search Console API identity is authorized. The status table marks
that source as not connected rather than repeating a stale baseline.

Source/human estimates only accept shimodocs.com/www traffic where the origin
peer falls in Cloudflare's published ranges, then use CF-Connecting-IP for daily
IP deduplication. Raw IPs and UAs stay on the origin. Known automated UAs and
unknown clients are not counted as likely human. Browser-looking scanners can
still pass this heuristic: these are estimates, not verified people or sessions.
Only successful GET requests to real prerendered pages contribute to human PV.
Internal referrals are excluded from source-entry rows. Multiple external entries
by the same person are not a session metric. Source URLs omit query strings and
fragments; inbound UTM source/medium/campaign values are separate columns.

The origin does not see edge-cache hits or edge-blocked traffic. Do not subtract
origin counts from Cloudflare totals, or call missing Referer traffic proven direct.
Cloudflare crawler identities are UA estimates on the current Free plan, not
verified bots. Successful responses are not the dashboard's "Allowed requests".
Crawler activity is evidence of fetching, not evidence of AI citation or conversion.

## Reading the tables

Each table answers a different question; no single cell is the answer.

| Question | Table | Columns |
| --- | --- | --- |
| How much traffic, how much of it is automation, from where | `流量观测` | `总请求`, `爬虫请求`, `疑似人类页面浏览`, `疑似人类独立IP`, `未知页面请求`, `404数`, `Top国家` |
| Where arrivals came from and where they landed | `来源与落地页日报` | `渠道`, `来源域名`, `来源URL`, `落地页`, `utm_source`/`utm_medium`/`utm_campaign`, `入口请求`, `独立IP估算` |
| Which crawler fetched which page | `爬虫抓取明细` | `厂商`, `Bot`, `用途`, `页面`, `请求`, `成功请求`, `重定向请求`, `失败请求` |
| Whether the collection ran and which source broke | `每日采集状态` | `数据源`, `状态`, `说明`, `采集时间` |
| Where visitors came from, with the full referring URL | `真实用户来源日报` | `来源域名`, `来源路径`, `落地页`, `页面浏览`, `会话` |
| Who the visitors were | `真实用户画像日报` | `国家`, `设备`, `浏览器`, `系统`, `页面浏览`, `会话` |

`渠道` splits 站内 / 推广（UTM）/ AI引荐 / 搜索引荐 / 外部引荐 / 直接-来源未知.
An absent Referer is "unknown", not "direct": HTTPS clients, privacy settings and
`rel=noreferrer` links all drop it, so the direct row is a ceiling, never a
headcount. Referer detail is also capped by the sending page's policy — browsers
default to origin-only cross-site, so external rows usually carry a bare domain
and only UTM parameters or same-site navigation carry a full path.

The human columns are a heuristic, not person counts. `疑似人类页面浏览` accepts
successful GETs to real prerendered pages whose user agent is not a known
automated one; `疑似人类独立IP` deduplicates those per day by client address, so
two devices are two and a browser-shaped scanner is one. There are no sessions,
no events and no conversion tracking: a download click or a form submission is
not observable from the origin, and the GitHub rows are a demand proxy rather
than a per-source outcome.

The origin only sees what reached it — no edge cache hits, no edge-blocked
requests — while Cloudflare Adaptive totals are sampled estimates that can read
below the origin count. Never add or subtract the two.

## Cloudflare Web Analytics (RUM)

This is the only source with a complete referring URL: the beacon runs in the
browser and reports to Cloudflare's edge, while a referral that arrives as a
request has already been reduced to a bare origin by the sending page's policy.
`真实用户来源日报` and `真实用户画像日报` come from it, and the two `真实用户*`
columns on `流量观测` are its daily totals. Sessions count entries only, so
same-site rows carry zero sessions by design.

The beacon is injected by Cloudflare's edge (automatic setup is on for this
proxied zone), so the repository still ships no JavaScript to article or guide
pages. Reading the data needs an API token with **Account -> Account Analytics ->
Read** and the account included under Account Resources; a zone-scoped token
alone answers `not authorized for that account`. The site is identified by
`CLOUDFLARE_RUM_SITE_TAG` (default in `scripts/rum-daily.mjs`); the account holds
other sites, whose rows must never be mixed in. One query covers at most 13 weeks,
and every run re-reads a 7-day window, so late-arriving page loads and missed days
correct themselves instead of freezing a partial number.

Feishu reads can return the revision from before a write, so writes are verified
by re-reading until the values match. `lark-cli` also fails intermittently with
`TLS handshake timeout` because the local proxy holds a fake IP for
`open.feishu.cn`; reads retry, writes stay single-shot so a timed-out create
cannot duplicate a row.

## Origin setup and maintenance

Install `deploy/nginx/analytics-log-format.conf` as
`/etc/nginx/conf.d/shimodocs-analytics.conf` BEFORE enabling the two access_log
lines in the site config. Keep the original access log. Validate with `nginx -t`,
then reload Nginx. The Ubuntu `/etc/logrotate.d/nginx` wildcard already rotates
both logs daily and retains 14 rotations. The production configuration was patched
in place on 2026-09-16 with a backup, preserving unrelated live settings.

Install `cloudflare-ips.txt` at
`/var/lib/shimodocs-analytics/cloudflare-ips.txt`, and record the initial timestamp
in `installed-at.txt`. Only days after the installation day have complete coverage.
Dedicated logging began 2026-09-16; the first full report is for 2026-09-17,
available at 2026-09-18 08:00. Missing history is not backfilled from generic logs.
Refresh CIDRs from https://www.cloudflare.com/ips-v4 and /ips-v6 when Cloudflare
changes its ranges; join responses with a newline and validate every CIDR before
installing. No real_ip directives or origin access-control rules are altered.

Daily aggregates/readback artifacts are retained locally in ignored
`seo/data/daily/YYYY-MM-DD/`. These contain no credentials or raw IPs. Collection
is isolated by source and writes are idempotent by date+dimensions with readback.
A lock prevents overlapping normal runs. Auth/write failures are reported as
failures; initial origin warmup and unconnected GSC are explicit statuses.

Verification: `python3 scripts/analytics/origin-report.test.py`, Node syntax
checks, live dry-run, live Feishu readback, and repository `npm run build`.
