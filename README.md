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

The production output is written to `dist/`. Configure the eventual web server with an SPA fallback to `index.html` so direct route visits continue to work. GitHub Actions and server credentials are intentionally left for the deployment phase after the target machine is confirmed.
