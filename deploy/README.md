# Ubuntu + GitHub Actions deployment

The [shimodocs/website](https://github.com/shimodocs/website) workflow publishes only on a pushed `v*` tag. It builds `dist/` on the GitHub runner, uploads it over SSH, and atomically switches `/var/www/shimodocs/current` to the new release. The Ubuntu machine only needs Nginx; Node.js is not required for production serving.

## One-time server setup

This setup is already complete on `43.172.115.22`. For a new server, run these commands in the **server SSH terminal**. They install Nginx and create the deployment directory. The release workflow does not install packages or change server permissions.

```bash
sudo apt-get update
sudo apt-get install -y nginx
sudo mkdir -p /var/www/shimodocs/releases
sudo chown -R ubuntu:ubuntu /var/www/shimodocs
```

From the **Mac terminal**, upload the configuration:

```bash
cd /Users/piggy/Documents/ChatGPT/shimodocs
scp deploy/nginx/analytics-log-format.conf ubuntu@43.172.115.22:/tmp/shimodocs-analytics-log-format.conf
scp deploy/nginx/shimodocs.conf ubuntu@43.172.115.22:/tmp/shimodocs.conf
```

Then use the **server SSH terminal** to install and enable it. On a new server, disable the unused default site; preserve any other existing sites:

```bash
sudo install -m 644 /tmp/shimodocs-analytics-log-format.conf /etc/nginx/conf.d/shimodocs-analytics.conf
sudo install -m 644 /tmp/shimodocs.conf /etc/nginx/sites-available/shimodocs
sudo ln -sfn /etc/nginx/sites-available/shimodocs /etc/nginx/sites-enabled/shimodocs
sudo unlink /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

The config names the production domain (`server_name shimodocs.com www.shimodocs.com;`) and answers both plain HTTP and HTTPS from one block, so the site behaves the same whether Cloudflare reaches the origin on port 80 or 443. `www` is redirected to the apex with a `301`, which is the host the canonical link and the sitemap use.

The configuration routes `/robots.txt`, `/sitemap.xml` and the brand images to real files with `try_files $uri =404`. Routes match `$uri/index.html` before `$uri`, so `/ai-workspace` returns `200` instead of a `301` to the trailing-slash form, and `/ai-workspace/` redirects back to the canonical `/ai-workspace`. Because every route is prerendered to its own directory, an unknown path returns the `404.html` document with a `404` status instead of the home page with a `200`.

## HTTPS

`/etc/nginx/ssl/shimodocs.com.pem` and `.key` must exist before the
configuration is installed, or `nginx -t` fails. On a new server create the
self-signed placeholder first:

```bash
sudo mkdir -p /etc/nginx/ssl /var/www/certbot
sudo openssl req -x509 -nodes -newkey rsa:2048 -days 90 \
  -keyout /etc/nginx/ssl/shimodocs.com.key \
  -out /etc/nginx/ssl/shimodocs.com.pem \
  -subj "/CN=shimodocs.com" \
  -addext "subjectAltName=DNS:shimodocs.com,DNS:www.shimodocs.com"
sudo chmod 600 /etc/nginx/ssl/shimodocs.com.key
```

Cloudflare proxies `shimodocs.com` with SSL/TLS mode **Full (strict)**, so the
origin has to present a publicly trusted certificate. Let's Encrypt issues it
with an HTTP-01 challenge served from `/var/www/certbot`, which Cloudflare passes
through to the origin:

```bash
sudo apt-get install -y certbot
sudo certbot certonly --webroot -w /var/www/certbot \
  -d shimodocs.com -d www.shimodocs.com
```

`/etc/letsencrypt/renewal-hooks/deploy/shimodocs-nginx.sh` copies each renewed
certificate into `/etc/nginx/ssl/` and reloads Nginx, and `certbot.timer` runs
twice a day. The matching zone settings are SSL/TLS **Full (strict)**,
**Always Use HTTPS** on, minimum TLS version 1.2 and HSTS enabled. Because the
renewal challenge is answered on port 80, the Nginx configuration deliberately
carries no HTTP-to-HTTPS redirect: behind a Flexible proxy such a redirect loops
forever.

## GitHub repository settings

In the **shimodocs/website GitHub page → Settings → Secrets and variables → Actions**, add five secrets:

| Name | Value |
| --- | --- |
| `DEPLOY_HOST` | `43.172.115.22` |
| `DEPLOY_PORT` | `22` |
| `DEPLOY_USER` | `ubuntu` |
| `DEPLOY_SSH_KEY` | The complete private key for a dedicated deploy key |
| `DEPLOY_KNOWN_HOSTS` | The SSH host key line for this server |

The dedicated deployment private key lives at `~/.ssh/shimodocs_actions` on the Mac and is sent directly to `DEPLOY_SSH_KEY`. The corresponding public key (`~/.ssh/shimodocs_actions.pub`) is authorized in `/home/ubuntu/.ssh/authorized_keys` on the server. A public key alone in Secrets cannot authenticate an SSH client. Neither key belongs in the source repository.

`DEPLOY_KNOWN_HOSTS` identifies the SSH server, and is separate from the deployment key pair. From the **Mac terminal**, obtain the already trusted host-key record:

```bash
ssh-keygen -F 43.172.115.22 -f ~/.ssh/known_hosts | sed '/^#/d'
```

Then one optional **variable** (Settings → Secrets and variables → Actions → Variables), which is currently set:

| Name | Value |
| --- | --- |
| `SITE_URL` | `https://shimodocs.com` |

`SITE_URL` feeds `VITE_SITE_URL` during the build, which is where every canonical
URL, the sitemap and the social image URLs come from. It defaults to
`http://43.172.115.22` when unset, which is the origin the site was served from
before the domain was connected. Changing it only requires tagging the next
release.

## Release flow

Use the **Mac terminal**, in the project directory:

```bash
git push origin main
git tag -a v1.0.2 -m "Release v1.0.2"
git push origin v1.0.2
```

Replace the example with a new version each time. Pushing `main` runs build checks only. The **GitHub Actions → Deploy tagged ShimoDocs release** workflow runs when a `v*` tag is pushed. There is no branch-triggered or manual deployment entrypoint.

Each run creates a unique release directory, leaving previous versions available. The upload step refuses to activate a release that is missing `index.html`, `release.json`, `robots.txt`, `sitemap.xml`, `404.html`, or any of the prerendered subroutes `ai-workspace`, `blog`, `help-center`, `pricing`, `contact-sales`, `docs`, `de/docs` and `ja/docs`. That check runs **before** the symlink is swapped, so a truncated upload never reaches production. `/release.json` records the tag, commit, repository and release ID.

After activating the release, the workflow verifies against the live host:

- Every marketing route returns `200` with prerendered markup, an `<h1>`, a canonical link and structured data, and all six titles are distinct.
- `robots.txt` is served as `text/plain` with a `Sitemap:` directive.
- `sitemap.xml` is a `<sitemapindex>` whose first child is `sitemap-core.xml`, the commercial pages; every child sitemap is fetched and checked as a urlset with at least one URL; every marketing route appears in one of them; and `sitemap-docs-en.xml` is indexed. `sitemap-docs-de.xml` and `sitemap-docs-ja.xml` are not in the index: German and Japanese docs stay published and hreflang-linked, but they are not submitted in the sitemap while English is the crawl priority. The lists are repeated in the workflow on purpose, so a release that quietly puts a translation back in the sitemap fails instead of passing.
- `/docs`, `/de/docs/...` and `/ja/docs/...` return `200` with the right `<html lang>`, a canonical link, `TechArticle` and `BreadcrumbList` data, a full set of `hreflang` links including `x-default`, and no client bundle. The translated trees stay live even while they are off the sitemap; this is the surface whose plumbing can fail while every marketing route still looks perfect.
- An unknown path returns `404`.
- Every installer link on the home page resolves, with a ranged request so the full package is not pulled.
- Every article listed in the blog sitemap is live, prerendered, carries `BlogPosting` and breadcrumb data, ships no client bundle, and uses one of the four known layouts.

In-progress deployments are not cancelled by newer tags.

### Automatic rollback

Activation happens before verification, so a release that fails its checks is already serving production. When any step fails after activation, the workflow puts the previous release back: it resolves what `current` pointed at before the swap, re-points the symlink at it, and confirms through `/release.json` that the tag serving production is no longer the one that just failed. The previous target is also written to `/var/www/shimodocs/.previous-release` on the server, so the same information is available by hand if the job dies mid-swap. A first deploy has nothing to roll back to and says so instead.

After migrating, disable `deploy.yml` in `liwo-yuandian/shimodocs` so the old repository cannot publish over the tag-based releases. Its code and history can remain as a backup.

## Contact-sales submissions

The `/contact-sales` form writes each inquiry into a Teable table as one row.
Teable serves a public share-form endpoint that allows cross-origin requests, so
the page posts to it directly — no backend process, no Nginx rule, and no
credential in the client bundle:

```text
browser ──POST /api/share/<shareId>/view/form-submit──▶ Teable ──▶ new row
```

- `src/pages/ContactSales.jsx` validates the form and calls `submitInquiry`.
- `src/contact.js` holds the share endpoint and the field-id mapping.
- The shared view is the form view **官网联系表单**. A short share link
  `https://app.teable.ai/s/<id>` redirects to `/share/<shareId>/view`.

### How the wiring was derived

```bash
# 1. Resolve a short share link (/s/xxx) to its shareId
curl -sI https://app.teable.ai/s/DmeNUgLBq | grep -i location
#   location: /share/shr3o8M2RVcBeSz4KCV/view

# 2. Read the form's fields (ids, names, types, choices) — public, read-only
curl -s "https://app.teable.ai/api/share/shr3o8M2RVcBeSz4KCV/view" \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["view"]["type"]); [print(f["id"], f["name"], f["type"]) for f in d["fields"]]'

# 3. Prove the endpoint accepts the exact body the page sends
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  -H 'Content-Type: application/json' \
  -d '{"fields":{"fldh3njWoBjMxgBtxHD":"Deploy check","fldF2EPy8psae3sJcPa":"test@example.com","fld5h0Y4WhyAy47DOo3":"5–20 people","fldQa4NIZtbzbvibX2C":"ignore"},"typecast":true}' \
  https://app.teable.ai/api/share/shr3o8M2RVcBeSz4KCV/view/form-submit
#   201 = the row was appended; delete the "Deploy check" row afterwards
```

### Changing the table or rotating the link

1. Edit the table or the form view in Teable as usual. Renaming a column is safe:
   the page addresses columns by field id, not by name.
2. If a column is added, removed or replaced, read the new ids with step 2 above
   and update `FIELD_IDS` in `src/contact.js`.
3. Run `npm run check:contact`. It asks the share view what each id is called now
   and fails if a column has been renamed or shuffled so an id no longer holds
   the column expected for it — that check also runs in the release workflow,
   because a silent swap would write a name into the email column.
4. If the share link is rotated (**Share form → copy the new link**), update
   `CONTACT_ENDPOINT` in `src/contact.js` — or set `VITE_CONTACT_ENDPOINT` in the
   deploy workflow, the same way `VITE_SITE_URL` is passed — and cut a release.

> Moving the *meaning* between two columns is the one edit that is not safe on
> its own. Renaming `姓名` and `工作邮箱` around each other, as happened once,
> leaves the ids pointing at the opposite columns; `npm run check:contact`
> catches it and `FIELD_IDS` plus `FIELD_NAMES` have to be updated together.

### Notes

- **`姓名` must stay optional in Teable, in two places.** The page only requires
  the work email; an empty name is left out of the submission entirely. The
  shared form endpoint then answers
  `400 Required form fields are missing` (`view.required_fields_missing`) while
  the **form view** still marks 姓名 required, or
  `400 field 姓名 cannot be empty` (`validation.field.not_null`) while the
  **table column** itself is not-null. Turn the required switch off on the form
  question *and* on the table column, then confirm with:

  ```bash
  curl -s -o /dev/null -w '%{http_code}\n' -X POST \
    -H 'Content-Type: application/json' \
    -d '{"fields":{"fldF2EPy8psae3sJcPa":"no-name@example.com","fld5h0Y4WhyAy47DOo3":"5–20 people","fldQa4NIZtbzbvibX2C":"no name field sent"},"typecast":true}' \
    https://app.teable.ai/api/share/shr3o8M2RVcBeSz4KCV/view/form-submit
  #   201 = a submission without 姓名 is accepted
  ```

- The endpoint is public by design: anyone holding the share link can submit a
  row, exactly as anyone can open the form in a browser. The honeypot field in
  the form stops naive form bots and Teable rate-limits the endpoint; nothing
  else guards it. If it is ever spammed, rotate the share link, and if that is
  not enough, move the endpoint to a Cloudflare Worker that holds a Teable API
  token and can rate-limit per IP.
- Keep **password protection** and **track submitters** off in the form's
  submission settings. Either one makes an anonymous POST fail.
- The Teable free plan allows 1000 rows, 100 automation runs and 100 system
  emails per month, which is the ceiling for this table. Pro is $24/month;
  self-hosting lifts the row cap.

## Rollback

A release that fails verification is rolled back automatically, and the run says so. This section is for the cases automation cannot cover: a problem found after the workflow went green, or a job that died mid-swap.

In the **server SSH terminal**, inspect the release metadata and select the exact previous release directory. `/var/www/shimodocs/.previous-release` holds what `current` pointed at before the last deployment, which is the quickest way to see what to go back to:

```bash
cat /var/www/shimodocs/.previous-release
readlink -f /var/www/shimodocs/current
ls /var/www/shimodocs/releases
```

Point a temporary symlink to that verified release, then rename it over `current` with `mv -Tf`. Nginx reads the new target without a reload. Verify `/release.json` and the page afterward. Release directories are retained; this workflow does not automatically delete them.

Before connecting the repository, validate locally with:

```bash
npm ci
npm run build
```

## Daily traffic and acquisition reporting

`node scripts/shimodocs-daily.mjs --dry-run` validates the unified collector;
`--setup` creates only missing Feishu tables/fields. The normal run updates
Cloudflare traffic, crawler/page details, trusted origin referrers and likely-human
estimates, likely-human referrers, Cloudflare Web Analytics sessions with the full
referring URL, and the GitHub cumulative download snapshot. It records each source's
status separately. GSC is not rewritten until API authorization is configured.

The local Codex task runs at 08:00 Asia/Shanghai and needs the Mac available.
See [analytics operations](../scripts/analytics/README.md) for date boundaries,
origin log installation, CIDR maintenance, warmup and attribution limitations.
The dedicated origin log requires the format file to be installed before the site
configuration. The original access log is retained.
