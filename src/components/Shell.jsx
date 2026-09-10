import { Link, NavLink } from 'react-router-dom'

const links = [
  ['/', 'Home'], ['/ai-workspace', 'AI Workspace'], ['/blog', 'Blog'], ['/help-center', 'Help Center'], ['/pricing', 'Pricing'], ['/contact-sales', 'Contact Sales']
]
export default function Shell({children}) {
  return <div className="site-shell">
    <header className="site-nav"><Link to="/" className="brand">Shimo<span>Docs</span></Link><nav className="nav-tabs" aria-label="Primary navigation">{links.map(([to,label]) => <NavLink key={to} to={to} end={to === '/'} className={({isActive}) => isActive ? 'active' : ''}>{label}</NavLink>)}</nav><div className="nav-actions"><Link to="/contact-sales" className="signin">Sign in</Link><Link to="/contact-sales" className="nav-cta">Get started</Link><a className="github" href="https://github.com/shimodocs/shimodocs" target="_blank" rel="noreferrer" aria-label="ShimoDocs on GitHub"><svg viewBox="0 0 24 24"><path d="M12 .7a11.3 11.3 0 0 0-3.57 22.02c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.33-3.8-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.62 1.22 3.26.93.1-.73.39-1.22.71-1.5-2.5-.29-5.13-1.25-5.13-5.57 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.11 1.15a10.8 10.8 0 0 1 5.66 0c2.16-1.45 3.1-1.15 3.1-1.15.62 1.55.23 2.69.12 2.98.72.79 1.16 1.79 1.16 3.02 0 4.33-2.64 5.28-5.15 5.56.4.35.76 1.05.76 2.12v3.14c0 .3.2.65.78.54A11.3 11.3 0 0 0 12 .7Z"/></svg></a></div></header>
    <main>{children}</main><footer className="site-footer"><span>© 2026 ShimoDocs</span><span>Intelligent work, in one place.</span></footer>
  </div>
}
