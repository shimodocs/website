import { Link, NavLink } from 'react-router-dom'
import { DOWNLOADS, LICENSE_EMAIL, LICENSE_REQUEST_URL } from '../downloads'
import { NAV_LINKS } from '../routes'
import { GITHUB_URL } from '../seo'

// Descriptive anchor text and a full site footer give crawlers an internal
// link graph. The previous shell exposed only six nav labels and no footer
// navigation at all.
const FOOTER_SECTIONS = [
  {
    heading: 'Product',
    links: [
      ['/ai-workspace', 'AI Workspace for documents'],
      [DOWNLOADS.latest, 'Download the self-hosted installer'],
      [LICENSE_REQUEST_URL, 'Request a free 5-user license'],
      ['/pricing', 'Pricing and plans'],
      ['/contact-sales', 'Request a private cloud demo'],
    ],
  },
  {
    heading: 'Resources',
    links: [
      ['/help-center', 'Self-hosted deployment guides'],
      ['/blog', 'Private cloud collaboration blog'],
      [GITHUB_URL, 'ShimoDocs on GitHub'],
    ],
  },
]

export default function Shell({ children }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-nav">
        <Link to="/" className="brand" aria-label="ShimoDocs home">
          Shimo<span>Docs</span>
        </Link>
        <nav className="nav-tabs" aria-label="Primary navigation">
          {NAV_LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <a
            className="github"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="ShimoDocs on GitHub"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .7a11.3 11.3 0 0 0-3.57 22.02c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.33-3.8-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.62 1.22 3.26.93.1-.73.39-1.22.71-1.5-2.5-.29-5.13-1.25-5.13-5.57 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.11 1.15a10.8 10.8 0 0 1 5.66 0c2.16-1.45 3.1-1.15 3.1-1.15.62 1.55.23 2.69.12 2.98.72.79 1.16 1.79 1.16 3.02 0 4.33-2.64 5.28-5.15 5.56.4.35.76 1.05.76 2.12v3.14c0 .3.2.65.78.54A11.3 11.3 0 0 0 12 .7Z" />
            </svg>
          </a>
          <Link to="/contact-sales" className="nav-cta">
            Get started
          </Link>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="footer-brand">
          <span className="footer-logo">
            Shimo<span>Docs</span>
          </span>
          <p>Self-hosted document collaboration with AI agents, in your private cloud.</p>
          <p className="footer-contact">
            Free for up to 5 users · License requests &amp; support:{' '}
            <a href={LICENSE_REQUEST_URL}>{LICENSE_EMAIL}</a>
          </p>
        </div>
        <nav className="footer-nav" aria-label="Footer navigation">
          {FOOTER_SECTIONS.map(section => (
            <div key={section.heading}>
              <h2>{section.heading}</h2>
              {section.links.map(([to, label]) => {
                // mailto: must stay a plain anchor. Treating it as an internal
                // path would hand it to the router and the link would do
                // nothing.
                if (to.startsWith('mailto:')) {
                  return (
                    <a key={to} href={to}>
                      {label}
                    </a>
                  )
                }
                if (to.startsWith('http')) {
                  return (
                    <a key={to} href={to} target="_blank" rel="noreferrer">
                      {label}
                    </a>
                  )
                }
                return (
                  <Link key={to} to={to}>
                    {label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="footer-legal">
          <span>© 2026 ShimoDocs</span>
          <span>Intelligent work, in one place.</span>
        </div>
      </footer>
    </div>
  )
}
