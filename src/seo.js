// Single source of truth for SEO metadata.
//
// This module is intentionally pure: no JSX, no component imports, no DOM.
// It is consumed by the client runtime (head synchronisation), by the
// build-time prerenderer, and by the sitemap/robots generators. Keeping one
// table means a route can never drift between the router and the crawler.
import { DOWNLOADS } from './downloads'
import {
  ANNUAL_DISCOUNT_PERCENT,
  FREE_TEAM_LIMIT,
  FREE_TEAM_LIMIT_WORD,
  TEAM_PRICE_CURRENCY,
  TEAM_PRICE_PER_USER,
} from './pricing-facts.js'
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
export const SOFTWARE_ID = `${SITE_URL}/#software`

const DEFAULT_KEYWORDS =
  'ShimoDocs, private cloud document collaboration, self-hosted office suite, secure document collaboration, AI agents, data sovereignty, enterprise document management'

// The cost question is asked on the home page and again on the pricing page. One
// question published with two answers is the site contradicting itself as soon
// as either copy is edited, and scripts/check-faq.mjs fails the build over it,
// so both pages read this one string. The pricing page carries the full answer
// because the deployment and licensing detail belongs next to the plans.
const COST_ANSWER =
  `ShimoDocs is free for teams of up to ${FREE_TEAM_LIMIT_WORD} people, with no time limit. ` +
  `Teams larger than ${FREE_TEAM_LIMIT_WORD} pay $${TEAM_PRICE_PER_USER} per user per month for advanced ` +
  `permissions, single sign-on, audit logs and AI assistance, and annual billing reduces that by ` +
  `${ANNUAL_DISCOUNT_PERCENT}%. The servers the suite runs on are separate from the licence.`

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
    // The page demonstrates the agent visually; these answer the four things a
    // buyer asks about it, using only what the product documentation and the
    // pricing page already state.
    faqs: [
      {
        question: 'What do the AI agents actually do?',
        answer:
          'Agents work inside the document people are already editing rather than in a separate chat window. Each action appears with the agent identity, a live cursor and an entry in the edit history, so a reviewer can see exactly what changed and take over at any point.',
      },
      {
        question: 'Can we use our own AI model?',
        answer:
          'Yes. The AI configuration layer points at a model endpoint you choose. Point it at a model running inside your own infrastructure and prompts and document context stay there; point it at a provider you have approved and that data flow becomes a decision you made and can document.',
      },
      {
        question: 'Is document content sent to an AI provider?',
        answer:
          'Only to the endpoints you configure. The AI capabilities — a base model, an image model, embeddings and an optional online search service — are connected in the operations platform. Online search is a separate, optional service: leave it unconfigured and no outbound retrieval happens at all.',
      },
      {
        // This was "Does AI work in an air-gapped deployment?", which is the
        // question /airgap exists to answer. The build reported the two pages as
        // a near-duplicate pair, and a reader who lands on both should not read
        // the same answer twice: the air-gap answer stays on /airgap, and this
        // covers a capability neither page mentioned.
        question: 'Can the agents use our own knowledge base?',
        answer:
          'Yes. Knowledge retrieval is one of the AI capabilities connected in the operations platform, alongside the base model, the image model and the optional online search service. It runs through an embeddings service you provide, so the index the agents retrieve from can live inside your own environment rather than being built by a vendor.',
      },
      {
        question: 'Does the free plan include AI?',
        answer:
          `The free plan for teams of up to ${FREE_TEAM_LIMIT_WORD} people includes an AI workspace preview. AI assistance across the workspace is part of the paid Team plan, alongside advanced permissions, single sign-on and audit logs.`,
      },
    ],
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
  // Topic pages. Each one is a real subject with its own search demand —
  // "self-hosted document collaboration", "document collaboration comparison" —
  // so it is a page, not a filter on the archive: the archive is one URL that
  // answers none of those queries on its own.
  '/blog/category/comparisons': {
    changeFrequency: 'weekly',
    priority: '0.7',
    title: 'Document Collaboration Comparisons | ShimoDocs',
    description:
      'Head-to-head comparisons of ShimoDocs with Google Docs, Notion, Confluence, Microsoft 365, SharePoint, Coda and Slab — and what each costs in control.',
    keywords:
      'document collaboration comparison, google docs alternative, notion alternative, confluence alternative, self-hosted vs cloud',
    ogAlt: 'Comparison of ShimoDocs with public cloud collaboration tools',
  },
  '/blog/category/self-hosting': {
    changeFrequency: 'weekly',
    priority: '0.8',
    title: 'Self-Hosted Document Collaboration | ShimoDocs',
    description:
      'Guides to running document collaboration on your own infrastructure: sizing, Kubernetes deployment, databases, monitoring, backup and disaster recovery.',
    keywords:
      'self-hosted document collaboration, self-hosted office suite, kubernetes document platform, private cloud deployment, on-premises collaboration',
    ogAlt: 'Self-hosted ShimoDocs deployment on infrastructure the reader controls',
  },
  '/blog/category/security': {
    changeFrequency: 'weekly',
    priority: '0.8',
    title: 'Document Security and Compliance | ShimoDocs Blog',
    description:
      'Data sovereignty, access control, retention, encryption and the compliance questions teams ask before moving documents out of a public cloud.',
    keywords:
      'document security, document compliance, gdpr document collaboration, hipaa document management, iso 27001, soc 2, data sovereignty',
    ogAlt: 'Document security and compliance controls in a private deployment',
  },
  '/blog/category/ai': {
    changeFrequency: 'monthly',
    priority: '0.7',
    title: 'AI in Document Collaboration | ShimoDocs Blog',
    description:
      'Putting AI agents inside documents without handing the content to someone else: private model endpoints, training controls and reviewable edits.',
    keywords: 'AI in documents, private AI, self-hosted AI agents, AI data control, bring your own model',
    ogAlt: 'AI agents working inside documents on a private model endpoint',
  },
  '/blog/category/industry': {
    changeFrequency: 'monthly',
    priority: '0.6',
    title: 'Document Collaboration by Industry | ShimoDocs',
    description:
      'How regulated and distributed teams run document collaboration: financial services, healthcare, legal, public sector and the controls each one needs.',
    keywords:
      'document collaboration by industry, financial services documents, healthcare document collaboration, regulated industries',
    ogAlt: 'Document collaboration controls mapped to regulated industries',
  },
  '/blog/category/guides': {
    changeFrequency: 'monthly',
    priority: '0.6',
    title: 'Document Collaboration Guides | ShimoDocs Blog',
    description:
      'Practical workflows for teams moving off public cloud tools: migration, onboarding, meeting notes, knowledge management and policy documentation.',
    keywords:
      'document collaboration guide, google workspace migration, knowledge management, meeting notes workflow, policy documentation',
    ogAlt: 'Practical document collaboration workflows and migration guides',
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
  '/security': {
    changeFrequency: 'monthly',
    priority: '0.8',
    title: 'Security and Data Control | ShimoDocs Self-Hosted',
    description:
      'Where your documents live, who can reach them, what leaves your network and which controls the operator owns in a self-hosted ShimoDocs deployment.',
    keywords:
      'self-hosted document security, private cloud document security, audit log, air-gapped deployment, data control, deployment security review',
    ogAlt: 'Security and data control in a self-hosted ShimoDocs deployment',
    // The visible answers are rendered from this same array, so the text a
    // reader sees and the text in the FAQPage markup cannot drift apart.
    faqs: [
      {
        question: 'Can an administrator edit or delete the audit log?',
        answer:
          'No. The operation log is read-only in the product: records cannot be created, modified or deleted from it, and each entry carries the event source, operation type, operating user, the object acted on and the timestamp. That is what makes it usable as evidence rather than as a convenience feature.',
      },
      {
        question: 'Does ShimoDocs send document content to an AI provider?',
        answer:
          'Only to endpoints you configure. The AI capabilities — a base model, an image model, embeddings and an optional online search service — are connected in the operations platform, so a deployment can point them at a model inside its own network and keep content there. Online search is a separate, optional service: leave it unconfigured and no outbound retrieval happens.',
      },
      {
        question: 'Where is ShimoDocs data stored?',
        answer:
          'In your own infrastructure: the suite runs in your Kubernetes cluster and writes to your database and your S3-compatible object storage. There is no ShimoDocs tenancy holding documents, metadata, permissions or audit records.',
      },
      {
        question: 'Do you publish certification status on this page?',
        answer:
          'No, deliberately. Certification is a fact about a company and a defined scope, not something a product page should improvise. Ask the team for the current status and the evidence pack your review requires; what is documented here is the control itself, and where you can check it.',
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
  '/solutions/atlassian-alternative': {
    changeFrequency: 'monthly',
    priority: '0.9',
    title: 'Atlassian Alternative, Self-Hosted | ShimoDocs',
    description:
      'What changed in Atlassian data contribution and the Data Center end-of-life schedule, and what a self-hosted alternative has to cover to replace it.',
    keywords:
      'atlassian alternative, self-hosted atlassian alternative, confluence and jira alternative, atlassian data contribution, atlassian ai training opt out, data center end of life, on-premises atlassian replacement',
    ogAlt: 'An Atlassian alternative deployed inside your own network',
    faqs: [
      {
        question: 'Does Atlassian train on Confluence and Jira data by default?',
        answer:
          'Atlassian began using customer data according to its data contribution settings on 17 August 2026. In-app data such as Confluence page titles and body text is collected by default on Free and Standard plans, and an organisation administrator can turn it off. Metadata — derived signals such as readability scores, story points and sprint dates — is collected on every plan and cannot be disabled below the Enterprise tier.',
      },
      {
        question: 'Can I opt out of Atlassian metadata collection?',
        answer:
          'Only on Enterprise. Atlassian documentation states that metadata contribution cannot be changed on Free, Standard or Premium. On those plans the setting is not a switch an administrator can reach. Atlassian also documents carve-outs for customer-managed encryption keys, Government Cloud, Isolated Cloud and customers with HIPAA requirements.',
      },
      {
        question: 'When does Atlassian Data Center reach end of life?',
        answer:
          'Atlassian published a hard end of life of 28 March 2029, after which the Data Center products are read-only and receive no further security fixes. New customers could not buy new Data Center subscriptions or Marketplace apps from 30 March 2026, and existing customers lose the ability to buy new subscriptions, apps or user expansions from 30 March 2028. Bitbucket Data Center and Jira Align Data Center are exempt.',
      },
      {
        question: 'What should replace Confluence in a self-hosted estate?',
        answer:
          'It depends which half of Confluence you rely on. If you need page trees, space permissions, page history and search, a self-hosted document platform covers it. If you run sprints, boards, epics and a release train, that is an issue tracker and no document platform replaces it — keep Jira and move the documentation.',
      },
      {
        question: 'How long does migrating off Confluence take?',
        answer:
          'The content export is the fast part. The schedule is decided by permissions translation, attachment link repair and whether page history and comments survive. Draft the permission mapping table before any content moves, and test the import on your messiest space rather than your cleanest one.',
      },
    ],
  },
  '/solutions/confluence-alternative': {
    changeFrequency: 'monthly',
    priority: '0.9',
    title: 'A Confluence Alternative You Can Self-Host | ShimoDocs',
    description:
      'Compare cloud, Data Center and self-hosted Confluence alternatives on where the content lives, plus the migration steps that decide the schedule.',
    keywords:
      'confluence alternative, self-hosted confluence alternative, on-premises confluence replacement, confluence data center end of life, confluence migration, confluence alternative open source, private cloud wiki',
    ogAlt: 'A self-hosted Confluence alternative running in your own cluster',
    faqs: [
      {
        question: 'Is there a self-hosted alternative to Confluence?',
        answer:
          'Yes, in three shapes: a self-hosted wiki such as Docmost or Outline, an on-premises office suite, or Confluence Data Center itself until it reaches end of life. A wiki is the closest match if you only need documentation. An office suite covers documentation plus the spreadsheets, forms and tables that teams otherwise keep open beside a wiki.',
      },
      {
        question: 'What happens to Confluence Data Center after March 2029?',
        answer:
          'The products go read-only and stop receiving security fixes on 28 March 2029. New customers could not buy new Data Center subscriptions from 30 March 2026, and existing customers lose the ability to buy new subscriptions, apps or user expansions from 30 March 2028, which closes the window to grow a deployment before the deadline.',
      },
      {
        question: 'What is lost when you migrate off Confluence?',
        answer:
          'Macros and Marketplace apps are the most common casualty, and they are worth auditing before you scope the move. Page content exports to HTML faithfully. The things that usually break quietly are attachments — which survive while the internal links pointing at them do not — and the comment threads, which carry the reasoning behind a page rather than the page itself.',
      },
      {
        question: 'How do Confluence permissions map onto a self-hosted platform?',
        answer:
          'Not one-to-one. Confluence permissions are per-space with page-level overrides that accumulate over years, while most self-hosted platforms use workspace-level roles for groups. It is a translation exercise with a mapping table rather than a copy operation, and it is the deliverable the rest of the migration waits on.',
      },
      {
        question: 'Can a self-hosted wiki handle spreadsheets and forms too?',
        answer:
          'A wiki cannot. ShimoDocs covers documents, sheets, slides, forms and tables in one deployment, so the budget model, the release checklist and the intake form stop living in three different tools. That is the practical difference between replacing Confluence and replacing the set of things teams used alongside it.',
      },
    ],
  },
  // The migration hub answers the question that follows the hosting decision:
  // the buyer has already chosen to move, and now has to scope the move. It is
  // deliberately about the work rather than the product, because the work is
  // what the person reading it has to schedule.
  '/migration': {
    changeFrequency: 'monthly',
    priority: '0.9',
    title: 'Document Migration to a Self-Hosted Platform | ShimoDocs',
    description:
      'Plan a document platform migration: what imports, what has to be rebuilt, how identity and permissions map, and how to verify the move before cutover.',
    keywords:
      'document migration, document platform migration, migrate to self-hosted document collaboration, confluence migration, google workspace migration, sharepoint migration, private cloud document migration, migration plan',
    ogAlt: 'Migrating documents into a self-hosted platform you control',
    faqs: [
      {
        question: 'Can ShimoDocs import Word, Excel and PowerPoint files?',
        answer:
          'Yes. Import support is documented as a set of per-format feature switches: doc, docx, wps and wpt become documents; xls, xlsx, xlsm and csv become spreadsheets; ppt and pptx become presentations; md and txt become documents; csv, xls and xlsx can become application tables; xmind becomes a mind map. Attachments including svg and xml are handled as attachments rather than as content.',
      },
      {
        question: 'Is there a Confluence or Google Workspace migration connector?',
        answer:
          'No, and it is worth being direct about it. The product documentation describes no connector that reads a Confluence space, a Google Workspace drive or a SharePoint site and recreates it inside the suite. Content moves by exporting from the source system in the supported formats and importing it, and the structure, permissions and conversation around it are rebuilt deliberately rather than transferred.',
      },
      {
        question: 'Do permissions, comments and version history survive the migration?',
        answer:
          'They are not transferred as data. Space and folder hierarchy, page-level overrides, comment threads, inline suggestions and version history all have to be reconstructed or accepted as a loss. Content is the part with a mechanical answer; the other three are the part that decides the schedule, and they should be scoped and written down before anything moves.',
      },
      {
        question: 'Can users be imported in bulk?',
        answer:
          'Yes. The system configuration reference exposes an import limit of up to 500 user rows per batch, which is the setting to check before planning a large onboarding window. Connect the identity provider first and let group membership drive roles, rather than onboarding into a local user list and retrofitting permissions afterwards.',
      },
      {
        question: 'How do you verify a migration before retiring the old system?',
        answer:
          'From the server side. File information search confirms a file application, type, status and size by its internal GUID or client file identifier and is read-only. Transcoding event search resolves an import or export task ID to its full event list so a failure can be located. Document repair has two recovery paths for a file that will not open. Object storage compatibility testing checks configuration, connectivity, upload compatibility and throughput before documents depend on the bucket.',
      },
      {
        question: 'Can the data be exported if the organisation leaves later?',
        answer:
          'Documents export to docx, markdown, PDF and images. Spreadsheets export to xlsx, with a full export archive and single-form data as CSV. Tables export to xlsx, and presentations to pptx and PDF. Backups cover the database, object storage and installation configuration, with a documented restore and post-recovery verification procedure. The export path is the evidence that control over the data is real rather than nominal.',
      },
    ],
  },
  '/pricing': {
    changeFrequency: 'monthly',
    priority: '0.8',
    title: `ShimoDocs Pricing | Free Up to ${FREE_TEAM_LIMIT} Users in Your Private Cloud`,
    description:
      `ShimoDocs is free for teams of up to ${FREE_TEAM_LIMIT_WORD} people. Larger teams pay ` +
      `$${TEAM_PRICE_PER_USER} per user per month for advanced permissions, SSO, audit logs and AI assistance.`,
    keywords:
      'ShimoDocs pricing, private cloud document collaboration pricing, self-hosted office suite cost, free document collaboration, enterprise document platform pricing',
    ogAlt: 'ShimoDocs pricing plans for free and team deployments',
    // The pricing page is the thinnest commercial page on the site, and the two
    // questions it exists to answer — what it costs, and how many people are
    // free — were only implied by the plan cards. These answers restate what the
    // cards and the licence model already say and add nothing that is not
    // already published elsewhere on the site.
    faqs: [
      {
        question: 'How much does ShimoDocs cost?',
        answer: COST_ANSWER,
      },
      {
        question: 'Is there a free plan?',
        answer:
          `Yes. Teams of ${FREE_TEAM_LIMIT_WORD} or fewer people get the complete workspace at no cost: documents, writers, spreadsheets, presentations, tables, shared workspaces, comments and version history. The licence is perpetual, so it does not expire.`,
      },
      {
        question: 'What does the paid Team plan add?',
        answer:
          'Unlimited team members, advanced permissions and administrative controls, single sign-on, audit logs, and AI assistance across the workspace. Everything in the free plan is included in it.',
      },
      {
        question: 'Does the price include the servers?',
        answer:
          'No. ShimoDocs is deployed into infrastructure you control — a single-node or high-availability Kubernetes cluster — so the servers, storage and network are yours and sit outside the per-user price. Where private cloud infrastructure is provided for you, it is quoted separately.',
      },
      {
        question: 'How is the licence delivered?',
        answer:
          'As a licence file that is activated from the operations platform. Because it is a file rather than a call-out to a licensing service at runtime, the suite can be licensed on a network with no route to the internet, including an air-gapped one.',
      },
      {
        question: 'Is there a discount for paying annually?',
        answer: `Yes. Annual billing reduces the per-user price by ${ANNUAL_DISCOUNT_PERCENT}% compared with monthly billing.`,
      },
    ],
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
      `Download the self-hosted ShimoDocs installer for Linux amd64 and arm64, request the free ` +
      `perpetual licence for up to ${FREE_TEAM_LIMIT_WORD} users, and read the release channel.`,
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

// When each static page's copy last changed, for the sitemap's <lastmod>.
//
// Articles carry their own dates in front matter and the guides are dated from
// the Markdown on disk, but a React page has no date inside it, so it is
// declared here beside the metadata it belongs to. Stamping every page with the
// build date instead — which is what this table replaced — teaches Google that
// the field means nothing on this domain, and then a page that really did change
// is crawled on the old schedule. Bump the entry in the same commit that changes
// what the page says; the prerenderer fails the build for a route with no entry
// or an unusable one.
export const ROUTE_UPDATED = {
  '/': '2026-09-15',
  '/ai-workspace': '2026-09-10',
  '/blog': '2026-09-15',
  '/blog/category/comparisons': '2026-09-15',
  '/blog/category/self-hosting': '2026-09-15',
  '/blog/category/security': '2026-09-15',
  '/blog/category/ai': '2026-09-15',
  '/blog/category/industry': '2026-09-15',
  '/blog/category/guides': '2026-09-15',
  '/help-center': '2026-09-15',
  '/docs': '2026-09-15',
  '/on-premises': '2026-09-15',
  '/airgap': '2026-09-15',
  '/security': '2026-09-15',
  '/solutions/atlassian-alternative': '2026-09-15',
  '/solutions/confluence-alternative': '2026-09-15',
  '/migration': '2026-09-15',
  '/pricing': '2026-09-15',
  '/contact-sales': '2026-09-11',
  '/about': '2026-09-14',
  '/comparison': '2026-09-15',
  '/download': '2026-09-15',
  '/resources': '2026-09-14',
  '/legal-page/privacy-policy': '2026-09-14',
  '/legal-page/terms-conditions': '2026-09-14',
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
    answer: COST_ANSWER,
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
    '/solutions/atlassian-alternative': 'Atlassian Alternative',
    '/solutions/confluence-alternative': 'Confluence Alternative',
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
// The product node, with both plans.
//
// One function, emitted under one @id on the home page and on the pricing page:
// two copies of the product would be two entities to keep in step, and the whole
// point of src/pricing-facts.js is that the price has one home.
function softwareApplication() {
  return {
    '@type': 'SoftwareApplication',
    '@id': SOFTWARE_ID,
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
        priceCurrency: TEAM_PRICE_CURRENCY,
        description: `Free for teams of up to ${FREE_TEAM_LIMIT_WORD} people.`,
        url: canonicalFor('/pricing'),
      },
      {
        '@type': 'Offer',
        name: 'Team',
        price: String(TEAM_PRICE_PER_USER),
        priceCurrency: TEAM_PRICE_CURRENCY,
        description: `Per user per month for teams above ${FREE_TEAM_LIMIT_WORD} people.`,
        url: canonicalFor('/pricing'),
      },
    ],
  }
}

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
    graph.push(softwareApplication())
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

  // The pricing page describes the same product entity as the home page, under
  // the same @id, and carries the plans itself. It is the page a buyer reaches
  // from "how much does this cost", so leaving the offers only on the home page
  // meant the pricing page answered that query in prose and told a crawler
  // nothing about the price. `mainEntity` ties the page to the product it is
  // about.
  if (clean === '/pricing') {
    graph.push(softwareApplication())
    graph[2].mainEntity = { '@id': SOFTWARE_ID }
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
    // Only the archive advertises the feed; every article carries it too, a few
    // lines up, so a reader can subscribe from wherever they landed.
    ...(pathname === '/blog' ? [feedLinkTag('')] : []),
    `<script type="application/ld+json" id="structured-data">${serialiseJsonLd(jsonLdFor(meta.path))}</script>`,
  ]
  return (options.indent || '    ') + tags.join('\n' + (options.indent || '    ')) + '\n  '
}

// Crawler policy.
//
// This site is early: it needs to be *found*, and in 2026 a large share of
// "which tool should we use" answers are produced by assistants rather than by
// a list of blue links. A crawler that is refused cannot cite us, so every
// crawler that might quote the documentation is named and allowed explicitly.
//
// The distinction that matters is retrieval versus training, and it is expressed
// with Content Signals rather than by blocking anyone: `ai-input=yes` permits
// grounding an answer in this content, `ai-train=no` declines to contribute it
// as training data. Blocking a crawler outright would give up the citation to
// avoid the training, which is the wrong trade for a site with no brand
// recognition yet.
//
// The allowances are written out per crawler rather than left to `User-agent: *`
// because Cloudflare prepends a managed block to this file, and a managed
// default has silently disallowed every one of these before. Naming them here
// means the policy survives whatever the CDN decides the default should be.
export const AI_AND_SEARCH_CRAWLERS = [
  // Search indexes.
  'Googlebot',
  'Bingbot',
  'DuckDuckBot',
  'Applebot',
  // Assistants and answer engines that cite their sources.
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'Claude-User',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'Amazonbot',
]

export function robotsTxt() {
  const groups = AI_AND_SEARCH_CRAWLERS.flatMap(agent => [`User-agent: ${agent}`, 'Allow: /', ''])
  return [
    '# ShimoDocs — https://github.com/shimodocs/website',
    '#',
    '# Retrieval is welcome; training is not. The Content-Signal below is what',
    '# expresses that, so the named crawlers are allowed through rather than',
    '# blocked: a refused crawler cannot cite the documentation.',
    '',
    ...groups,
    'User-agent: *',
    'Allow: /',
    '',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no, use=reference',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n')
}

export function sitemapUrlsetXml(entries, lastmod = new Date().toISOString().slice(0, 10)) {
  // Image entries are inline extensions rather than a separate sitemap, so a
  // page and its screenshots stay one record. Google reads them for image
  // search, which is where the product shots can compete on their own.
  const usesImages = entries.some(entry => entry.images?.length)
  const rows = entries.map(entry =>
    [
      '  <url>',
      `    <loc>${escapeHtml(entry.loc)}</loc>`,
      `    <lastmod>${entry.lastmod || lastmod}</lastmod>`,
      `    <changefreq>${entry.changefreq || 'monthly'}</changefreq>`,
      `    <priority>${entry.priority || '0.6'}</priority>`,
      ...(entry.images || []).map(
        image =>
          `    <image:image><image:loc>${escapeHtml(image)}</image:loc></image:image>`,
      ),
      '  </url>',
    ].join('\n'),
  )

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${
      usesImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''
    }>`,
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
// Feed autodiscovery. A reader pointed at any article can subscribe without
// hunting for the URL.
function feedLinkTag(indent) {
  return `${indent}<link rel="alternate" type="application/rss+xml" title="${escapeHtml(
    SITE_NAME,
  )} Blog" href="${escapeHtml(absoluteUrl('/blog/feed.xml'))}"/>`
}

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
    feedLinkTag(''),
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

// The blog as a feed, for the readers and the crawlers that prefer one.
//
// Google discovers the archive through the index and the sitemap, but a feed is
// how an aggregator, a newsletter tool or an assistant that polls for new work
// follows a site without being told to come back. It is also the only surface
// here that states what changed recently in a form a machine can diff.
export function blogFeedXml(posts, options = {}) {
  const esc = escapeHtml
  const updated = posts[0]?.updated || posts[0]?.date || new Date().toISOString().slice(0, 10)
  const items = posts.map(post => {
    const url = absoluteUrl(blogPostPath(post.slug))
    return [
      '    <item>',
      `      <title>${esc(post.title)}</title>`,
      `      <link>${esc(url)}</link>`,
      // isPermaLink="true" because the guid is the article URL, not an opaque id.
      `      <guid isPermaLink="true">${esc(url)}</guid>`,
      `      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>`,
      `      <description>${esc(post.description)}</description>`,
      `      <category>${esc(post.categoryLabel)}</category>`,
      ...post.tags.map(tag => `      <category>${esc(tag)}</category>`),
      `      <author>${esc(options.authorEmail || CONTACT_EMAIL)} (${esc(SITE_NAME)})</author>`,
      '    </item>',
    ].join('\n')
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${esc(SITE_NAME)} Blog</title>`,
    `    <link>${esc(canonicalFor('/blog'))}</link>`,
    `    <description>${esc(ROUTE_SEO['/blog'].description)}</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${new Date(`${updated}T00:00:00Z`).toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${esc(absoluteUrl('/blog/feed.xml'))}" rel="self" type="application/rss+xml"/>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
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
//
// Each child carries its own lastmod rather than the build date: the children
// change at different rates, and the blog sitemap's date is the newest article
// in it, not the moment the site was built.
export function sitemapIndexXml(files, lastmod = new Date().toISOString().slice(0, 10)) {
  const rows = files.map(file =>
    [
      '  <sitemap>',
      `    <loc>${escapeHtml(file.loc)}</loc>`,
      `    <lastmod>${file.lastmod || lastmod}</lastmod>`,
      '  </sitemap>',
    ].join('\n'),
  )
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...rows,
    '</sitemapindex>',
    '',
  ].join('\n')
}
