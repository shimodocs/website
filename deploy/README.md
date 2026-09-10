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
scp deploy/nginx/shimodocs.conf ubuntu@43.172.115.22:/tmp/shimodocs.conf
```

Then use the **server SSH terminal** to install and enable it. On a new server, disable the unused default site; preserve any other existing sites:

```bash
sudo install -m 644 /tmp/shimodocs.conf /etc/nginx/sites-available/shimodocs
sudo ln -sfn /etc/nginx/sites-available/shimodocs /etc/nginx/sites-enabled/shimodocs
sudo unlink /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

The default config serves the site at `http://43.172.115.22/`. Replace `server_name _;` with the real domain when DNS is ready, then add HTTPS separately.

The configuration routes `/robots.txt`, `/sitemap.xml` and the brand images to real files with `try_files $uri =404`. Routes match `$uri/index.html` before `$uri`, so `/ai-workspace` returns `200` instead of a `301` to the trailing-slash form, and `/ai-workspace/` redirects back to the canonical `/ai-workspace`. Because every route is prerendered to its own directory, an unknown path returns the `404.html` document with a `404` status instead of the home page with a `200`.

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

Then add one optional **variable** (Settings → Secrets and variables → Actions → Variables):

| Name | Value |
| --- | --- |
| `SITE_URL` | The production origin, for example `https://shimodocs.com` |

`SITE_URL` feeds `VITE_SITE_URL` during the build, which is where every canonical
URL, the sitemap and the social image URLs come from. It defaults to
`http://43.172.115.22`, so leaving it unset is safe until the domain is live.
Changing it only requires tagging the next release.

## Release flow

Use the **Mac terminal**, in the project directory:

```bash
git push origin main
git tag -a v1.0.2 -m "Release v1.0.2"
git push origin v1.0.2
```

Replace the example with a new version each time. Pushing `main` runs build checks only. The **GitHub Actions → Deploy tagged ShimoDocs release** workflow runs when a `v*` tag is pushed. There is no branch-triggered or manual deployment entrypoint.

Each run creates a unique release directory, leaving previous versions available. The upload step refuses to activate a release that is missing `index.html`, `release.json`, `robots.txt`, `sitemap.xml`, `404.html` or any of the five prerendered subroutes. `/release.json` records the tag, commit, repository and release ID.

After activating the release, the workflow verifies against the live host that every route returns `200` with prerendered markup, an `<h1>`, a canonical link and structured data; that all six titles are distinct; that `robots.txt` is served as `text/plain` with a `Sitemap:` directive; that `sitemap.xml` is served as XML and lists every route; and that an unknown path returns `404`. In-progress deployments are not cancelled by newer tags.

After migrating, disable `deploy.yml` in `liwo-yuandian/shimodocs` so the old repository cannot publish over the tag-based releases. Its code and history can remain as a backup.

## Rollback

In the **server SSH terminal**, inspect the release metadata and select the exact previous release directory:

```bash
readlink -f /var/www/shimodocs/current
ls /var/www/shimodocs/releases
```

Point a temporary symlink to that verified release, then rename it over `current` with `mv -Tf`. Nginx reads the new target without a reload. Verify `/release.json` and the page afterward. Release directories are retained; this workflow does not automatically delete them.

Before connecting the repository, validate locally with:

```bash
npm ci
npm run build
```
