import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Section'
import { DOWNLOADS, LICENSE_EMAIL, LICENSE_REQUEST_URL } from '../downloads'

// The previous site published /download as a "Coming Soon" placeholder with no
// installer on it. The URL is kept because Google has it indexed, and it now
// carries the real self-hosted packages the repository publishes.
const PACKAGES = [
  {
    arch: 'amd64',
    audience: 'x86-64 servers and virtual machines',
    size: DOWNLOADS.amd64.size,
    url: DOWNLOADS.amd64.url,
  },
  {
    arch: 'arm64',
    audience: 'ARM servers, Apple silicon and edge hardware',
    size: DOWNLOADS.arm64.size,
    url: DOWNLOADS.arm64.url,
  },
]

export default function Download() {
  return (
    <div className="page">
      <section className="section page-intro">
        <Eyebrow>Download</Eyebrow>
        <h1>
          Download ShimoDocs
          <br />
          <span className="gradient">for your own servers.</span>
        </h1>
        <p>
          Self-hosted installers for Linux, built from the open release channel. Version {DOWNLOADS.version}, published
          as a zip archive with the deployment assets inside.
        </p>
        <div className="hero-actions">
          <a className="button download-cta" href={DOWNLOADS.amd64.url}>
            Download for Linux · amd64
          </a>
          <a className="text-link" href={DOWNLOADS.latest} target="_blank" rel="noreferrer">
            All releases ↗
          </a>
        </div>
        <p className="download-meta">
          Current installer version {DOWNLOADS.version} · the licence key is requested separately and is free for up to
          five users.
        </p>
      </section>

      <section className="section">
        <Eyebrow>Packages</Eyebrow>
        <h2>
          Two architectures,
          <br />
          <span className="gradient">one installer format.</span>
        </h2>
        <p className="section-lead">
          Both builds ship the same suite — documents, tables, slides, forms, AI workspace and the administration
          surfaces. Pick the architecture that matches the machines you are deploying to.
        </p>
        <div className="value-grid">
          {PACKAGES.map(pkg => (
            <article className="value-card" key={pkg.arch}>
              <h3>Linux · {pkg.arch}</h3>
              <p>{pkg.audience}</p>
              <p className="download-meta">Archive size {pkg.size}</p>
              <a className="button download-cta" href={pkg.url}>
                Download {pkg.arch}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <Eyebrow>Licence</Eyebrow>
        <h2>
          Free for up to five users,
          <br />
          <span className="gradient">perpetual, no credit card.</span>
        </h2>
        <p className="section-lead">
          The global build is licensed per deployment, not per month. Email the team to request the free perpetual
          licence for teams of five or fewer; larger teams are quoted by the sales team.
        </p>
        <div className="hero-actions">
          <a className="button outline license-cta" href={LICENSE_REQUEST_URL}>
            Get a free perpetual license
          </a>
          <Link className="text-link" to="/pricing">
            See pricing ↗
          </Link>
        </div>
        <div className="post-body">
          <p>
            The request opens a prefilled message to <a href={LICENSE_REQUEST_URL}>{LICENSE_EMAIL}</a> so the deployment
            details reach us in one step instead of three. Install the package first if you prefer — the installer does
            not require the key until you activate the deployment.
          </p>
        </div>
      </section>

      <section className="section faq-section">
        <Eyebrow>Before you install</Eyebrow>
        <h2>
          Read the deployment
          <br />
          <span className="gradient">guides first.</span>
        </h2>
        <p className="section-lead">
          The help center covers the Kubernetes deployment, middleware configuration, AI endpoint setup, backups and the
          checks we recommend before a rollout reaches real work.
        </p>
        <div className="hero-actions">
          <Link className="button" to="/help-center">
            Deployment guides
          </Link>
          <Link className="text-link" to="/contact-sales">
            Talk to the team ↗
          </Link>
        </div>
      </section>
    </div>
  )
}
