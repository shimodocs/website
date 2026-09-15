import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Section'

// The company page the previous site published at /about. The URL is kept
// exactly so the page Google already indexed keeps its address and ranking
// instead of being redirected to the home page.
const STATS = [
  ['12+', 'years of collaboration'],
  ['1000+', 'teams served'],
  ['Private', 'cloud ready'],
]

const TIMELINE = [
  ['2012', 'Shimo begins with a simple idea: make teamwork better.'],
  ['Growth', 'Teams adopt Shimo to collaborate across files and formats.'],
  ['Enterprise', 'Security, permissions and control become mission critical.'],
  ['Today', 'A privacy-first office platform built for your own environment.'],
]

export default function About() {
  return (
    <div className="page">
      <section className="section page-intro">
        <Eyebrow>About ShimoDocs</Eyebrow>
        <h1>
          Collaboration that stays
          <br />
          <span className="gradient">under your control.</span>
        </h1>
        <p>
          ShimoDocs brings modern collaboration to private cloud environments, giving teams control over their data,
          their access and their deployment.
        </p>
        <div className="hero-actions">
          <Link className="button" to="/contact-sales">
            Contact Sales
          </Link>
          <Link className="text-link" to="/ai-workspace">
            Explore the workspace ↗
          </Link>
        </div>
      </section>

      <section className="section">
        <Eyebrow>Our origin</Eyebrow>
        <h2>
          The Shimo story
        </h2>
        <div className="post-body">
          <p>
            Shimo started as a cloud-based collaboration product 12 years ago, built on a simple idea: collaboration
            platforms should be simple, reliable and made for real work. Since then Shimo has served thousands of
            companies, including leading internet and technology teams such as DiDi, Baidu, TCL and OPPO.
          </p>
          <p>
            The needs, challenges and practices we learned from those organisations became the foundation for the
            private deployment product we build today. As privacy and data security became more important for
            enterprises, Shimo evolved into a privacy-first office platform: docs, sheets, slides, forms and tables that
            stay inside the customer&apos;s own environment.
          </p>
        </div>

        <div className="value-grid">
          {STATS.map(([figure, label]) => (
            <article className="value-card" key={label}>
              <h3>{figure}</h3>
              <p>{label}</p>
            </article>
          ))}
        </div>

        <div className="page-figures two-up">
          <figure className="page-figure">
            <img
              src="/assets/about-private-cloud.png"
              alt="Documents, spreadsheets, presentations and forms passing through a security boundary into servers and storage"
              width="1400"
              height="933"
              loading="lazy"
            />
            <figcaption>
              The editing experience stays the same; where the files live changes. Content, permissions and AI endpoints
              stay inside infrastructure you operate.
            </figcaption>
          </figure>
          <figure className="page-figure">
            <img
              src="/assets/about-global-teams.png"
              alt="Diagram of one private project workspace shared by teams in North America, Europe, South America and Asia Pacific, with admin and security controls around it"
              width="1400"
              height="860"
              loading="lazy"
            />
            <figcaption>
              One workspace, four regional teams, and the admin and security controls that sit around it. Which region
              holds the data is a deployment decision, not a vendor default.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="section">
        <Eyebrow>How we got here</Eyebrow>
        <h2>
          From cloud tool
          <br />
          <span className="gradient">to private platform.</span>
        </h2>
        <div className="value-grid">
          {TIMELINE.map(([stage, body]) => (
            <article className="value-card" key={stage}>
              <h3>{stage}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <Eyebrow>Where we are going</Eyebrow>
        <h2>
          Bringing Shimo
          <br />
          <span className="gradient">to teams worldwide.</span>
        </h2>
        <div className="post-body">
          <p>
            Today, Shimo brings a Google Docs-like collaboration experience to organisations that need stronger data
            protection, private deployment and full control over their data — without giving up the editing experience
            their teams already know. The suite runs on infrastructure you own, with the AI features configured against
            endpoints you choose.
          </p>
          <p>
            Read how that works in practice in our <Link to="/help-center">self-hosted deployment guides</Link>, or see{' '}
            {/* Articles are standalone prerendered documents with no client
                bundle, so they are linked with a plain anchor rather than a
                router Link. */}
            <a href="/blog/what-is-private-cloud-document-collaboration">what private cloud collaboration means</a> for
            a team that is evaluating the move.
          </p>
        </div>
      </section>

      <section className="section cta-section">
        <Eyebrow>Next step</Eyebrow>
        <h2>
          Ready to build
          <br />
          <span className="gradient">your private cloud docs?</span>
        </h2>
        <p className="section-lead">
          Talk to the team about your environment, your compliance constraints and the migration path from the suite you
          use today.
        </p>
        <div className="hero-actions">
          <Link className="button" to="/contact-sales">
            Contact Sales
          </Link>
          <Link className="text-link" to="/pricing">
            See pricing ↗
          </Link>
        </div>
      </section>
    </div>
  )
}
