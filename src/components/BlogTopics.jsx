// The topic selector, shared by the archive and the six topic pages.
//
// These are links, not filter buttons. A category that only re-renders the
// archive keeps the reader on one URL and gives the topic pages nothing: the
// six of them are prerendered with their own titles, descriptions and keywords,
// and they took zero search impressions in the first two months of the site
// because the only links into them sat at the bottom of /blog, underneath 43
// article rows. Choosing a topic is navigation to a page that answers a query,
// so it changes the URL.
//
// Plain anchors rather than router links, for the same reason the article rows
// use them: every one of these targets is its own prerendered document.
import { BLOG_CATEGORIES, BLOG_POSTS } from '../generated/blog-posts'

export default function BlogTopics({ current = null }) {
  return (
    <div className="blog-filters" role="navigation" aria-label="Browse the journal by topic">
      <a href="/blog" className={current ? '' : 'active'} aria-current={current ? undefined : 'page'}>
        All articles <span>{BLOG_POSTS.length}</span>
      </a>
      {BLOG_CATEGORIES.map(entry => {
        const isCurrent = current === entry.id
        return (
          <a
            key={entry.id}
            href={`/blog/category/${entry.id}`}
            className={isCurrent ? 'active' : ''}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {entry.label} <span>{entry.count}</span>
          </a>
        )
      })}
    </div>
  )
}
