import { useMemo, useState } from 'react'
import BlogTopics from '../components/BlogTopics'
import { Eyebrow } from '../components/Section'
import { DOWNLOADS, LICENSE_REQUEST_URL } from '../downloads'
import { formatDate, formatMonthYear } from '../format'
import { BLOG_CATEGORIES, BLOG_POSTS, BLOG_UPDATED } from '../generated/blog-posts'
import { FREE_TEAM_LIMIT_WORD } from '../pricing-facts.js'

const FEATURED_COUNT = 3

// Search only. The category selector navigates to a topic page rather than
// filtering here, so this no longer takes a category: a query is a reader
// looking for something they can already name, and it has no URL worth having.
function matches(post, query) {
  if (!query) return true
  const haystack = `${post.title} ${post.description} ${post.tags.join(' ')} ${post.categoryLabel}`.toLowerCase()
  return haystack.includes(query)
}

function ArchiveRow({ post }) {
  return (
    <li>
      {/* Plain anchor, not a router Link: /blog/<slug> is a separate static
          document, so this must be a full page load. */}
      <a href={`/blog/${post.slug}`}>
        <span className="archive-date">{formatMonthYear(post.date)}</span>
        <span className="archive-title">{post.title}</span>
        <span className="archive-meta">{post.categoryLabel}</span>
      </a>
    </li>
  )
}

function PostCard({ post }) {
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

export default function Blog() {
  const [query, setQuery] = useState('')

  const normalisedQuery = query.trim().toLowerCase()
  const isFiltered = normalisedQuery.length > 0

  const filtered = useMemo(
    () => BLOG_POSTS.filter(post => matches(post, normalisedQuery)),
    [normalisedQuery],
  )

  // Default view: a small featured set plus a complete grouped archive, so the
  // prerendered HTML links every article from one page no matter how many exist.
  const featured = useMemo(() => {
    const pinned = BLOG_POSTS.filter(post => post.featured).slice(0, FEATURED_COUNT)
    if (pinned.length >= FEATURED_COUNT) return pinned
    const rest = BLOG_POSTS.filter(post => !pinned.includes(post))
    return [...pinned, ...rest].slice(0, FEATURED_COUNT)
  }, [])

  const grouped = useMemo(
    () =>
      BLOG_CATEGORIES.map(entry => ({
        ...entry,
        posts: BLOG_POSTS.filter(post => post.category === entry.id),
      })).filter(entry => entry.posts.length > 0),
    [],
  )

  return (
    <div className="page blog-page">
      <section className="section page-intro blog-intro">
        <Eyebrow>The ShimoDocs journal</Eyebrow>
        <h1>
          Private cloud collaboration,
          <br />
          <span className="gradient">explained properly.</span>
        </h1>
        <p>
          Long-form guides, comparisons and field notes on self-hosted document collaboration, data sovereignty and
          running AI agents on infrastructure you control.
        </p>
        <div className="blog-stats">
          <span>
            <b>{BLOG_POSTS.length}</b> articles
          </span>
          <span>
            <b>{BLOG_CATEGORIES.length}</b> categories
          </span>
          {BLOG_UPDATED ? (
            <span>
              Updated <b>{formatDate(BLOG_UPDATED)}</b>
            </span>
          ) : null}
        </div>
      </section>

      <section className="section blog-controls">
        <BlogTopics />
        <label className="blog-search">
          <span className="visually-hidden">Search articles</span>
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search articles…"
          />
        </label>
      </section>

      {isFiltered ? (
        <section className="section">
          <p className="blog-result-count">
            {filtered.length} {filtered.length === 1 ? 'article' : 'articles'} matching “{query.trim()}”
          </p>
          {filtered.length ? (
            <div className="blog-grid">
              {filtered.map(post => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p className="blog-empty">
              Nothing matched that search. Try “self-hosted”, “data sovereignty” or “Google Docs”.
            </p>
          )}
        </section>
      ) : (
        <>
          <section className="section">
            <h2 className="blog-section-title">Start here</h2>
            <div className="blog-grid">
              {featured.map(post => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>

          <section className="section blog-archive">
            <h2 className="blog-section-title">All articles</h2>
            {grouped.map(entry => (
              <div className="archive-group" key={entry.id}>
                <div className="archive-head">
                  {/* Linked, so the topic pages are reachable by crawling from
                      the archive rather than only from the sitemap. */}
                  <h3>
                    <a href={`/blog/category/${entry.id}`}>{entry.label}</a>
                  </h3>
                  <p>{entry.description}</p>
                </div>
                <ul>
                  {entry.posts.map(post => (
                    <ArchiveRow key={post.slug} post={post} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </>
      )}

      <section className="section blog-cta">
        <div>
          <h2>Try it on your own infrastructure</h2>
          <p>
            ShimoDocs is free for teams of up to {FREE_TEAM_LIMIT_WORD} people, self-hosted, and includes the AI workspace. Download the
            installer or request a licence to get started.
          </p>
        </div>
        <div className="blog-cta-actions">
          <a className="button" href={DOWNLOADS.amd64.url}>
            Download installer
          </a>
          <a className="button outline" href={LICENSE_REQUEST_URL}>
            Get a free perpetual license
          </a>
        </div>
      </section>
    </div>
  )
}
