import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Section'
import { DOWNLOADS, LICENSE_REQUEST_URL } from '../downloads'
import { formatDate, formatMonthYear } from '../format'
import { BLOG_CATEGORIES, BLOG_POSTS } from '../generated/blog-posts'

const FEATURED_COUNT = 3

function matches(post, category, query) {
  if (category !== 'all' && post.category !== category) return false
  if (!query) return true
  const haystack = `${post.title} ${post.description} ${post.tags.join(' ')} ${post.categoryLabel}`.toLowerCase()
  return haystack.includes(query)
}

function ArchiveRow({ post }) {
  return (
    <li>
      <Link to={`/blog/${post.slug}`}>
        <span className="archive-date">{formatMonthYear(post.date)}</span>
        <span className="archive-title">{post.title}</span>
        <span className="archive-meta">{post.categoryLabel}</span>
      </Link>
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
        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>
      <p>{post.description}</p>
      <Link className="card-link" to={`/blog/${post.slug}`}>
        Read article ↗
      </Link>
    </article>
  )
}

export default function Blog() {
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')

  const normalisedQuery = query.trim().toLowerCase()
  const isFiltered = category !== 'all' || normalisedQuery.length > 0

  const filtered = useMemo(
    () => BLOG_POSTS.filter(post => matches(post, category, normalisedQuery)),
    [category, normalisedQuery],
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

  const latestDate = BLOG_POSTS[0]?.date

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
          {latestDate ? (
            <span>
              Updated <b>{formatDate(latestDate)}</b>
            </span>
          ) : null}
        </div>
      </section>

      <section className="section blog-controls">
        <div className="blog-filters" role="group" aria-label="Filter articles by category">
          <button type="button" className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>
            All articles
          </button>
          {BLOG_CATEGORIES.map(entry => (
            <button
              key={entry.id}
              type="button"
              className={category === entry.id ? 'active' : ''}
              onClick={() => setCategory(entry.id)}
            >
              {entry.label}
              <span>{entry.count}</span>
            </button>
          ))}
        </div>
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
            {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
            {category !== 'all' ? ` in ${BLOG_CATEGORIES.find(entry => entry.id === category)?.label}` : ''}
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
                  <h3>{entry.label}</h3>
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
            ShimoDocs is free for teams of up to five people, self-hosted, and includes the AI workspace. Download the
            installer or request a licence to get started.
          </p>
        </div>
        <div className="blog-cta-actions">
          <a className="button" href={DOWNLOADS.amd64.url}>
            Download installer
          </a>
          <a className="button outline" href={LICENSE_REQUEST_URL}>
            Get free license
          </a>
        </div>
      </section>
    </div>
  )
}
