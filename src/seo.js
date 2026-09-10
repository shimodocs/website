// Single source of truth for SEO metadata.
//
// This module is intentionally pure: no JSX, no component imports, no DOM.
// It is consumed by the client runtime (head synchronisation), by the
// build-time prerenderer, and by the sitemap/robots generators. Keeping one
// table means a route can never drift between the router and the crawler.
import { DOWNLOADS } from './downloads'

const FALLBACK_SITE_URL = 'http://43.172.115.22'

// Vite inlines import.meta.env at build time for both the client and the SSR
// bundle, so the prerenderer sees the same origin the browser would.
export const SITE_URL = String(import.meta.env.VITE_SITE_URL || FALLBACK_SITE_URL).replace(/\/+$/, '')

export const SITE_NAME = 'ShimoDocs'
export const SITE_ALTERNATE_NAME = 'Shimo Docs'
export const SITE_TAGLINE = 'Intelligent work, in one place.'
export const CONTACT_EMAIL = 'sales@shimodocs.com'
export const GITHUB_URL = 'https://github.com/shimodocs/shimodocs'
export const LOGO_URL = `${SITE_URL}/logo.png`
export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

const DEFAULT_KEYWORDS =
  'ShimoDocs, private cloud document collaboration, self-hosted office suite, secure document collaboration, AI agents, data sovereignty, enterprise document management'

// Title pattern follows the established brand convention:
//   ShimoDocs <Page> | <keyword descriptor>
// Home leads with the brand because it competes for the brand query.
export const ROUTE_SEO = {
  '/': {
    changeFrequency: 'weekly',
    priority: '1.0',
    title: 'ShimoDocs | Private Cloud Document Collaboration with AI',
    description:
      'Self-hosted document collaboration in your private cloud — docs, sheets, slides, forms, tables and AI agents, with enterprise permissions and full data control.',
    keywords: DEFAULT_KEYWORDS,
    ogAlt: 'ShimoDocs workspace showing a shared launch plan edited by people and AI agents',
  },
  '/ai-workspace': {
    changeFrequency: 'monthly',
    priority: '0.9',
    title: 'AI Workspace | AI Agents for Private Cloud Docs — ShimoDocs',
    description:
      'See how ShimoDocs AI agents research, draft and organise work inside your documents — with visible edit history and human review at every step.',
    keywords:
      'AI workspace, AI agents for documents, private cloud AI, self-hosted AI assistant, AI document collaboration, enterprise AI data control, bring your own AI',
    ogAlt: 'ShimoDocs AI Workspace showing an agent editing a shared launch brief',
  },
  '/blog': {
    changeFrequency: 'weekly',
    priority: '0.7',
    title: 'ShimoDocs Blog | Private Cloud Collaboration Insights',
    description:
      'Insights on private cloud collaboration, document security, data sovereignty and enterprise AI — practical guides and field notes from the ShimoDocs team.',
    keywords:
      'private cloud collaboration blog, document security, data sovereignty, enterprise productivity, secure digital workplace, self-hosted collaboration guide',
    ogAlt: 'ShimoDocs journal cover artwork',
  },
  '/help-center': {
    changeFrequency: 'weekly',
    priority: '0.7',
    title: 'ShimoDocs Help Center | Self-Hosted Deployment Guides',
    description:
      'Official ShimoDocs guides for deploying, operating and troubleshooting the suite in your private cloud — Kubernetes, middleware, AI configuration and backups.',
    keywords:
      'ShimoDocs documentation, self-hosted deployment guide, Kubernetes deployment, private cloud installation, middleware configuration, backup and incident response',
    ogAlt: 'ShimoDocs deployment documentation index',
  },
  '/pricing': {
    changeFrequency: 'monthly',
    priority: '0.8',
    title: 'ShimoDocs Pricing | Free Up to 5 Users in Your Private Cloud',
    description:
      'ShimoDocs is free for teams of up to five people. Larger teams pay $5 per user per month for advanced permissions, SSO, audit logs and AI assistance.',
    keywords:
      'ShimoDocs pricing, private cloud document collaboration pricing, self-hosted office suite cost, free document collaboration, enterprise document platform pricing',
    ogAlt: 'ShimoDocs pricing plans for free and team deployments',
  },
  '/contact-sales': {
    changeFrequency: 'monthly',
    priority: '0.8',
    title: 'Contact Sales | ShimoDocs Private Cloud Deployment',
    description:
      'Talk to the ShimoDocs team about private cloud deployment, self-hosted AI configuration, migration from Google Docs, security review and enterprise rollout.',
    keywords:
      'contact ShimoDocs sales, private cloud deployment, enterprise document collaboration demo, self-hosted office suite rollout, Google Docs alternative',
    ogAlt: 'Contact the ShimoDocs sales team',
  },
}

export const ROUTE_PATHS = Object.keys(ROUTE_SEO)

export function resolveSeo(pathname) {
  const clean = normalisePath(pathname)
  const meta = ROUTE_SEO[clean] || ROUTE_SEO['/']
  return {
    ...meta,
    path: ROUTE_SEO[clean] ? clean : '/',
    canonical: canonicalFor(clean),
  }
}

export function normalisePath(pathname) {
  if (!pathname) return '/'
  const cut = String(pathname).split('?')[0].split('#')[0]
  if (cut.length > 1 && cut.endsWith('/')) return cut.replace(/\/+$/, '') || '/'
  return cut || '/'
}

export function canonicalFor(pathname) {
  const clean = normalisePath(pathname)
  return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean}`
}

// Frequently asked questions. Rendered on the home page and mirrored into
// FAQPage structured data so the same source feeds users and crawlers.
export const FAQS = [
  {
    question: 'What is ShimoDocs?',
    answer:
      'ShimoDocs is a self-hosted document collaboration suite for real-time docs, writers, spreadsheets, presentations, forms and tables. It runs inside your own private cloud and includes configurable AI agents built into every product.',
  },
  {
    question: 'Is ShimoDocs self-hosted?',
    answer:
      'Yes. ShimoDocs is deployed into infrastructure you control — a single-node or high-availability Kubernetes cluster — so documents, metadata and AI context stay inside your own network boundary.',
  },
  {
    question: 'How does AI work inside ShimoDocs?',
    answer:
      'AI agents work in the same document people are editing. Every action appears with an identity, a live cursor and an entry in the edit history, so a reviewer can see what changed and take over at any point.',
  },
  {
    question: 'Can we bring our own AI models?',
    answer:
      'Yes. The AI configuration layer lets you point ShimoDocs at the model provider you have approved, so prompts and document context are not sent to a vendor you have not chosen.',
  },
  {
    question: 'Is ShimoDocs a Google Docs alternative?',
    answer:
      'ShimoDocs covers the same collaboration surface — real-time editing, comments, version history and sharing — but keeps the data in your private cloud and adds document-level permission and audit controls.',
  },
  {
    question: 'How much does ShimoDocs cost?',
    answer:
      'ShimoDocs is free for teams of up to five people. Teams above five pay $5 per user per month, with annual billing saving 20%. Server and infrastructure costs are managed separately by your team.',
  },
  {
    question: 'How do I get a license?',
    answer:
      'Email support.global@shimo.im to request the free-forever 5-user license. No credit card is required. Larger teams can ask for a quote based on team size, and the license is activated from the operations platform after the suite is deployed.',
  },
]

export function breadcrumbFor(pathname) {
  const clean = normalisePath(pathname)
  const items = [{ name: 'Home', url: canonicalFor('/') }]
  if (clean !== '/' && ROUTE_SEO[clean]) {
    items.push({ name: breadcrumbLabel(clean), url: canonicalFor(clean) })
  }
  return items
}

function breadcrumbLabel(pathname) {
  const titles = {
    '/ai-workspace': 'AI Workspace',
    '/blog': 'Blog',
    '/help-center': 'Help Center',
    '/pricing': 'Pricing',
    '/contact-sales': 'Contact Sales',
  }
  return titles[pathname] || ROUTE_SEO[pathname]?.title || pathname
}

// A single @graph per page keeps node identity stable across the site, which
// is how the existing production site models its structured data.
export function jsonLdFor(pathname) {
  const clean = normalisePath(pathname)
  const meta = resolveSeo(clean)
  const isHome = meta.path === '/'
  const pageId = `${meta.canonical}#webpage`

  const graph = [
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE_NAME,
      alternateName: SITE_ALTERNATE_NAME,
      url: canonicalFor('/'),
      logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
      description:
        'ShimoDocs is a self-hosted document collaboration suite for real-time docs, sheets, slides, forms and tables, with configurable AI agents in your private cloud.',
      sameAs: [GITHUB_URL],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'sales',
          email: CONTACT_EMAIL,
          url: canonicalFor('/contact-sales'),
          availableLanguage: ['English'],
        },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: canonicalFor('/'),
      name: SITE_NAME,
      alternateName: SITE_ALTERNATE_NAME,
      description: SITE_TAGLINE,
      inLanguage: 'en',
      publisher: { '@id': ORGANIZATION_ID },
    },
    {
      '@type': isHome ? 'WebPage' : 'WebPage',
      '@id': pageId,
      url: meta.canonical,
      name: meta.title,
      description: meta.description,
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': ORGANIZATION_ID },
      inLanguage: 'en',
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: OG_IMAGE_URL,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
      },
    },
  ]

  if (!isHome) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${meta.canonical}#breadcrumb`,
      itemListElement: breadcrumbFor(clean).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    })
    graph[2].breadcrumb = { '@id': `${meta.canonical}#breadcrumb` }
  }

  if (isHome) {
    graph.push({
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: SITE_NAME,
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Document Collaboration',
      operatingSystem: 'Web, self-hosted (Kubernetes)',
      url: canonicalFor('/'),
      downloadUrl: DOWNLOADS.amd64.url,
      softwareVersion: DOWNLOADS.version,
      description:
        'Self-hosted document collaboration platform with real-time docs, sheets, slides, forms, tables and configurable AI agents for private cloud deployments.',
      featureList: [
        'Real-time collaborative documents',
        'Spreadsheets, presentations, forms and tables',
        'AI agents with visible edit history',
        'Enterprise permissions and audit logs',
        'Private cloud and self-hosted deployment',
      ],
      publisher: { '@id': ORGANIZATION_ID },
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free for teams of up to five people.',
          url: canonicalFor('/pricing'),
        },
        {
          '@type': 'Offer',
          name: 'Team',
          price: '5',
          priceCurrency: 'USD',
          description: 'Per user per month for teams above five people.',
          url: canonicalFor('/pricing'),
        },
      ],
    })
    graph.push({
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      isPartOf: { '@id': pageId },
      mainEntity: FAQS.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

export function headFor(pathname, options = {}) {
  const meta = resolveSeo(pathname)
  const esc = escapeHtml
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}"/>`,
    `<meta name="keywords" content="${esc(meta.keywords)}"/>`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>`,
    `<link rel="canonical" href="${esc(meta.canonical)}"/>`,
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}"/>`,
    `<meta property="og:locale" content="en_US"/>`,
    `<meta property="og:title" content="${esc(meta.title)}"/>`,
    `<meta property="og:description" content="${esc(meta.description)}"/>`,
    `<meta property="og:url" content="${esc(meta.canonical)}"/>`,
    `<meta property="og:image" content="${esc(OG_IMAGE_URL)}"/>`,
    `<meta property="og:image:secure_url" content="${esc(OG_IMAGE_URL)}"/>`,
    `<meta property="og:image:type" content="image/png"/>`,
    `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}"/>`,
    `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}"/>`,
    `<meta property="og:image:alt" content="${esc(meta.ogAlt)}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${esc(meta.title)}"/>`,
    `<meta name="twitter:description" content="${esc(meta.description)}"/>`,
    `<meta name="twitter:image" content="${esc(OG_IMAGE_URL)}"/>`,
    `<meta name="twitter:image:alt" content="${esc(meta.ogAlt)}"/>`,
    `<script type="application/ld+json" id="structured-data">${serialiseJsonLd(jsonLdFor(meta.path))}</script>`,
  ]
  return (options.indent || '    ') + tags.join('\n' + (options.indent || '    ')) + '\n  '
}

export function robotsTxt() {
  return [
    '# ShimoDocs — https://github.com/shimodocs/website',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n')
}

export function sitemapXml(lastmod = new Date().toISOString().slice(0, 10), extras = []) {
  const entries = [
    ...ROUTE_PATHS.map(path => ({
      loc: canonicalFor(path),
      lastmod,
      changefreq: ROUTE_SEO[path].changeFrequency,
      priority: ROUTE_SEO[path].priority,
    })),
    ...extras,
  ]

  const rows = entries.map(entry =>
    [
      '  <url>',
      `    <loc>${escapeHtml(entry.loc)}</loc>`,
      `    <lastmod>${entry.lastmod || lastmod}</lastmod>`,
      `    <changefreq>${entry.changefreq || 'monthly'}</changefreq>`,
      `    <priority>${entry.priority || '0.6'}</priority>`,
      '  </url>',
    ].join('\n'),
  )

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...rows, '</urlset>', ''].join('\n')
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Keep the payload safe to inline inside a <script> element.
function serialiseJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}

// ------------------------------------------------------------------- blog

export const ROBOTS_CONTENT = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

export function absoluteUrl(pathname) {
  const clean = normalisePath(pathname)
  return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean}`
}

export function blogPostPath(slug) {
  return `/blog/${slug}`
}

// Article head follows the same tag set as a static route, plus the Open Graph
// article namespace so shares carry a publication date and section.
export function blogPostHead(post, options = {}) {
  const canonical = absoluteUrl(blogPostPath(post.slug))
  const esc = escapeHtml
  const tags = [
    `<title>${esc(post.seoTitle)}</title>`,
    `<meta name="description" content="${esc(post.description)}"/>`,
    `<meta name="keywords" content="${esc(post.keywords || post.tags.join(', '))}"/>`,
    `<meta name="robots" content="${ROBOTS_CONTENT}"/>`,
    `<link rel="canonical" href="${esc(canonical)}"/>`,
    `<meta property="og:type" content="article"/>`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}"/>`,
    `<meta property="og:locale" content="en_US"/>`,
    `<meta property="og:title" content="${esc(post.seoTitle)}"/>`,
    `<meta property="og:description" content="${esc(post.description)}"/>`,
    `<meta property="og:url" content="${esc(canonical)}"/>`,
    `<meta property="og:image" content="${esc(OG_IMAGE_URL)}"/>`,
    `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}"/>`,
    `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}"/>`,
    `<meta property="og:image:alt" content="${esc(post.title)}"/>`,
    `<meta property="article:published_time" content="${esc(post.date)}"/>`,
    `<meta property="article:modified_time" content="${esc(post.updated || post.date)}"/>`,
    `<meta property="article:section" content="${esc(post.categoryLabel)}"/>`,
    ...post.tags.map(tag => `<meta property="article:tag" content="${esc(tag)}"/>`),
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${esc(post.seoTitle)}"/>`,
    `<meta name="twitter:description" content="${esc(post.description)}"/>`,
    `<meta name="twitter:image" content="${esc(OG_IMAGE_URL)}"/>`,
    `<script type="application/ld+json" id="structured-data">${serialiseJsonLd(blogPostJsonLd(post))}</script>`,
  ]
  return (options.indent || '    ') + tags.join('\n' + (options.indent || '    ')) + '\n  '
}

export function blogPostJsonLd(post) {
  const canonical = absoluteUrl(blogPostPath(post.slug))
  const pageId = `${canonical}#webpage`
  const articleId = `${canonical}#article`
  const breadcrumbId = `${canonical}#breadcrumb`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        url: canonicalFor('/'),
        logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
        sameAs: [GITHUB_URL],
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: canonicalFor('/'),
        name: SITE_NAME,
        inLanguage: 'en',
        publisher: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'WebPage',
        '@id': pageId,
        url: canonical,
        name: post.seoTitle,
        description: post.description,
        isPartOf: { '@id': WEBSITE_ID },
        breadcrumb: { '@id': breadcrumbId },
        inLanguage: 'en',
      },
      {
        '@type': 'BlogPosting',
        '@id': articleId,
        headline: post.title,
        description: post.description,
        url: canonical,
        mainEntityOfPage: { '@id': pageId },
        datePublished: post.date,
        dateModified: post.updated || post.date,
        author: { '@type': 'Organization', name: SITE_NAME, url: canonicalFor('/') },
        publisher: { '@id': ORGANIZATION_ID },
        image: [OG_IMAGE_URL],
        articleSection: post.categoryLabel,
        keywords: post.keywords || post.tags.join(', '),
        wordCount: post.words,
        inLanguage: 'en',
        isPartOf: { '@id': WEBSITE_ID },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: canonicalFor('/') },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: canonicalFor('/blog') },
          { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
        ],
      },
    ],
  }
}

// The blog index describes the collection and lists every article, giving a
// crawler an explicit inventory alongside the visible archive links.
export function blogIndexJsonLd(posts) {
  const blogId = `${canonicalFor('/blog')}#blog`
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': blogId,
    name: `${SITE_NAME} Blog`,
    description: ROUTE_SEO['/blog'].description,
    url: canonicalFor('/blog'),
    inLanguage: 'en',
    publisher: { '@id': ORGANIZATION_ID },
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: absoluteUrl(blogPostPath(post.slug)),
      datePublished: post.date,
      dateModified: post.updated || post.date,
      articleSection: post.categoryLabel,
    })),
  }
}
