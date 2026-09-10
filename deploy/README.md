# Ubuntu + GitHub Actions deployment

The GitHub workflow builds `dist/` on the GitHub runner, uploads it over SSH, and switches `/var/www/shimodocs/current` to the new release. The Ubuntu machine only needs Nginx; Node.js is not required for production serving.

## One-time server setup

Run these commands on the server through the provider console or an existing administrator session. They install Nginx and configure the SPA fallback. The commands are intentionally not run automatically from this repository.

```bash
sudo apt-get update
sudo apt-get install -y nginx
sudo mkdir -p /var/www/shimodocs/releases
sudo chown -R ubuntu:ubuntu /var/www/shimodocs
```

Copy `deploy/nginx/shimodocs.conf` to `/etc/nginx/sites-available/shimodocs`, then enable it:

```bash
sudo ln -sfn /etc/nginx/sites-available/shimodocs /etc/nginx/sites-enabled/shimodocs
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

The default config serves the site at `http://43.172.115.22/`. Replace `server_name _;` with the real domain when DNS is ready, then add HTTPS separately.

## GitHub repository secrets

In **Settings → Secrets and variables → Actions → New repository secret**, add:

| Name | Value |
| --- | --- |
| `DEPLOY_HOST` | `43.172.115.22` |
| `DEPLOY_PORT` | `22` |
| `DEPLOY_USER` | `ubuntu` |
| `DEPLOY_SSH_KEY` | The complete private key for a dedicated deploy key |
| `DEPLOY_KNOWN_HOSTS` | The SSH host key line for this server |

Do not paste a private key into chat, source files, or workflow YAML. Prefer a dedicated key for Actions rather than reusing a personal key. Add its matching `.pub` file to `/home/ubuntu/.ssh/authorized_keys` on the server.

Create the host-key value locally and paste the output into `DEPLOY_KNOWN_HOSTS`:

```bash
ssh-keyscan -p 22 -H 43.172.115.22
```

## Release flow

Push to `main`, or use **Actions → Build and deploy ShimoDocs → Run workflow**. The workflow builds with Node 22, uploads a release, switches the `current` symlink, keeps the five newest releases, and checks that the deployed HTML contains the React root.

Before connecting the repository, validate locally with:

```bash
npm ci
npm run build
```
