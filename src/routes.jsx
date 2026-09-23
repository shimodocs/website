// The route table is the single source of truth shared by the client router
// and the build-time prerenderer. Adding a route here automatically gives it a
// prerendered HTML file, so a new page can never silently ship as crawlable
// nothing.
import Home from './pages/Home'
import AIWorkspace from './pages/AIWorkspace'
import Blog from './pages/Blog'
import BlogCategory from './pages/BlogCategory'
import HelpCenter from './pages/HelpCenter'
import DocsIndex from './pages/DocsIndex'
import Hub from './pages/Hub'
import Pricing from './pages/Pricing'
import ContactSales from './pages/ContactSales'
import About from './pages/About'
import Comparison from './pages/Comparison'
import Download from './pages/Download'
import Resources from './pages/Resources'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsConditions from './pages/TermsConditions'
import { ROUTE_SEO } from './seo'

export const ROUTES = [
  { path: '/', label: 'Home', Component: Home },
  { path: '/ai-workspace', label: 'AI Workspace', Component: AIWorkspace },
  { path: '/blog', label: 'Blog', Component: Blog },
  // Topic pages. One per category rather than a dynamic segment: the
  // prerenderer writes <route>/index.html, so a route has to be a real path.
  { path: '/blog/category/comparisons', label: 'Comparisons', Component: BlogCategory },
  { path: '/blog/category/self-hosting', label: 'Self-hosting', Component: BlogCategory },
  { path: '/blog/category/security', label: 'Security', Component: BlogCategory },
  { path: '/blog/category/ai', label: 'AI at work', Component: BlogCategory },
  { path: '/blog/category/industry', label: 'Industry', Component: BlogCategory },
  { path: '/blog/category/guides', label: 'Guides', Component: BlogCategory },
  { path: '/help-center', label: 'Help Center', Component: HelpCenter },
  { path: '/docs', label: 'Documentation', Component: DocsIndex },
  // Commercial hubs. Each answers one deployment question and links into the
  // guides that prove the answer, so a buyer arriving from a search lands on a
  // page written for that decision rather than on the blog archive.
  { path: '/on-premises', label: 'On-Premises', Component: Hub },
  { path: '/airgap', label: 'Air-Gapped', Component: Hub },
  { path: '/security', label: 'Security', Component: Hub },
  // Displacement pages. A buyer searching for a replacement for a named product
  // has already decided to move; these answer the decision rather than the
  // category, which is what the comparison articles cannot do.
  { path: '/solutions/atlassian-alternative', label: 'Atlassian Alternative', Component: Hub },
  { path: '/solutions/confluence-alternative', label: 'Confluence Alternative', Component: Hub },
  // The migration hub. It answers the question that follows a displacement
  // decision — what moving actually involves — so it sits next to the
  // solutions pages rather than in the marketing navigation.
  { path: '/migration', label: 'Migration', Component: Hub },
  { path: '/pricing', label: 'Pricing', Component: Pricing },
  { path: '/contact-sales', label: 'Contact Sales', Component: ContactSales },
  // Addresses the previous site published and Google already indexed. They are
  // served at the same path rather than redirected, so an indexed page keeps
  // both its address and its ranking.
  { path: '/about', label: 'About', Component: About },
  { path: '/comparison', label: 'Comparison', Component: Comparison },
  { path: '/download', label: 'Download', Component: Download },
  { path: '/resources', label: 'Resources', Component: Resources },
  { path: '/legal-page/privacy-policy', label: 'Privacy Policy', Component: PrivacyPolicy },
  { path: '/legal-page/terms-conditions', label: 'Terms & Conditions', Component: TermsConditions },
]

// The header is a subset of ROUTES. Home is the logo, and contact is the
// Get started button, so neither is a text tab. Help Center stays published
// at its own URL and is linked from the footer; the header points at /docs.
// Every entry must still resolve to a declared route.
const NAV_ITEMS = [
  ['/ai-workspace', 'AI Workspace'],
  ['/docs', 'Docs'],
  ['/blog', 'Blog'],
  ['/pricing', 'Pricing'],
]

export const NAV_LINKS = NAV_ITEMS.map(([path, label]) => {
  const route = ROUTES.find(candidate => candidate.path === path)
  if (!route) throw new Error(`NAV_LINKS references ${path}, which is not a declared route`)
  return [route.path, label]
})

// One top-level menu for the commercial hubs. The links are rendered in the
// initial HTML, including on article pages that ship no client JavaScript.
export const SOLUTION_GROUPS = [
  {
    label: 'Deploy',
    links: [
      ['/on-premises', 'On-premises'],
      ['/airgap', 'Air-gapped'],
      ['/security', 'Security'],
    ],
  },
  {
    label: 'Switch',
    links: [
      ['/migration', 'Migration'],
      ['/solutions/atlassian-alternative', 'Atlassian alternative'],
      ['/solutions/confluence-alternative', 'Confluence alternative'],
    ],
  },
]

for (const group of SOLUTION_GROUPS) {
  for (const [path] of group.links) {
    if (!ROUTES.some(candidate => candidate.path === path)) {
      throw new Error(`SOLUTION_GROUPS references ${path}, which is not a declared route`)
    }
  }
}

// Guards the assumption the prerenderer and nginx both rely on: every router
// path has SEO metadata, and every metadata entry has a router path.
const routePaths = ROUTES.map(route => route.path).sort()
const seoPaths = Object.keys(ROUTE_SEO).sort()
if (routePaths.join('|') !== seoPaths.join('|')) {
  throw new Error(
    `Route/SEO mismatch.\n  routes: ${routePaths.join(', ')}\n  seo:    ${seoPaths.join(', ')}`,
  )
}
