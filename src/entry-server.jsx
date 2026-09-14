// Server entry used only at build time by `vite build --ssr`.
//
// The prerenderer imports this bundle so that import.meta.env is inlined by
// Vite exactly as it is for the client build, keeping canonical URLs and
// structured data identical between the crawler view and the hydrated app.
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App'
import Shell from './components/Shell'
import BlogPost from './pages/BlogPost'

export function renderRoute(url) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  )
}

// Article pages are build-time only and never hydrated, so the body arrives as
// a prop instead of from a client bundle.
export function renderBlogPost(post, related = [], older = null, newer = null) {
  return renderToString(
    <StaticRouter location={`/blog/${post.slug}`}>
      <Shell>
        <BlogPost post={post} related={related} older={older} newer={newer} />
      </Shell>
    </StaticRouter>,
  )
}

export { ROUTES } from './routes'
export {
  ROUTE_PATHS,
  ROUTE_SEO,
  headFor,
  jsonLdFor,
  robotsTxt,
  sitemapXml,
  SITE_URL,
  resolveSeo,
  blogPostHead,
  blogPostJsonLd,
  blogIndexJsonLd,
  absoluteUrl,
  escapeHtml,
} from './seo'
