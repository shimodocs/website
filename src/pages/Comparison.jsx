import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Section'

// The comparison hub the previous site published at /comparison. The matrix
// below is the same one that page rendered (its ticks were icon sprites, so the
// cells were recovered from the sprite references rather than re-invented).
const PRODUCTS = ['ShimoDocs', 'Google Docs', 'Microsoft 365', 'Nextcloud', 'ONLYOFFICE', 'Notion']

const MATRIX = [
  ['Real-time collaboration', '✓', '✓', '✓', '✓', '✓', '✓'],
  ['Private deployment', '✓', '—', 'Limited', '✓', '✓', '—'],
  ['Full data ownership', '✓', '—', 'Limited', '✓', '✓', '—'],
  ['Native browser editor', '✓', '✓', '—', '—', '✓', '—'],
  ['Enterprise permissions', '✓', '✓', '✓', '✓', '✓', 'Limited'],
  ['Audit logs', '✓', '✓', '✓', '✓', '✓', 'Enterprise only'],
  ['SSO', '✓', '✓', '✓', '✓', '✓', 'Enterprise only'],
  ['Open API', '✓', '✓', '✓', '✓', '✓', '✓'],
  ['Web · desktop · mobile', '✓', '✓', '✓', '✓', '✓', '✓'],
  [
    'Starting price',
    '$5 / user / month',
    '$6 / user / month',
    '$6 / user / month',
    'Server cost',
    'Server cost',
    '$10+ / user / month',
  ],
]

const REASONS = [
  ['Familiar experience', 'Google Docs-style editing that your team can adopt in minutes.'],
  ['Private and secure', 'Deploy in your own environment and keep full control of your data.'],
  ['Enterprise control', 'Advanced permissions, audit logs, SSO and compliance-ready controls.'],
  ['More affordable', 'Simple pricing that costs less without compromising on security.'],
  ['Open and extensible', 'An open API and flexible architecture that grows with your business.'],
]

const DEEP_DIVES = [
  ['/blog/shimodocs-vs-google-docs', 'ShimoDocs vs Google Docs'],
  ['/blog/shimodocs-vs-microsoft-365', 'ShimoDocs vs Microsoft 365'],
  ['/blog/shimodocs-vs-notion', 'ShimoDocs vs Notion'],
  ['/blog/shimodocs-vs-confluence', 'ShimoDocs vs Confluence'],
  ['/blog/shimodocs-vs-sharepoint', 'ShimoDocs vs SharePoint'],
  ['/blog/best-google-docs-alternatives', 'The best Google Docs alternatives'],
]

export default function Comparison() {
  return (
    <div className="page">
      <section className="section page-intro">
        <Eyebrow>Comparison</Eyebrow>
        <h1>
          Compare ShimoDocs with
          <br />
          <span className="gradient">leading collaboration platforms.</span>
        </h1>
        <p>
          How ShimoDocs compares with Google Docs, Microsoft 365, Nextcloud, ONLYOFFICE and Notion on private
          deployment, data ownership, editing experience, permissions and price.
        </p>
      </section>

      <section className="section">
        <Eyebrow>Capability matrix</Eyebrow>
        <h2>
          One table,
          <br />
          <span className="gradient">six platforms.</span>
        </h2>
        <p className="section-lead">
          Ticks mark capabilities available on the platform&apos;s own terms. &ldquo;Limited&rdquo; and &ldquo;Enterprise
          only&rdquo; mark capabilities that exist but are restricted or gated. &ldquo;Native browser editor&rdquo;
          marks an editor built for the web, as opposed to a browser version of a desktop suite or an editor supplied by
          an integrated third party — which is the distinction those cells draw, not whether documents can be edited
          together. Prices are list prices per user per month when billed annually, last reviewed in September 2026;
          self-hosted options are shown as infrastructure cost because you supply the servers.
        </p>
        <div className="post-body">
          <table>
            <thead>
              <tr>
                <th scope="col">Capability</th>
                {PRODUCTS.map(product => (
                  <th scope="col" key={product}>
                    {product}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map(([capability, ...cells]) => (
                <tr key={capability}>
                  <th scope="row">{capability}</th>
                  {cells.map((cell, index) => (
                    <td key={PRODUCTS[index]}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <Eyebrow>Why teams choose ShimoDocs</Eyebrow>
        <h2>
          The same editing experience,
          <br />
          <span className="gradient">inside your own boundary.</span>
        </h2>
        <div className="value-grid">
          {REASONS.map(([title, body]) => (
            <article className="value-card" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>

        <div className="page-figures">
          <figure className="page-figure">
            <img
              src="/assets/workspace-collaboration.png"
              alt="ShimoDocs editor showing a product launch plan with two live collaborator cursors and a comments panel"
              width="1400"
              height="750"
              loading="lazy"
            />
            <figcaption>
              The comparison above is about where the work runs, not what it feels like to do. Live cursors, comments
              and sharing behave the way your team already expects.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="section">
        <Eyebrow>Read the comparisons in full</Eyebrow>
        <h2>
          One platform at a time,
          <br />
          <span className="gradient">in detail.</span>
        </h2>
        <p className="section-lead">
          Each article works through the migration questions a team actually asks: what moves cleanly, what does not, and
          what you keep control of afterwards.
        </p>
        <div className="value-grid">
          {DEEP_DIVES.map(([to, label]) => (
            <article className="value-card" key={to}>
              <h3>
                {/* Articles carry no client bundle, so they are linked with a
                    plain anchor instead of a router Link. */}
                <a href={to}>{label}</a>
              </h3>
              <p>
                <a className="text-link" href={to}>
                  Read the comparison ↗
                </a>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section faq-section">
        <Eyebrow>Next step</Eyebrow>
        <h2>
          Ready to compare
          <br />
          <span className="gradient">against your own environment?</span>
        </h2>
        <p className="section-lead">
          The useful comparison is the one run against your requirements, your compliance constraints and your existing
          suite. Talk to the team, or start with the deployment guides.
        </p>
        <div className="hero-actions">
          <Link className="button" to="/contact-sales">
            Contact Sales
          </Link>
          <Link className="text-link" to="/help-center">
            Deployment guides ↗
          </Link>
        </div>
      </section>
    </div>
  )
}
