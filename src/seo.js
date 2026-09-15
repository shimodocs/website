// Single source of truth for SEO metadata.
//
// This module is intentionally pure: no JSX, no component imports, no DOM.
// It is consumed by the client runtime (head synchronisation), by the
// build-time prerenderer, and by the sitemap/robots generators. Keeping one
// table means a route can never drift between the router and the crawler.
import { DOWNLOADS } from './downloads'
import { DOCS_DEFAULT_LANGUAGE, LANGUAGE_META, docsBase, docsUi } from './docs-languages'

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

// An article can ship its own social card. The cards reused from the previous
// site are 16:9 rather than the site card's 1.91:1, so the dimensions are
// declared per article instead of assuming the shared ones.
export const ARTICLE_CARD_WIDTH = 1200
export const ARTICLE_CARD_HEIGHT = 675

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
  '/docs': {
    changeFrequency: 'weekly',
    priority: '0.9',
    title: 'ShimoDocs Documentation | Self-Hosted Deployment Guides',
    description:
      'Official ShimoDocs documentation: plan, install, operate and troubleshoot a self-hosted document collaboration suite in your own Kubernetes cluster.',
    keywords:
      'ShimoDocs documentation, self-hosted document collaboration deployment, Kubernetes installation guide, MySQL Redis MongoDB Kafka configuration, private cloud operations, backup and incident response',
    ogAlt: 'The ShimoDocs documentation index',
  },
  // Commercial hubs. These are the pages a buyer lands on from a search rather
  // than a page an editor writes for its own sake: each one answers one
  // deployment question and links into the guides that prove the answer.
  '/on-premises': {
    changeFrequency: 'monthly',
    priority: '0.9',
    title: 'On-Premises Document Collaboration | ShimoDocs',
    description:
      'Run docs, sheets, slides and forms on your own servers. What on-premises document collaboration actually requires, and how ShimoDocs deploys into it.',
    keywords:
      'on-premises document collaboration, on-prem document management, self-hosted office suite, on-premise collaboration software, private cloud documents, air-gapped alternative',
    ogAlt: 'On-premises document collaboration deployed into infrastructure you control',
    faqs: [
      {
        question: 'What does on-premises document collaboration mean?',
        answer:
          'It means the document editor, the file storage, the permissions model and the audit trail all run on servers your organisation controls, rather than on a vendor service. Users still open a browser and edit together in real time; what changes is where the content and the metadata live.',
      },
      {
        question: 'Can on-premises document collaboration work without internet access?',
        answer:
          'Yes, if the deployment supports offline installation and does not depend on an external model endpoint. ShimoDocs ships offline image packages for isolated networks, and its AI layer can be pointed at a model running inside the same boundary.',
      },
      {
        question: 'How long does an on-premises deployment take?',
        answer:
          'A single-node installation on prepared infrastructure is a matter of hours. A high-availability Kubernetes deployment with external MySQL, Redis, MongoDB, Kafka and object storage is a project measured in weeks, most of which is middleware preparation rather than the suite itself.',
      },
      {
        question: 'What infrastructure does ShimoDocs need on-premises?',
        answer:
          'For high availability, three or more servers with at least 16 cores and 32 GB of memory each, a separately mounted data disk of 300 GB or more, synchronised clocks, and either bundled or external middleware. The system requirements guide lists every prerequisite.',
      },
      {
        question: 'Is on-premises the same as private cloud?',
        answer:
          'They are close but not identical. On-premises describes whose hardware it runs on; private cloud describes who can reach it. A private cloud deployment is usually on-premises or in a dedicated tenant, and the important property in both cases is that the network boundary and the keys are yours.',
      },
    ],
  },
  '/airgap': {
    changeFrequency: 'monthly',
    priority: '0.9',
    title: 'Air-Gapped Document Collaboration | ShimoDocs',
    description:
      'Document collaboration for isolated networks: install offline, keep AI inference inside the boundary, and run the whole suite with no outbound access.',
    keywords:
      'air-gapped document collaboration, air gap office suite, offline document collaboration, isolated network collaboration software, no internet document platform, classified network documents',
    ogAlt: 'Air-gapped document collaboration installed from an offline image package',
    faqs: [
      {
        question: 'Can you run document collaboration in an air-gapped network?',
        answer:
          'Yes. It requires a deployment that can be installed from offline image packages, performs no licence call-out at runtime, and does not depend on a hosted model endpoint. ShimoDocs documents the offline installation path and supports external middleware on the isolated side.',
      },
      {
        question: 'How does AI work in an air-gapped deployment?',
        answer:
          'The AI configuration layer points at a model endpoint you choose. In an isolated network that means a model served inside the boundary, so no prompt or document context leaves the enclave. If no model is available, the collaboration features work without it.',
      },
      {
        question: 'What has to be transferred across the air gap?',
        answer:
          'The installation package, the offline image tarball, the licence file and any middleware you run externally. All four are ordinary files, which is why the deployment can be built and refreshed through a controlled transfer process rather than a network connection.',
      },
      {
        question: 'Does an air-gapped deployment lose any features?',
        answer:
          'You lose the features that are inherently online: third-party integrations that call out, public link sharing to the internet, and any AI model that is only available as a hosted API. Real-time editing, comments, version history, permissions, audit logs and search all work normally.',
      },
      {
        question: 'How are upgrades handled without internet access?',
        answer:
          'The operations platform accepts an uploaded installation package and runs its compatibility checks before applying it. On an isolated network the package is brought across by the same controlled transfer used for the original installation, so upgrades follow a reviewable process rather than an automatic one.',
      },
    ],
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
  // The routes below keep the addresses the previous site published, because
  // Google already indexed them. Their titles and descriptions stay close to
  // the ones those pages ranked with, so the indexed listing does not have to
  // be re-learned.
  '/about': {
    changeFrequency: 'monthly',
    priority: '0.6',
    title: 'About ShimoDocs | Private Cloud Document Collaboration',
    description:
      'ShimoDocs brings collaboration to private cloud environments: 12 years of collaboration software, 1000+ teams served, and a privacy-first office platform.',
    keywords:
      'about ShimoDocs, Shimo company, private cloud collaboration vendor, self-hosted office platform company, enterprise document collaboration team',
    ogAlt: 'The ShimoDocs team and the story behind the private cloud workspace',
  },
  '/comparison': {
    changeFrequency: 'monthly',
    priority: '0.7',
    title: 'ShimoDocs vs Google Workspace, Nextcloud & ONLYOFFICE',
    description:
      'Compare ShimoDocs with Google Docs, Microsoft 365, Nextcloud, ONLYOFFICE and Notion on private deployment, data ownership, editing experience and price.',
    keywords:
      'ShimoDocs comparison, Google Workspace alternative, Nextcloud alternative, ONLYOFFICE comparison, Notion vs document suite, private cloud office suite comparison',
    ogAlt: 'A capability matrix comparing ShimoDocs with five collaboration platforms',
  },
  '/download': {
    changeFrequency: 'weekly',
    priority: '0.8',
    title: 'Download ShimoDocs | Private Cloud Document Collaboration',
    description:
      'Download the self-hosted ShimoDocs installer for Linux amd64 and arm64, request the free perpetual licence for up to five users, and read the release channel.',
    keywords:
      'download ShimoDocs, self-hosted installer, Linux amd64 arm64 package, private cloud office suite download, free perpetual licence, on-premise document collaboration',
    ogAlt: 'Download the ShimoDocs self-hosted installer for Linux',
  },
  '/resources': {
    changeFrequency: 'weekly',
    priority: '0.7',
    title: 'ShimoDocs Resources | Guides, Comparisons and Downloads',
    description:
      'Guides and insights on secure document collaboration, private cloud deployment and data control, plus the platform comparisons and self-hosted installers.',
    keywords:
      'ShimoDocs resources, private cloud collaboration guides, document collaboration insights, deployment guides, platform comparisons, self-hosted downloads',
    ogAlt: 'The ShimoDocs resource hub for guides, comparisons and downloads',
  },
  '/legal-page/privacy-policy': {
    changeFrequency: 'yearly',
    priority: '0.3',
    title: 'Privacy Policy | ShimoDocs',
    description:
      'How ShimoDocs collects, uses, stores and protects personal information across our website, the self-hosted product and the support channels you contact.',
    keywords: 'ShimoDocs privacy policy, data protection, personal information, enterprise privacy, self-hosted data handling',
    ogAlt: 'The ShimoDocs privacy policy',
  },
  '/legal-page/terms-conditions': {
    changeFrequency: 'yearly',
    priority: '0.3',
    title: 'Terms & Conditions | ShimoDocs',
    description:
      'The terms that govern use of the ShimoDocs website and software licence, including responsibilities, payment, intellectual property and limitation of liability.',
    keywords: 'ShimoDocs terms and conditions, software licence terms, acceptable use, enterprise agreement, limitation of liability',
    ogAlt: 'The ShimoDocs terms and conditions',
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
      'Email support.global@shimo.im to request the free perpetual license. No credit card is required. Larger teams can ask for a quote based on team size, and the license is activated from the operations platform after the suite is deployed.',
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
    '/docs': 'Documentation',
    '/on-premises': 'On-Premises Deployment',
    '/airgap': 'Air-Gapped Deployment',
    '/pricing': 'Pricing',
    '/contact-sales': 'Contact Sales',
    '/about': 'About',
    '/comparison': 'Comparison',
    '/download': 'Download',
    '/resources': 'Resources',
    '/legal-page/privacy-policy': 'Privacy Policy',
    '/legal-page/terms-conditions': 'Terms & Conditions',
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

  // A route can declare its own questions in ROUTE_SEO. Emitting them here is
  // what turns a written FAQ section into the rich result and into an answer an
  // assistant can quote.
  if (!isHome && meta.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${meta.canonical}#faq`,
      isPartOf: { '@id': pageId },
      mainEntity: meta.faqs.map(faq => ({
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
    // Only the documentation routes are translated, so only they receive
    // hreflang links; the rest of the site is English and has nothing to pair.
    ...alternateTags(options.alternates, ''),
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

export function sitemapUrlsetXml(entries, lastmod = new Date().toISOString().slice(0, 10)) {
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

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...rows,
    '</urlset>',
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
  return sitemapUrlsetXml(entries, lastmod)
}

export function escapeHtml(value) {
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
  // The card the article publishes, or the shared site card when it has none.
  const card = post.image ? absoluteUrl(post.image) : OG_IMAGE_URL
  const cardWidth = post.image ? ARTICLE_CARD_WIDTH : OG_IMAGE_WIDTH
  const cardHeight = post.image ? ARTICLE_CARD_HEIGHT : OG_IMAGE_HEIGHT
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
    `<meta property="og:image" content="${esc(card)}"/>`,
    `<meta property="og:image:width" content="${cardWidth}"/>`,
    `<meta property="og:image:height" content="${cardHeight}"/>`,
    `<meta property="og:image:alt" content="${esc(post.title)}"/>`,
    `<meta property="article:published_time" content="${esc(post.date)}"/>`,
    `<meta property="article:modified_time" content="${esc(post.updated || post.date)}"/>`,
    `<meta property="article:section" content="${esc(post.categoryLabel)}"/>`,
    ...post.tags.map(tag => `<meta property="article:tag" content="${esc(tag)}"/>`),
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${esc(post.seoTitle)}"/>`,
    `<meta name="twitter:description" content="${esc(post.description)}"/>`,
    `<meta name="twitter:image" content="${esc(card)}"/>`,
    `<script type="application/ld+json" id="structured-data">${serialiseJsonLd(blogPostJsonLd(post))}</script>`,
  ]
  return (options.indent || '    ') + tags.join('\n' + (options.indent || '    ')) + '\n  '
}

export function blogPostJsonLd(post) {
  const canonical = absoluteUrl(blogPostPath(post.slug))
  const pageId = `${canonical}#webpage`
  const articleId = `${canonical}#article`
  const breadcrumbId = `${canonical}#breadcrumb`

  const graph = [
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
      image: [post.image ? absoluteUrl(post.image) : OG_IMAGE_URL],
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
  ]

  // An article that answers questions in its body should say so in its
  // structured data. The visible FAQ section and this node come from the same
  // frontmatter, and the build refuses to ship a page where they disagree.
  if (post.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      isPartOf: { '@id': pageId },
      mainEntity: post.faq.map(entry => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: { '@type': 'Answer', text: entry.answer },
      })),
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
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

// ----------------------------------------------------------- documentation

// Structured data for a single guide. TechArticle is the type Google documents
// for technical documentation, and it is what lets a guide appear in the
// technical-article rich result rather than as an anonymous page.
export function docJsonLd(doc, trail = []) {
  const canonical = absoluteUrl(doc.url)
  const pageId = `${canonical}#webpage`
  const articleId = `${canonical}#article`
  const breadcrumbId = `${canonical}#breadcrumb`
  const language = doc.language || DOCS_DEFAULT_LANGUAGE
  const ui = docsUi(language)

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
        inLanguage: language,
        publisher: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'WebPage',
        '@id': pageId,
        url: canonical,
        name: doc.seoTitle,
        description: doc.description,
        isPartOf: { '@id': WEBSITE_ID },
        breadcrumb: { '@id': breadcrumbId },
        inLanguage: language,
      },
      {
        '@type': 'TechArticle',
        '@id': articleId,
        headline: doc.title,
        description: doc.description,
        url: canonical,
        mainEntityOfPage: { '@id': pageId },
        author: { '@type': 'Organization', name: SITE_NAME, url: canonicalFor('/') },
        publisher: { '@id': ORGANIZATION_ID },
        image: [OG_IMAGE_URL],
        wordCount: doc.words,
        inLanguage: language,
        isPartOf: { '@id': WEBSITE_ID },
        proficiencyLevel: 'Expert',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: ui.home, item: canonicalFor('/') },
          { '@type': 'ListItem', position: 2, name: ui.docs, item: canonicalFor(docsBase(language)) },
          ...trail.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 3,
            name: item.name,
            item: item.url,
          })),
          { '@type': 'ListItem', position: trail.length + 3, name: doc.title, item: canonical },
        ],
      },
    ],
  }
}

// hreflang pairs. Google wants every page of a translation set to name every
// other page including itself, and to name exactly the pages that exist: a
// pointer at a translation that was never published is reported as an error, so
// the caller only passes the languages that really carry the page.
//
// x-default points at English, which is the version shown to a reader whose
// language is not in the set.
function alternateTags(alternates, indent) {
  if (!alternates?.length) return []
  return alternates.map(
    alternate =>
      `${indent}<link rel="alternate" hreflang="${escapeHtml(alternate.hreflang)}" href="${escapeHtml(
        alternate.href,
      )}"/>`,
  )
}

export function docHead(doc, trail = [], options = {}) {
  const canonical = absoluteUrl(doc.url)
  const language = doc.language || DOCS_DEFAULT_LANGUAGE
  const locale = (LANGUAGE_META[language] || LANGUAGE_META[DOCS_DEFAULT_LANGUAGE]).ogLocale
  const esc = escapeHtml
  const tags = [
    `<title>${esc(doc.seoTitle)}</title>`,
    `<meta name="description" content="${esc(doc.description)}"/>`,
    `<meta name="robots" content="${ROBOTS_CONTENT}"/>`,
    `<link rel="canonical" href="${esc(canonical)}"/>`,
    ...alternateTags(options.alternates, ''),
    `<meta property="og:type" content="article"/>`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}"/>`,
    `<meta property="og:locale" content="${locale}"/>`,
    ...(options.alternates || [])
      .filter(alternate => alternate.hreflang !== language && alternate.hreflang !== 'x-default')
      .map(
        alternate =>
          `<meta property="og:locale:alternate" content="${
            (LANGUAGE_META[alternate.hreflang] || {}).ogLocale || alternate.hreflang
          }"/>`,
      ),
    `<meta property="og:title" content="${esc(doc.seoTitle)}"/>`,
    `<meta property="og:description" content="${esc(doc.description)}"/>`,
    `<meta property="og:url" content="${esc(canonical)}"/>`,
    `<meta property="og:image" content="${esc(OG_IMAGE_URL)}"/>`,
    `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}"/>`,
    `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}"/>`,
    `<meta property="og:image:alt" content="${esc(doc.title)}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${esc(doc.seoTitle)}"/>`,
    `<meta name="twitter:description" content="${esc(doc.description)}"/>`,
    `<meta name="twitter:image" content="${esc(OG_IMAGE_URL)}"/>`,
    `<script type="application/ld+json" id="structured-data">${serialiseJsonLd(docJsonLd(doc, trail))}</script>`,
  ]
  return (options.indent || '    ') + tags.join('\n' + (options.indent || '    ')) + '\n  '
}

// Structured data for the landing page of one language's guide tree.
export function docsIndexJsonLd(index, entries = []) {
  const canonical = absoluteUrl(index.url)
  const breadcrumbId = `${canonical}#breadcrumb`
  const ui = docsUi(index.language)

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
        inLanguage: index.language,
        publisher: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: index.seoTitle,
        description: index.description,
        isPartOf: { '@id': WEBSITE_ID },
        inLanguage: index.language,
        breadcrumb: { '@id': breadcrumbId },
        hasPart: entries.map(entry => ({
          '@type': 'TechArticle',
          headline: entry.title,
          url: absoluteUrl(entry.url),
          description: entry.description,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: ui.home, item: canonicalFor('/') },
          { '@type': 'ListItem', position: 2, name: ui.docs, item: canonical },
        ],
      },
    ],
  }
}

export function docsIndexHead(index, entries = [], options = {}) {
  const canonical = absoluteUrl(index.url)
  const locale = (LANGUAGE_META[index.language] || LANGUAGE_META[DOCS_DEFAULT_LANGUAGE]).ogLocale
  const esc = escapeHtml
  const tags = [
    `<title>${esc(index.seoTitle)}</title>`,
    `<meta name="description" content="${esc(index.description)}"/>`,
    `<meta name="robots" content="${ROBOTS_CONTENT}"/>`,
    `<link rel="canonical" href="${esc(canonical)}"/>`,
    ...alternateTags(options.alternates, ''),
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}"/>`,
    `<meta property="og:locale" content="${locale}"/>`,
    `<meta property="og:title" content="${esc(index.seoTitle)}"/>`,
    `<meta property="og:description" content="${esc(index.description)}"/>`,
    `<meta property="og:url" content="${esc(canonical)}"/>`,
    `<meta property="og:image" content="${esc(OG_IMAGE_URL)}"/>`,
    `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}"/>`,
    `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}"/>`,
    `<meta property="og:image:alt" content="${esc(index.title)}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${esc(index.seoTitle)}"/>`,
    `<meta name="twitter:description" content="${esc(index.description)}"/>`,
    `<meta name="twitter:image" content="${esc(OG_IMAGE_URL)}"/>`,
    `<script type="application/ld+json" id="structured-data">${serialiseJsonLd(
      docsIndexJsonLd(index, entries),
    )}</script>`,
  ]
  return (options.indent || '    ') + tags.join('\n' + (options.indent || '    ')) + '\n  '
}

// The index points at one urlset per content type and language. Kept separate
// so Search Console reports index coverage per language instead of as one
// 450-URL lump where a single broken translation is invisible.
export function sitemapIndexXml(files, lastmod = new Date().toISOString().slice(0, 10)) {
  const rows = files.map(file =>
    ['  <sitemap>', `    <loc>${escapeHtml(file.loc)}</loc>`, `    <lastmod>${lastmod}</lastmod>`, '  </sitemap>'].join(
      '\n',
    ),
  )
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...rows,
    '</sitemapindex>',
    '',
  ].join('\n')
}
