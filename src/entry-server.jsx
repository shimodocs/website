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
import Doc from './pages/Doc'
import DocsIndexStatic from './pages/DocsIndexStatic'
import RelatedDocs from './components/article/RelatedDocs'

export function renderRoute(url) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  )
}

// Article pages are build-time only and never hydrated, so the body arrives as
// a prop instead of from a client bundle.
//
// The related guides are rendered after the layout rather than inside it: all
// four layouts end with their own call to action, and this is a different kind
// of link (a runbook, not an offer), so it sits below them in its own page
// container instead of being threaded through four templates.
export function renderBlogPost(post, related = [], older = null, newer = null, docs = []) {
  return renderToString(
    <StaticRouter location={`/blog/${post.slug}`}>
      <Shell>
        <BlogPost post={post} related={related} older={older} newer={newer} />
        {docs.length ? (
          <div className="page">
            <RelatedDocs links={docs} />
          </div>
        ) : null}
      </Shell>
    </StaticRouter>,
  )
}

// Documentation guides are build-time only for the same reason.
export function renderDoc(doc, nav, previous = null, next = null, alternates = []) {
  return renderToString(
    <StaticRouter location={doc.url}>
      <Shell>
        <Doc doc={doc} nav={nav} previous={previous} next={next} alternates={alternates} />
      </Shell>
    </StaticRouter>,
  )
}

// A translated documentation index is static for the same reason the guides
// are: its guide list is already in the HTML, and shipping seven more copies of
// the navigation in the client bundle would cost every visitor a download for
// nothing. The English index stays a hydrated route because it carries the
// search box.
export function renderDocsIndex(index, nav, entries = [], alternates = []) {
  return renderToString(
    <StaticRouter location={index.url}>
      <Shell>
        <DocsIndexStatic index={index} nav={nav} entries={entries} alternates={alternates} />
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
  AI_AND_SEARCH_CRAWLERS,
  sitemapXml,
  sitemapUrlsetXml,
  sitemapIndexXml,
  SITE_URL,
  resolveSeo,
  blogPostHead,
  blogPostJsonLd,
  blogIndexJsonLd,
  docHead,
  docJsonLd,
  docsIndexHead,
  docsIndexJsonLd,
  absoluteUrl,
  escapeHtml,
} from './seo'
