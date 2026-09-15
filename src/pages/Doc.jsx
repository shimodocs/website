// A single documentation guide.
//
// Like the articles, these pages are rendered to static HTML at build time and
// the client bundle is stripped, so navigation is a real page load and every
// link has to be a plain anchor rather than a router Link.
//
// Everything around the guide — the sidebar, the breadcrumb, the pager and the
// language row — is labelled in the guide's own language, taken from
// src/docs-languages.js. Leaving the chrome in English on 385 translated pages
// reads as a machine-translated site, which is exactly the impression the
// documentation is meant to avoid.
import { DOCS_DEFAULT_LANGUAGE, docsBase, docsUi } from '../docs-languages'
import DocsLanguageRow from '../components/DocsLanguageRow'

// Sidebar entry list. Guides in a group's own sub-directories are shown under a
// sub-heading so a section with thirty guides stays scannable.
function DocLinks({ docs, currentId }) {
  return (
    <ul>
      {docs.map(doc => (
        <li key={doc.id || 'index'}>
          <a href={doc.url} className={doc.id === currentId ? 'active' : undefined}>
            {doc.title}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function DocsSidebar({ nav, currentId, language = DOCS_DEFAULT_LANGUAGE }) {
  const ui = docsUi(language)
  return (
    <nav className="doc-nav" aria-label={ui.docs}>
      <a className={`doc-nav-home${currentId === '' ? ' active' : ''}`} href={docsBase(language)}>
        {ui.docsHome}
      </a>
      {nav.map(group => (
        <div className="doc-nav-group" key={group.id || 'overview'}>
          <b>{group.label}</b>
          <DocLinks docs={group.docs} currentId={currentId} />
          {group.subgroups.map(subgroup => (
            <div className="doc-nav-subgroup" key={subgroup.id}>
              <span>{subgroup.label}</span>
              <DocLinks docs={subgroup.docs} currentId={currentId} />
            </div>
          ))}
        </div>
      ))}
    </nav>
  )
}

function DocBreadcrumb({ doc, nav, language }) {
  const ui = docsUi(language)
  const group = nav.find(entry => entry.id === (doc.id.split('/')[0] || ''))
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <a href="/">{ui.home}</a>
      <span aria-hidden="true">/</span>
      <a href={docsBase(language)}>{ui.docs}</a>
      {group && group.id ? (
        <>
          <span aria-hidden="true">/</span>
          <span>{group.label}</span>
        </>
      ) : null}
      <span aria-hidden="true">/</span>
      <span className="breadcrumb-current">{doc.title}</span>
    </nav>
  )
}

export default function Doc({ doc, nav, previous = null, next = null, alternates = [] }) {
  const toc = doc.headings.filter(heading => heading.level === 2)
  const language = doc.language || DOCS_DEFAULT_LANGUAGE
  const ui = docsUi(language)

  return (
    <div className="page doc-page">
      <DocBreadcrumb doc={doc} nav={nav} language={language} />
      <div className="doc-layout">
        <aside className="doc-nav-rail">
          <DocsSidebar nav={nav} currentId={doc.id} language={language} />
        </aside>

        <article className="doc-body">
          <header className="doc-head">
            <p className="doc-kicker">{ui.docs}</p>
            <h1>{doc.title}</h1>
            <p className="doc-meta">
              {ui.minRead(doc.readingTime)}
              {' · '}
              <a
                href={`https://github.com/shimodocs/shimodocs/blob/main/${
                  doc.language === DOCS_DEFAULT_LANGUAGE ? 'docs' : `docs/${doc.language}`
                }/${doc.id ? `${doc.id}.md` : 'README.md'}`}
                target="_blank"
                rel="noreferrer"
              >
                {ui.editOnGitHub} ↗
              </a>
            </p>
            <DocsLanguageRow language={language} alternates={alternates} />
          </header>

          {/* Reuses the article typography (post-body) so a guide reads exactly
              like the rest of the site, then layers the documentation-only
              pieces such as callouts on top of it. */}
          <div className="post-body doc-prose" dangerouslySetInnerHTML={{ __html: doc.html }} />

          <nav className="doc-pager" aria-label={ui.docs}>
            {previous ? (
              <a href={previous.url}>
                <small>{ui.previous}</small>
                <span>{previous.title}</span>
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a href={next.url} className="doc-pager-next">
                <small>{ui.next}</small>
                <span>{next.title}</span>
              </a>
            ) : null}
          </nav>

          <aside className="doc-cta">
            <div>
              <p className="doc-cta-kicker">{ui.ctaKicker}</p>
              <h2>{ui.ctaHeading}</h2>
              <p>{ui.ctaBody}</p>
            </div>
            <div className="doc-cta-actions">
              <a className="button" href="/download">
                {ui.ctaDownload}
              </a>
              <a className="button outline" href="/contact-sales">
                {ui.ctaContact}
              </a>
            </div>
          </aside>
        </article>

        <aside className="doc-toc-rail">
          {toc.length >= 3 ? (
            <nav className="doc-toc" aria-label={ui.onThisPage}>
              <b>{ui.onThisPage}</b>
              <ol>
                {toc.map(heading => (
                  <li key={heading.id}>
                    <a href={`#${heading.id}`}>{heading.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
