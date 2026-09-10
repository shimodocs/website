# ShimoDocs Website

Vite + React marketing site for ShimoDocs.

## Routes

- `/` — Home
- `/ai-workspace` — AI Workspace
- `/blog` — Blog
- `/help-center` — Help Center
- `/pricing` — Pricing
- `/contact-sales` — Contact Sales

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

The production output is written to `dist/`. Nginx serves it on the Ubuntu host with an SPA fallback to `index.html`.

## Publishing

The canonical repository is [shimodocs/website](https://github.com/shimodocs/website).
Pushes and pull requests to `main` run build checks only. Pushing a new `v*` tag triggers the production deployment through GitHub Actions:

```bash
git push origin main
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1
```

Use a new, unused version for each release. See [deployment instructions](deploy/README.md) for server setup, Secrets, verification and rollback.
