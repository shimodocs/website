// Article page chrome.
//
// This component is rendered to static HTML at build time only. The body is
// passed in as a prop and rendered with dangerouslySetInnerHTML, and the
// prerenderer strips the client bundle from article pages, so nothing here is
// ever hydrated. That keeps a 2,000-word article out of the browser bundle and
// removes any possibility of a hydration mismatch.
import { Link } from 'react-router-dom'
import { DOWNLOADS, LICENSE_REQUEST_URL } from '../downloads'
import { formatDate } from '../format'

function TableOfContents({ headings }) {
  if (headings.length < 3) return null
  return (
    <nav className="post-toc" aria-label="On this page">
      <b>On this page</b>
      <ol>
        {headings.map(heading => (
          <li key={heading.id} className={heading.level === 3 ? 'toc-sub' : undefined}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function PostCard({ post }) {
  return (
    <article className="blog-card">
      <span>
        {post.categoryLabel} · {post.readingTime} min read
      </span>
      <h3>
        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>
      <p>{post.description}</p>
      <Link className="card-link" to={`/blog/${post.slug}`}>
        Read article ↗
      </Link>
    </article>
  )
}

export default function BlogPost({ post, related = [], older = null, newer = null }) {
  return (
    <div className="page blog-post-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/blog">Blog</Link>
        <span aria-hidden="true">/</span>
        <span className="breadcrumb-current">{post.categoryLabel}</span>
      </nav>

      <article className="post">
        <header className="post-header">
          <div className="post-eyebrow">
            <span className="post-category">{post.categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readingTime} min read</span>
          </div>
          <h1>{post.title}</h1>
          <p className="post-dek">{post.description}</p>
          {post.updated && post.updated !== post.date ? (
            <p className="post-updated">
              Last updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
            </p>
          ) : null}
        </header>

        <div className="post-layout">
          <TableOfContents headings={post.headings} />
          <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>

        {post.tags.length ? (
          <div className="post-tags">
            <b>Topics</b>
            {post.tags.map(tag => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}

        <aside className="post-cta">
          <div>
            <p className="post-cta-kicker">Run this in your own environment</p>
            <h2>ShimoDocs is free for teams of up to five people</h2>
            <p>
              Download the self-hosted installer, request the free licence by email, and keep documents and AI
              context inside your own network.
            </p>
          </div>
          <div className="post-cta-actions">
            <a className="button" href={DOWNLOADS.amd64.url}>
              Download installer
            </a>
            <a className="button outline" href={LICENSE_REQUEST_URL}>
              Get free license
            </a>
          </div>
        </aside>

        <nav className="post-pager" aria-label="More articles">
          {older ? (
            <Link to={`/blog/${older.slug}`}>
              <small>Older article</small>
              <span>{older.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {newer ? (
            <Link to={`/blog/${newer.slug}`} className="pager-next">
              <small>Newer article</small>
              <span>{newer.title}</span>
            </Link>
          ) : null}
        </nav>

        {related.length ? (
          <section className="post-related">
            <h2>Related reading</h2>
            <div className="related-grid">
              {related.map(item => (
                <PostCard key={item.slug} post={item} />
              ))}
            </div>
          </section>
        ) : null}

        <p className="post-back">
          <Link to="/blog">← All articles</Link>
        </p>
      </article>
    </div>
  )
}
