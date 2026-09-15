// Documentation landing page.
//
// This is the crawler's entry point into the guide tree: every one of the 56
// guides is linked from here with descriptive anchor text, so nothing depends
// on a sitemap alone for discovery.
import { DOC_NAV } from '../generated/docs-nav'
import { Eyebrow } from '../components/Section'

const TOTAL = DOC_NAV.reduce(
  (sum, group) => sum + group.docs.length + group.subgroups.reduce((inner, subgroup) => inner + subgroup.docs.length, 0),
  0,
)

function GuideLink({ doc }) {
  return (
    <li>
      <a href={doc.url}>{doc.title}</a>
      <small>{doc.description}</small>
    </li>
  )
}

export default function DocsIndex() {
  return (
    <div className="page docs-index">
      <section className="docs-hero">
        <Eyebrow>Documentation</Eyebrow>
        <h1>
          Deploy ShimoDocs
          <br />
          <span className="gradient">in your own cloud.</span>
        </h1>
        <p>
          {TOTAL} official guides covering planning, Kubernetes installation, middleware integration, day-to-day
          operations, AI configuration, backup and incident response — written for the people who run the suite, not
          for a sales conversation.
        </p>
        <div className="docs-hero-actions">
          <a className="button" href="/docs/deployment/getting-started/quick-start">
            Start with the quick start
          </a>
          <a className="button outline" href="/docs/deployment/system-requirements">
            Check system requirements
          </a>
        </div>
      </section>

      {DOC_NAV.map(group => (
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
          <p className="docs-cta-kicker">Free for teams of up to five people</p>
          <h2>Run it, then decide</h2>
          <p>
            Download the self-hosted installer, request the free perpetual licence, and bring the deployment questions
            you cannot answer from a guide to the team directly.
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
