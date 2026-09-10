// The route table is the single source of truth shared by the client router
// and the build-time prerenderer. Adding a route here automatically gives it a
// prerendered HTML file, so a new page can never silently ship as crawlable
// nothing.
import Home from './pages/Home'
import AIWorkspace from './pages/AIWorkspace'
import Blog from './pages/Blog'
import HelpCenter from './pages/HelpCenter'
import Pricing from './pages/Pricing'
import ContactSales from './pages/ContactSales'
import { ROUTE_SEO } from './seo'

export const ROUTES = [
  { path: '/', label: 'Home', Component: Home },
  { path: '/ai-workspace', label: 'AI Workspace', Component: AIWorkspace },
  { path: '/blog', label: 'Blog', Component: Blog },
  { path: '/help-center', label: 'Help Center', Component: HelpCenter },
  { path: '/pricing', label: 'Pricing', Component: Pricing },
  { path: '/contact-sales', label: 'Contact Sales', Component: ContactSales },
]

export const NAV_LINKS = ROUTES.map(({ path, label }) => [path, label])

// Guards the assumption the prerenderer and nginx both rely on: every router
// path has SEO metadata, and every metadata entry has a router path.
const routePaths = ROUTES.map(route => route.path).sort()
const seoPaths = Object.keys(ROUTE_SEO).sort()
if (routePaths.join('|') !== seoPaths.join('|')) {
  throw new Error(
    `Route/SEO mismatch.\n  routes: ${routePaths.join(', ')}\n  seo:    ${seoPaths.join(', ')}`,
  )
}
