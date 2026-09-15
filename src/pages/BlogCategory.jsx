// A blog topic page.
//
// Six of these exist, one per category, and they are pages rather than filters
// on the archive for a simple reason: nobody searches for "the ShimoDocs blog",
// and people do search for "self-hosted document collaboration" or "Google Docs
// alternative comparison". A filter produces one indexable URL at /blog that
// answers none of those queries.
//
// Each one is a hub, not a list: the articles in the topic, the guides those
// articles point at (derived from the editorial link map at build time, so the
// two cannot drift), the other topics, and the download path.
import { useLocation } from 'react-router-dom'
import { Eyebrow } from '../components/Section'
import { FREE_TEAM_LIMIT_WORD } from '../pricing-facts.js'
import { formatMonthYear } from '../format'
import { BLOG_CATEGORIES, BLOG_POSTS } from '../generated/blog-posts'
import { CATEGORY_DOCS } from '../generated/blog-category-docs'

// The category description says what the topic is; this says why the topic
// exists and what a reader gets from the page. Written per topic rather than
// generated, because a generated sentence is what makes six pages read alike.
const INTRO = {
  comparisons:
    'Every comparison here answers the same question differently: what do you give up by keeping documents in a public cloud, and what does the alternative cost you in return?',
  'self-hosting':
    'Running the collaboration stack yourself is a sizing, database and operations problem more than an installation problem. These are the numbers, the topology and the failure modes.',
  security:
    'Compliance is not a certificate you buy. It is a set of controls you can describe, evidence and hand to an auditor — residency, access, retention, encryption and the audit trail behind them.',
  ai:
    'An AI feature is a data-flow decision. These pieces cover what leaves your network, which model answers, what is retained, and how a person reviews what the agent changed.',
  industry:
    'Regulated and distributed teams reach the same conclusion by different routes: the content stays somewhere they can point at, and the audit trail survives a review.',
  guides:
    'Workflows rather than theory: how a team moves its documents, its meeting notes and its policies into a workspace it controls, without losing the collaboration it already has.',
}

export default function BlogCategory() {
  const { pathname } = useLocation()
  const id = pathname.split('/').pop()
  const category = BLOG_CATEGORIES.find(entry => entry.id === id)

  // Routes are declared per category, so reaching this with an unknown id means
  // the route table and the content generator disagree. Render nothing rather
  // than a page about nothing.
  if (!category) return null

  const posts = BLOG_POSTS.filter(post => post.category === category.id)
  const docs = CATEGORY_DOCS[category.id] || []
  const others = BLOG_CATEGORIES.filter(entry => entry.id !== category.id && entry.count > 0)
  const latest = BLOG_POSTS.filter(post => post.category !== category.id).slice(0, 3)

  return (
    <div className="page blog-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/blog">Blog</a>
        <span aria-hidden="true">/</span>
        <span className="breadcrumb-current">{category.label}</span>
      </nav>

      <section className="section page-intro blog-intro">
        <Eyebrow>Topic</Eyebrow>
        <h1>{category.label}</h1>
        <p>{category.description}</p>
        <p>{INTRO[category.id]}</p>
        <div className="blog-stats">
          <span>
            <b>{posts.length}</b> {posts.length === 1 ? 'article' : 'articles'}
          </span>
          {docs.length ? (
            <span>
              <b>{docs.length}</b> documentation guides
            </span>
          ) : null}
        </div>
      </section>

      <section className="section blog-archive">
        <h2 className="blog-section-title">
          {posts.length === 1 ? 'The article in this topic' : `All ${posts.length} articles`}
        </h2>
        <div className="archive-group">
          <ul>
            {posts.map(post => (
              <li key={post.slug}>
                {/* Plain anchor: /blog/<slug> is a standalone static document. */}
                <a href={`/blog/${post.slug}`}>
                  <span className="archive-date">{formatMonthYear(post.date)}</span>
                  <span className="archive-title">{post.title}</span>
                  <span className="archive-meta">{post.readingTime} min read</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {docs.length ? (
        <section className="section">
          <h2 className="blog-section-title">From the documentation</h2>
          <p className="section-lead">
            The runbooks behind these articles: installation, sizing, configuration, and the checks worth running before
            a rollout reaches real work.
          </p>
          <ul className="docs-guide-grid">
            {docs.map(doc => (
              <li key={doc.url}>
                <a href={doc.url}>{doc.title}</a>
                <small>{doc.description}</small>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="section">
        <h2 className="blog-section-title">Other topics</h2>
        <div className="blog-filters topic-links" role="group" aria-label="Other topics">
          {others.map(entry => (
            <a key={entry.id} href={`/blog/category/${entry.id}`}>
              {entry.label} <span>{entry.count}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="section blog-archive">
        <h2 className="blog-section-title">Latest across the journal</h2>
        <div className="archive-group">
          <ul>
            {latest.map(post => (
              <li key={post.slug}>
                <a href={`/blog/${post.slug}`}>
                  <span className="archive-date">{formatMonthYear(post.date)}</span>
                  <span className="archive-title">{post.title}</span>
                  <span className="archive-meta">{post.categoryLabel}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <aside className="docs-cta">
        <div>
          <p className="docs-cta-kicker">Run this in your own environment</p>
          <h2>ShimoDocs is free for teams of up to {FREE_TEAM_LIMIT_WORD} people</h2>
          <p>
            Self-host the suite in your own Kubernetes cluster, or ask the team for a guided private cloud deployment.
          </p>
        </div>
        <div className="docs-cta-actions">
          <a className="button" href="/download">
            Download the installer
          </a>
          <a className="button outline" href="/contact-sales">
            Talk to us
          </a>
        </div>
      </aside>
    </div>
  )
}
