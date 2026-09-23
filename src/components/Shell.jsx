import { Link, NavLink, useLocation } from 'react-router-dom'
import { LICENSE_EMAIL, LICENSE_REQUEST_URL } from '../downloads'
import { NAV_LINKS, SOLUTION_GROUPS } from '../routes'
import { GITHUB_URL } from '../seo'
import { FREE_TEAM_LIMIT } from '../pricing-facts.js'

// The header links and the footer are both in the prerendered HTML. Article
// and documentation pages ship no client JavaScript, so the Solutions menu is
// a native details element rather than a click handler.
const SOLUTION_PATHS = SOLUTION_GROUPS.flatMap(group => group.links.map(([path]) => path))

const FOOTER_SECTIONS = [
  {
    heading: 'Product',
    links: [
      ['/ai-workspace', 'AI Workspace'],
      ['/pricing', 'Pricing'],
      ['/download', 'Download'],
      [LICENSE_REQUEST_URL, 'Free license'],
      ['/contact-sales', 'Get started'],
    ],
  },
  {
    heading: 'Solutions',
    links: SOLUTION_GROUPS.flatMap(group => group.links),
  },
  {
    heading: 'Learn',
    links: [
      ['/docs', 'Docs'],
      ['/blog', 'Blog'],
      ['/resources', 'Resources'],
      ['/help-center', 'Help Center'],
    ],
  },
  {
    heading: 'Company',
    links: [
      ['/about', 'About'],
      ['/comparison', 'Comparison'],
      [GITHUB_URL, 'GitHub'],
      ['/legal-page/privacy-policy', 'Privacy'],
      ['/legal-page/terms-conditions', 'Terms'],
    ],
  },
]

export default function Shell({ children }) {
  const { pathname } = useLocation()
  const solutionsActive = SOLUTION_PATHS.some(path => pathname === path)
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-nav">
        <Link to="/" className="brand" aria-label="ShimoDocs home">
          <img src="/assets/logo-shimodocs.svg" alt="ShimoDocs" width="500" height="110" />
        </Link>
        <nav className="nav-tabs" aria-label="Primary navigation">
          <details className="nav-menu">
            <summary className={solutionsActive ? 'active' : undefined}>Solutions</summary>
            <div className="nav-panel">
              {SOLUTION_GROUPS.map(group => (
                <div key={group.label}>
                  <b>{group.label}</b>
                  {group.links.map(([to, label]) => (
                    <Link key={to} to={to}>
                      {label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </details>
          {NAV_LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
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
            <img src="/assets/logo-shimodocs.svg" alt="ShimoDocs" width="500" height="110" />
          </span>
          <p>Self-hosted document collaboration with AI agents, in your private cloud.</p>
          <p className="footer-contact">
            Free for up to {FREE_TEAM_LIMIT} users · License requests &amp; support:{' '}
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
                    <a
                      key={to}
                      href={to}
                      data-analytics-event="license_request_click"
                      data-analytics-surface="footer"
                    >
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
          <span>
            <Link to="/legal-page/privacy-policy">Privacy Policy</Link>
            {' · '}
            <Link to="/legal-page/terms-conditions">Terms &amp; Conditions</Link>
          </span>
          <span>Intelligent work, in one place.</span>
        </div>
      </footer>
    </div>
  )
}
