// Briefing layout: the intro is separated out, every H2 becomes its own
// numbered section element, and a rail on the right carries the section index,
// a compact call to action and the pager.
import {
  BackToArchive,
  MetaLine,
  Pager,
  PostCta,
  PostTags,
  RelatedArticles,
  splitIntoSections,
} from './shared'
import { DOWNLOADS } from '../../downloads'

export default function LayoutBriefing({ post, related, older, newer }) {
  const { preamble, sections } = splitIntoSections(post.html)

  return (
    <div className="page blog-post-page" data-layout="briefing">
      <header className="brief-head">
        <MetaLine post={post} showAuthor />
        <h1 className="brief-title">{post.title}</h1>
        <p className="brief-deck">{post.description}</p>
      </header>

      <div className="brief-grid">
        <div className="brief-main">
          {preamble ? <div className="brief-preamble post-body" dangerouslySetInnerHTML={{ __html: preamble }} /> : null}

          {sections.map((section, index) => (
            <section className="brief-section" key={section.id || index}>
              <div className="brief-marker" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="brief-section-body post-body" dangerouslySetInnerHTML={{ __html: section.html }} />
            </section>
          ))}
        </div>

        <aside className="brief-rail">
          <nav className="brief-index" aria-label="Sections">
            <b>In this briefing</b>
            <ol>
              {sections.map((section, index) => (
                <li key={section.id || index}>
                  {/* A plain anchor: the router would rewrite a hash link into a
                      path-qualified URL rather than an in-page target. */}
                  <a href={`#${section.id}`}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <aside className="brief-cta">
            <p>Free for up to five users</p>
            <a className="button" href={DOWNLOADS.amd64.url}>
              Download installer
            </a>
          </aside>

          <Pager older={older} newer={newer} variant="stack" />
        </aside>
      </div>

      <PostTags post={post} />
      <RelatedArticles posts={related} variant="list" title="Related briefings" />
      <BackToArchive />
    </div>
  )
}
