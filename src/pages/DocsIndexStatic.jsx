// The landing page of a translated guide tree.
//
// The English index at /docs stays a hydrated React route because it carries the
// search box. The seven translations do not: their guide list is already in the
// HTML, and bundling eight copies of the navigation so that a German reader can
// filter a list would cost every visitor a download for nothing. These pages are
// therefore rendered once at build time and ship no JavaScript at all, exactly
// like the guides they link to.
//
// The introduction is not written here. It is the translated root README from
// the product repository, so the page is in the translators' German rather than
// in a second-hand translation of the English hero.
import { docsBase, docsUi } from '../docs-languages'
import DocsLanguageRow from '../components/DocsLanguageRow'
import { Eyebrow } from '../components/Section'

function GuideLink({ doc }) {
  return (
    <li>
      <a href={doc.url}>{doc.title}</a>
      <small>{doc.description}</small>
    </li>
  )
}

export default function DocsIndexStatic({ index, nav, entries = [], alternates = [] }) {
  const language = index.language
  const ui = docsUi(language)
  const base = docsBase(language)
  const total = entries.length || nav.reduce(
    (sum, group) => sum + group.docs.length + group.subgroups.reduce((inner, subgroup) => inner + subgroup.docs.length, 0),
    0,
  )

  return (
    <div className="page docs-index">
      <section className="docs-hero">
        <Eyebrow>{ui.indexEyebrow}</Eyebrow>
        <h1>{index.title}</h1>
        <p>{index.description}</p>
        <p className="docs-count">{ui.indexCount(total)}</p>
        <div className="docs-hero-actions">
          <a className="button" href={`${base}/deployment/getting-started/quick-start`}>
            {ui.indexQuickStart}
          </a>
          <a className="button outline" href={`${base}/deployment/system-requirements`}>
            {ui.indexRequirements}
          </a>
        </div>
        <DocsLanguageRow language={language} alternates={alternates} />
      </section>

      {nav.map(group => (
        <section className="docs-section" key={group.id || 'overview'}>
          <div className="docs-section-head">
            <h2>{group.label}</h2>
          </div>

          {group.docs.length ? (
            <ul className="docs-guide-grid">
              {group.docs.map(doc => (
                <GuideLink key={doc.id || 'index'} doc={doc} />
              ))}
            </ul>
          ) : null}

          {group.subgroups.map(subgroup => (
            <div className="docs-subgroup" key={subgroup.id}>
              <h3>{subgroup.label}</h3>
              <ul className="docs-guide-grid">
                {subgroup.docs.map(doc => (
                  <GuideLink key={doc.id} doc={doc} />
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}

      <aside className="docs-cta">
        <div>
          <p className="docs-cta-kicker">{ui.ctaKicker}</p>
          <h2>{ui.ctaHeading}</h2>
          <p>{ui.ctaBody}</p>
        </div>
        <div className="docs-cta-actions">
          <a className="button" href="/download">
            {ui.ctaDownload}
          </a>
          <a className="button outline" href="/contact-sales">
            {ui.ctaContact}
          </a>
        </div>
      </aside>
    </div>
  )
}
