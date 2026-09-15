// Shared building blocks for the article layouts.
//
// Every link here is a plain anchor, never a router Link. Article pages are
// separate static documents with no client bundle, so navigating to one has to
// be a real page load. A router Link would be intercepted, match no route in
// the app, and silently render an empty page.
import { DOWNLOADS, LICENSE_REQUEST_URL } from '../../downloads'
import { formatDate } from '../../format'
import { FREE_TEAM_LIMIT_WORD } from '../../pricing-facts.js'

export function PostCard({ post }) {
  return (
    <article className="blog-card">
      <span>
        {post.categoryLabel} · {post.readingTime} min read
      </span>
      <h3>
        <a href={`/blog/${post.slug}`}>{post.title}</a>
      </h3>
      <p>{post.description}</p>
      <a className="card-link" href={`/blog/${post.slug}`}>
        Read article ↗
      </a>
    </article>
  )
}

export function Breadcrumb({ post }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span aria-hidden="true">/</span>
      <a href="/blog">Blog</a>
      <span aria-hidden="true">/</span>
      <span className="breadcrumb-current">{post.categoryLabel}</span>
    </nav>
  )
}

export function MetaLine({ post, showAuthor = false }) {
  return (
    <div className="post-eyebrow">
      <span className="post-category">{post.categoryLabel}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readingTime} min read</span>
      {showAuthor ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{post.author}</span>
        </>
      ) : null}
    </div>
  )
}

export function TableOfContents({ headings, variant = 'rail' }) {
  if (headings.length < 3) return null
  return (
    <nav className={`post-toc post-toc-${variant}`} aria-label="On this page">
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

export function PostTags({ post }) {
  if (!post.tags.length) return null
  return (
    <div className="post-tags">
      <b>Topics</b>
      {post.tags.map(tag => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  )
}

export function PostCta({ variant = 'banner' }) {
  if (variant === 'inline') {
    return (
      <aside className="post-cta post-cta-inline">
        <p className="post-cta-kicker">Try it yourself</p>
        <h3>Free for teams of up to {FREE_TEAM_LIMIT_WORD} people</h3>
        <div className="post-cta-actions">
          <a className="button" href={DOWNLOADS.amd64.url}>
            Download installer
          </a>
          <a className="button outline" href={LICENSE_REQUEST_URL}>
            Get a free perpetual license
          </a>
        </div>
      </aside>
    )
  }

  return (
    <aside className="post-cta">
      <div>
        <p className="post-cta-kicker">Run this in your own environment</p>
        <h2>ShimoDocs is free for teams of up to {FREE_TEAM_LIMIT_WORD} people</h2>
        <p>
          Download the self-hosted installer, request the free licence by email, and keep documents and AI context
          inside your own network.
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
  )
}

export function Pager({ older, newer, variant = 'cards' }) {
  if (!older && !newer) return null
  if (variant === 'stack') {
    return (
      <nav className="pager-stack" aria-label="More articles">
        {newer ? (
          <a href={`/blog/${newer.slug}`}>
            <small>Newer</small>
            <span>{newer.title}</span>
          </a>
        ) : null}
        {older ? (
          <a href={`/blog/${older.slug}`}>
            <small>Older</small>
            <span>{older.title}</span>
          </a>
        ) : null}
      </nav>
    )
  }
  return (
    <nav className="post-pager" aria-label="More articles">
      {older ? (
        <a href={`/blog/${older.slug}`}>
          <small>Older article</small>
          <span>{older.title}</span>
        </a>
      ) : (
        <span />
      )}
      {newer ? (
        <a href={`/blog/${newer.slug}`} className="pager-next">
          <small>Newer article</small>
          <span>{newer.title}</span>
        </a>
      ) : null}
    </nav>
  )
}

export function BackToArchive() {
  return (
    <p className="post-back">
      <a href="/blog">← All articles</a>
    </p>
  )
}

/**
 * Splits rendered article HTML at each <h2>, so layouts can wrap every major
 * section in its own element instead of dropping one long blob into the page.
 */
export function splitIntoSections(html) {
  const parts = String(html).split(/(?=<h2[\s>])/i)
  const preamble = parts.length && !/^<h2[\s>]/i.test(parts[0]) ? parts.shift() : ''
  const sections = parts.map(section => {
    const match = section.match(/<h2[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/i)
    return {
      html: section,
      id: match?.[1] || '',
      title: match ? match[2].replace(/<[^>]+>/g, '').trim() : '',
    }
  })
  return { preamble, sections }
}

export function RelatedArticles({ posts, title = 'Related reading', variant = 'grid' }) {
  if (!posts.length) return null
  if (variant === 'list') {
    return (
      <section className="related-list">
        <h2>{title}</h2>
        <ul>
          {posts.map(post => (
            <li key={post.slug}>
              <a href={`/blog/${post.slug}`}>
                <span>{post.title}</span>
                <small>
                  {post.categoryLabel} · {post.readingTime} min
                </small>
              </a>
            </li>
          ))}
        </ul>
      </section>
    )
  }
  return (
    <section className="post-related">
      <h2>{title}</h2>
      <div className="related-grid">
        {posts.map(post => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  )
}
