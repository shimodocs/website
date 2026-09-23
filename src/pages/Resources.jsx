import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Section'
import { FREE_TEAM_LIMIT_WORD } from '../pricing-facts.js'

// The previous site published this hub at /resources and listed it nowhere, so
// only a direct probe found it. The path is kept so the indexed listing stays
// valid, and the hub now points at the surfaces that actually hold the material
// the old page described.
const COLLECTIONS = [
  {
    kicker: 'Guides and insights',
    title: 'The ShimoDocs journal',
    body: 'Practical articles on private cloud collaboration, data sovereignty, migration and the compliance questions teams ask before they move.',
    to: '/blog',
    action: 'Read the journal',
  },
  {
    kicker: 'Deployment',
    title: 'Self-hosted deployment guides',
    body: 'Kubernetes, middleware, AI endpoint configuration, backups and the checks worth running before a rollout reaches real work.',
    to: '/docs',
    action: 'Open the docs',
  },
  {
    kicker: 'Comparisons',
    title: 'How ShimoDocs compares',
    body: 'The capability matrix plus one-at-a-time comparisons with Google Docs, Microsoft 365, Nextcloud, ONLYOFFICE, Notion, Confluence and SharePoint.',
    to: '/comparison',
    action: 'Compare the platforms',
  },
  {
    kicker: 'Downloads',
    title: 'Installers and licences',
    body: `Linux amd64 and arm64 packages, the free perpetual licence for up to ${FREE_TEAM_LIMIT_WORD} users, and the release channel behind both.`,
    to: '/download',
    action: 'Get the installer',
  },
]

const STARTERS = [
  ['/blog/what-is-private-cloud-document-collaboration', 'What private cloud document collaboration actually means'],
  ['/blog/best-google-docs-alternatives', 'The best Google Docs alternatives, by what you need'],
  ['/blog/how-to-migrate-from-google-workspace', 'How to migrate from Google Workspace without losing work'],
  ['/blog/self-hosted-collaboration-guide', 'A practical guide to self-hosting collaboration'],
  ['/blog/data-sovereignty-document-collaboration', 'Data sovereignty in document collaboration'],
  ['/blog/shimodocs-vs-google-docs', 'ShimoDocs vs Google Docs: a working comparison'],
]

export default function Resources() {
  return (
    <div className="page">
      <section className="section page-intro">
        <Eyebrow>Resources</Eyebrow>
        <h1>
          Guides, comparisons
          <br />
          <span className="gradient">and downloads.</span>
        </h1>
        <p>
          Everything we publish about secure document collaboration and private cloud deployment, collected in one
          place: the journal, the deployment guides, the platform comparisons and the installers.
        </p>
      </section>

      <section className="section">
        <Eyebrow>Collections</Eyebrow>
        <h2>
          Four places
          <br />
          <span className="gradient">to start.</span>
        </h2>
        <div className="value-grid">
          {COLLECTIONS.map(collection => (
            <article className="value-card" key={collection.to}>
              <h3>{collection.title}</h3>
              <p>{collection.body}</p>
              <p>
                <Link className="text-link" to={collection.to}>
                  {collection.action} ↗
                </Link>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <Eyebrow>Start here</Eyebrow>
        <h2>
          The six articles
          <br />
          <span className="gradient">read first.</span>
        </h2>
        <p className="section-lead">
          If you are evaluating a move off a public cloud suite, these cover the questions that decide the project:
          what private cloud collaboration is, which alternative fits, how migration runs, and who ends up holding the
          data.
        </p>
        <div className="value-grid">
          {STARTERS.map(([to, label]) => (
            <article className="value-card" key={to}>
              <h3>
                {/* Articles are prerendered documents with no client bundle, so
                    they are linked with a plain anchor. */}
                <a href={to}>{label}</a>
              </h3>
            </article>
          ))}
        </div>
      </section>

      <section className="section cta-section">
        <Eyebrow>Next step</Eyebrow>
        <h2>
          Looking for something
          <br />
          <span className="gradient">that is not here?</span>
        </h2>
        <p className="section-lead">
          Tell us what you are trying to work out — deployment sizing, a security review, a migration plan — and we will
          point you at the material or write it.
        </p>
        <div className="hero-actions">
          <Link className="button" to="/contact-sales">
            Contact Sales
          </Link>
          <Link className="text-link" to="/blog">
            Browse every article ↗
          </Link>
        </div>
      </section>
    </div>
  )
}
