// Server entry used only at build time by `vite build --ssr`.
//
// The prerenderer imports this bundle so that import.meta.env is inlined by
// Vite exactly as it is for the client build, keeping canonical URLs and
// structured data identical between the crawler view and the hydrated app.
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App'

export function renderRoute(url) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  )
}

export { ROUTES } from './routes'
export { ROUTE_PATHS, ROUTE_SEO, headFor, jsonLdFor, robotsTxt, sitemapXml, SITE_URL, resolveSeo } from './seo'
