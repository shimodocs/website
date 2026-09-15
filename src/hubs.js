// Commercial hub pages.
//
// The blog answers questions; these pages answer one deployment question each
// and link into the documentation that proves the answer. They are data-driven
// so a new hub is an entry here plus a route, with no new layout to maintain.
//
// Every factual claim on these pages is drawn from the product documentation in
// content/docs, which is synced from the product repository — so the hub and the
// guide it links to cannot describe the product differently.

import { FREE_TEAM_LIMIT_WORD } from './pricing-facts.js'

export const HUBS = {
  '/on-premises': {
    eyebrow: 'On-premises deployment',
    h1: ['On-premises document collaboration,', 'without giving up the editing experience.'],
    lead:
      'Running documents on your own servers used to mean giving up real-time collaboration, comments and version history. ShimoDocs is built the other way round: you get the collaborative editing surface first, and it happens to run inside your network boundary.',
    sections: [
      {
        heading: 'What on-premises actually changes',
        body: [
          'The editor, the file storage, the permissions model, the audit trail and the search index all run on servers your organisation controls. Your people still open a browser and edit the same document together; what changes is where the content lives and who can be compelled to produce it.',
          'It is worth being precise about the distinction, because the terms get used loosely. On-premises describes whose hardware it runs on. A private cloud deployment is usually on-premises or in a dedicated tenant. Data residency is a third thing again: it answers where bytes sit, not who can read them. A hosted suite with a regional storage option is not an on-premises deployment.',
        ],
      },
      {
        heading: 'What has to run on your side',
        body: [
          'A production deployment has four layers, and the middle two are where the project time goes.',
        ],
        list: [
          'The application layer: the suite itself, running on Kubernetes. A single-node deployment is enough to evaluate; production normally wants three or more control-plane nodes.',
          'Relational storage: MySQL 8 is the supported default, and Dameng V8 is supported where that is the required database.',
          'Cache, document store and message queue: Redis, MongoDB and Kafka. All three can be bundled with the installer or pointed at middleware you already run.',
          'Object storage: an S3-compatible endpoint for document files, which can be yours rather than ours.',
        ],
        note:
          'Bringing your own middleware is a first-class path, not a workaround. The installer has an explicit "third-party middleware" route for each of them, and the guides cover the connection settings each one expects.',
      },
      {
        heading: 'The two deployment shapes',
        body: [
          'An integrated single-node environment deploys the whole stack onto one prepared machine. It is the right shape for an evaluation, a pilot, or a small team that values simplicity over redundancy, and it produces the acceptance materials a handover or an audit will ask for.',
          'A high-availability cluster is the production shape: three or more master nodes with worker capacity, so losing a node does not take collaboration down. The recommended starting topology is three masters with additional workers added later as load grows. Both shapes install from the same package; the difference is the topology you prepare, not the software you run.',
        ],
        links: [
          ['/docs/deployment/getting-started/single-node-kubernetes', 'Single-node Kubernetes deployment guide'],
          ['/docs/deployment/getting-started/high-availability-kubernetes', 'High-availability deployment guide'],
          ['/docs/deployment/getting-started/resource-planning', 'Resource planning and sizing'],
        ],
      },
      {
        heading: 'What the servers actually need',
        body: [
          'For a high-availability cluster, plan on at least three servers with 16 cores and 32 GB of memory each. The system disk needs 100 GB or more and the data disk should be separately mounted at 300 GB or more, with all nodes configured consistently. Clocks must be synchronised across nodes, and the installation node needs SSH access to the rest.',
          'Two details catch people out. First, do not partition /root, /var or /tmp separately — the deployment expects them on the system disk. Second, nothing belongs on the system disk; document data, object storage and the database all live under the data mount. Both requirements are in the system requirements guide, and both are cheaper to honour before the hardware is provisioned than after.',
        ],
        links: [['/docs/deployment/system-requirements', 'Full system requirements']],
      },
      {
        heading: 'What on-premises does not solve',
        body: [
          'It does not make the platform free of work. You take on upgrades, backup and restore testing, availability, and capacity planning. That operational burden is the real cost of running anything on-premises and the one nobody measures before committing — which is why our own guidance recommends piloting with instrumented operations time rather than scoring features.',
          'It also does not make you compliant by itself. It gives you the control evidence that a compliance obligation requires: access logs you can produce, deletion you can demonstrate, and a retention model that matches your record-keeping policy. The control framework still has to be built on top.',
        ],
        links: [
          ['/docs/deployment/troubleshooting/data-backup', 'Backup and restore guide'],
          ['/docs/deployment/troubleshooting/incident-response-sop', 'Incident response procedure'],
          ['/blog/self-hosted-collaboration-guide', 'What running self-hosted collaboration actually involves'],
        ],
      },
      {
        heading: 'Where AI fits',
        body: [
          'This is the part on-premises deployments usually lose. A cloud suite gives you AI by sending your document context to the vendor; an on-premises deployment with no AI story gives you control and no assistance.',
          'ShimoDocs separates the two. The AI configuration layer points at a model endpoint you choose, so inference can run inside the same boundary as the documents. Agents work inside the document with a visible identity, a live cursor and a full edit history, so a reviewer can see exactly what changed and take over at any point.',
        ],
        links: [
          ['/docs/deployment/operations-platform/suite/ai-configuration', 'Configuring the AI endpoint'],
          ['/blog/ai-agents-in-documents-security', 'AI agents in documents: the security checklist'],
        ],
      },
    ],
    checklist: {
      heading: 'What to have ready before you start',
      items: [
        'Three or more servers with synchronised clocks and SSH between them',
        'A data disk mounted at /data on every node, 300 GB or more',
        'A decision on bundled versus external MySQL, Redis, MongoDB and Kafka',
        'An S3-compatible object storage endpoint for document files',
        'A domain or address for ACCESS_DOMAIN, and a TLS decision',
        'A model endpoint, if you intend to enable AI',
        'A backup target that is not the same disk as the data',
      ],
    },
  },

  '/airgap': {
    eyebrow: 'Air-gapped deployment',
    h1: ['Document collaboration inside', 'an isolated network.'],
    lead:
      'Real-time editing, comments, version history and search do not need the internet. They need a network. ShimoDocs runs the full collaboration surface inside an air-gapped enclave, installed from offline packages and with nothing calling out.',
    sections: [
      {
        heading: 'Why an air gap changes the design, not the features',
        body: [
          'Most collaboration platforms assume three outbound dependencies: licence validation, update checks, and a hosted AI endpoint. Any one of them turns an isolated network into a broken deployment. Removing them is an installation-time property, not something you configure afterwards.',
          'ShimoDocs installs from offline image packages and the deployment guide documents the isolated path explicitly, alongside the online one. The installer accepts an external middleware address instead of bundling its own, so the suite can be pointed at infrastructure that already exists on the isolated side.',
        ],
        links: [
          ['/docs/deployment/getting-started/quick-start', 'Quick start, including the offline path'],
          ['/docs/deployment/middleware/object-storage/deployment', 'Pointing the suite at your own object storage'],
        ],
      },
      {
        heading: 'What crosses the gap',
        body: [
          'Four things, and all of them are ordinary files. That matters because it means the deployment can be built and refreshed through whatever controlled transfer process your environment already uses, rather than requiring a network connection to be opened.',
        ],
        list: [
          'The installer binary for the architecture you run, amd64 or arm64',
          'The offline image tarball, which carries the container images the deployment needs',
          'The licence file, obtained separately and activated from the operations platform',
          'Any external middleware packages, if you are running MySQL, Redis, MongoDB or Kafka yourself',
        ],
        note:
          `Because a licence is a file rather than a phone-home check, enabling the suite on an isolated network does not require a temporary connection. The free perpetual licence for teams of up to ${FREE_TEAM_LIMIT_WORD} people is issued the same way.`,
      },
      {
        heading: 'AI without outbound access',
        body: [
          'The usual casualty of an air gap is AI assistance, because hosted model APIs are unreachable by definition. The AI configuration layer in ShimoDocs points at an endpoint you specify, which on an isolated network means a model served inside the enclave.',
          'That turns prompt and document context into internal traffic that your existing network controls already cover. If no model is available in the enclave, the collaboration features are unaffected — AI is an addition to the suite, not a dependency of it.',
        ],
        links: [
          ['/docs/deployment/operations-platform/suite/ai-configuration', 'AI configuration reference'],
          ['/blog/ai-training-content-control', 'Controlling what your content is used to train'],
        ],
      },
      {
        heading: 'What you genuinely lose',
        body: [
          'It is more useful to be specific than to claim nothing changes. Three categories of feature depend on reaching the public internet and stop working on an isolated network.',
        ],
        list: [
          'Third-party integrations that call out to an external service on the user behalf',
          'Public link sharing to recipients outside the enclave, for the obvious reason',
          'Any AI model that is only available as a hosted API rather than something you can run',
        ],
        note:
          'Everything in the collaboration core — real-time co-editing, comments and suggestions, version history, document-level permissions, audit logs, forms, spreadsheets, presentations and search — is internal traffic and works normally.',
      },
      {
        heading: 'Keeping an isolated deployment maintainable',
        body: [
          'The failure mode of air-gapped systems is not the initial install; it is that nobody can upgrade or diagnose them two years later. Two things in the operations platform are aimed squarely at that.',
          'Upgrades are applied by uploading an installation package, with the platform running its own compatibility checks before it starts — so the transfer process produces a reviewable event rather than an automatic change. And when something does go wrong, the operations platform carries the diagnostic surface inside the enclave: service and real-time logs, middleware inspection, cluster management, container packet capture and a monitoring metrics reference, with no external observability service required.',
        ],
        links: [
          ['/docs/deployment/operations-platform/system-services/service-operations/system-upgrade', 'System upgrade procedure'],
          ['/docs/deployment/troubleshooting/incident-response-sop', 'Incident response SOP'],
          ['/docs/deployment/troubleshooting/monitoring-metrics', 'Monitoring metrics reference'],
        ],
      },
    ],
    checklist: {
      heading: 'What to plan for before the first transfer',
      items: [
        'The architecture you are deploying on, amd64 or arm64',
        'A controlled transfer process for files, and who signs it off',
        'Whether middleware is bundled in the package or already present in the enclave',
        'A licence file requested in advance, not during the install window',
        'A decision on whether an in-enclave model endpoint will be available for AI',
        'A backup target inside the enclave, tested with a restore',
      ],
    },
  },
  '/security': {
    eyebrow: 'Security and data control',
    h1: ['Security you can', 'describe to an auditor.'],
    // A trust page earns nothing if its claims cannot be checked, so every
    // control below links to the runbook or the admin surface that implements
    // it, and the parts the operator owns say so rather than being implied away.
    lead:
      'Each control on this page links to the documentation or the administration surface that implements it. Where the responsibility is yours rather than ours, it says that too.',
    sections: [
      {
        heading: 'Where the documents live',
        body: [
          'ShimoDocs runs inside your own Kubernetes cluster. Documents, metadata, permissions, version history and audit records are stored in your infrastructure, against your database and your object storage — there is no ShimoDocs tenancy holding a copy.',
          'A single node is enough to evaluate the suite; production normally runs three or more control-plane nodes. Installation can run online, or from an offline image package on a network with no route to the internet.',
        ],
        links: [
          ['/docs/deployment/getting-started/single-node-kubernetes', 'Single-node Kubernetes deployment'],
          ['/docs/deployment/getting-started/high-availability-kubernetes', 'High availability Kubernetes deployment'],
          ['/docs/deployment/system-requirements', 'System and network requirements'],
          ['/airgap', 'Air-gapped and offline deployment'],
        ],
      },
      {
        heading: 'Who can reach it',
        body: [
          'Administration is a separate surface from the workspace. Tenants, users, licences, branding and AI configuration are managed in the operations platform, and those actions are recorded rather than being invisible.',
          'The operation log is read-only by design: records cannot be created, edited or deleted from the product, including by an administrator. Each entry carries the event source, the operation type, the operating user, the object acted on and the timestamp.',
        ],
        links: [
          ['/docs/deployment/operations-platform/system-services/system-management/audit-logs', 'Audit log reference'],
          ['/docs/deployment/operations-platform/suite/user-management', 'Suite user management'],
          ['/docs/deployment/operations-platform/suite/tenant-management', 'Tenant management'],
        ],
      },
      {
        heading: 'What leaves your network',
        body: [
          'AI is the part of a modern suite that usually means sending content to a vendor. Here the capabilities are endpoints you connect: a base model, an image model, embeddings, and optionally an online search service. Point them at a model inside your own boundary and the content stays there; point them at a provider you have approved and the data flow becomes a decision you made and can document.',
          'Online search is a separate service and is not required. Left unconfigured, no outbound retrieval happens at all.',
        ],
        note:
          'One network fact worth designing around rather than discovering: browsers read and write document content directly against the object storage endpoint, so that endpoint has to be reachable from the client network. Plan the path deliberately instead of exposing it by accident.',
        links: [
          ['/docs/deployment/operations-platform/suite/ai-configuration', 'AI configuration'],
          ['/docs/deployment/middleware/object-storage/deployment', 'Object storage deployment'],
          ['/blog/ai-training-content-control', 'Controlling what AI does with your content'],
        ],
      },
      {
        heading: 'Backups, retention and legal hold',
        body: [
          'Backups belong to the operator, and the runbook says which databases, buckets and configuration to capture — and which directories to leave alone. Retention and hold are workspace policy decisions that the deployment can enforce, rather than promises a vendor makes about data it holds.',
        ],
        links: [
          ['/docs/deployment/troubleshooting/data-backup', 'Data backup runbook'],
          ['/blog/document-retention-policy-guide', 'Retention policy guide'],
          ['/blog/legal-hold-document-management', 'Legal hold in a document platform'],
        ],
      },
      {
        heading: 'Who owns which control',
        body: [
          'A private deployment splits responsibility, and a security review will ask which side each control sits on. The product ships the suite, the installer, the operations platform, the audit trail and the AI plumbing. Everything around it belongs to the operator:',
        ],
        list: [
          'Servers, storage and the Kubernetes cluster',
          'Network policy: firewall, ports, load balancer and the object storage path',
          'Middleware, when you bring your own MySQL, Dameng, Redis, MongoDB, Kafka or object storage',
          'Backups, and a restore that has actually been rehearsed',
          'Licence activation, and who holds administrator and operator accounts',
        ],
        links: [
          ['/docs/deployment/middleware/mysql/deployment', 'Bringing your own MySQL 8'],
          ['/docs/deployment/middleware/redis/deployment', 'Bringing your own Redis'],
          ['/docs/deployment/middleware/dameng/requirements', 'Dameng V8 requirements'],
        ],
      },
      {
        heading: 'The compliance questions teams ask',
        body: [
          'These are the long-form answers we publish: what a private deployment changes for each framework, and what an auditor will ask you to evidence. They are written for the person answering the questionnaire, not to claim a badge.',
        ],
        links: [
          ['/blog/gdpr-compliant-document-collaboration', 'GDPR: document collaboration in your own cloud'],
          ['/blog/hipaa-compliant-document-collaboration', 'HIPAA: what a private deployment changes'],
          ['/blog/soc2-document-collaboration-controls', 'SOC 2: the controls a document platform touches'],
          ['/blog/iso27001-document-management', 'ISO 27001: document management controls'],
          ['/blog/data-residency-requirements-guide', 'Data residency requirements'],
        ],
      },
    ],
    checklist: {
      heading: 'What a security review will ask for',
      items: [
        'The deployment shape: single node, high availability, or air-gapped',
        'Which middleware you run yourself, and which the installer provides',
        'The object storage endpoint, and the network path browsers take to it',
        'Whether AI capabilities are enabled, and exactly which endpoints they point at',
        'Backup schedule, retention period, and who holds the restore procedure',
        'Who holds administrator and operator accounts, and how that is reviewed',
      ],
    },
  },

  '/solutions/atlassian-alternative': {
    eyebrow: 'Atlassian alternative',
    h1: ['An Atlassian alternative you can', 'run inside your own network.'],
    lead:
      'Two things changed for Atlassian customers in 2026: data contribution became a default rather than a choice, and the on-premises product line got a hard end-of-life date. This page is what those two changes actually say, in Atlassian own words, and what a replacement has to cover.',
    sections: [
      {
        heading: 'What changed on 17 August 2026',
        body: [
          'Atlassian began using customer data under its data contribution settings on 17 August 2026, according to its own documentation. Two classes of data are collected. Metadata covers derived signals such as readability scores, task classifications, story points, sprint dates, SLA values and Teamwork Graph similarity measures. In-app data covers the content itself: Confluence page titles and body text, and Jira work item titles, descriptions and comments, along with custom status and workflow names.',
          'Retention is documented at up to seven years. If an organisation opts out, in-app data is removed within 30 days and the affected models are retrained within 90 days.',
          'The part that decides the argument is not the collection. It is who is allowed to switch it off, and that differs by plan.',
        ],
        table: {
          head: ['Plan', 'Metadata contribution', 'In-app data contribution'],
          rows: [
            ['Free / Standard', 'Cannot be changed', 'On by default; an org admin can turn it off'],
            ['Premium', 'Cannot be changed', 'On by default; an org admin can turn it off'],
            ['Enterprise', 'Can be turned off', 'Can be turned off'],
          ],
          caption:
            'According to Atlassian data contribution settings. Metadata — the derived signals rather than the text — can only be disabled on Enterprise.',
        },
        note:
          'Atlassian documents carve-outs for customer-managed encryption keys, Atlassian Government Cloud, Isolated Cloud, and customers with HIPAA requirements. If you are on one of those, the default does not apply to you. If you are not, it does.',
        links: [
          ['https://support.atlassian.com/security-and-access-policies/docs/data-contribution-settings/', 'Atlassian: Data contribution settings'],
          ['https://www.atlassian.com/trust/ai/data-contribution', 'Atlassian: Data contribution'],
        ],
      },
      {
        heading: 'The deadline nobody has budgeted for',
        body: [
          'Separately from the AI question, Atlassian has published an end-of-life schedule for its Data Center products. It is the more consequential of the two changes, because it is dated and it is not optional.',
        ],
        list: [
          'From 30 March 2026 — no new Data Center subscriptions or Marketplace apps for new customers',
          'From 30 March 2028 — existing customers can no longer buy subscriptions, apps or user expansions',
          '28 March 2029 — hard end of life: the products go read-only and receive no further security fixes',
        ],
        note:
          'Bitbucket Data Center and Jira Align Data Center are exempt from the schedule. If your estate includes Jira and Confluence Data Center, the clock is running on both.',
        links: [
          ['https://www.atlassian.com/licensing/data-center-end-of-life', 'Atlassian: Data Center end of life'],
        ],
      },
      {
        heading: 'What a replacement has to cover',
        body: [
          'Most teams evaluating this are not replacing Confluence alone. They are replacing a wiki, a work tracker and the integrations between them, and the honest question is which of those you still need.',
          'A project workspace with owners, statuses and dates is something ShimoDocs covers with tables and app sheets rather than a separate issue tracker. That is a different shape from Jira, and it is the right shape for a team that was using Jira as a shared task list rather than as a delivery pipeline. If you are running sprints, boards, epics and a release train, Jira is doing work no document platform replaces, and you should keep it.',
          'Where a document platform is the right answer is the documentation half: a space per team, page trees, permissions inherited from the space, comments and suggestions on a page, a full page history, and search across all of it. That is the surface a wiki earns its place on.',
        ],
        links: [
          ['/blog/shimodocs-vs-confluence', 'ShimoDocs compared with Confluence in detail'],
          ['/docs', 'The deployment documentation'],
        ],
      },
      {
        heading: 'The AI question, answered the other way round',
        body: [
          'The reason the August change is uncomfortable is not that a vendor wants to train a model. It is that the decision was made for you, on a tier you may not be able to change.',
          'A self-hosted deployment inverts that. ShimoDocs runs in your own Kubernetes cluster, and the AI configuration layer points at a model endpoint you choose. On a self-hosted or isolated network that endpoint is a model inside your own boundary, so document context never becomes someone else training data. If you would rather switch AI off entirely, it is an addition to the suite rather than a dependency of it, and collaboration is unaffected.',
          'One more difference is worth naming. An AI agent with delegated access to your wiki is an exfiltration path. In August 2026 two independent research teams disclosed indirect prompt injection paths in Atlassian Rovo, one of which was still unconfirmed as remediated at publication, and disabling the assistant web search did not close it because the tool that follows a dynamically constructed URL stayed available. The controls that do close it are architectural — the model inside your network, no outbound URL tool it can be talked into using, and every AI action written to your own audit log. Those are properties of where you deploy, not settings you toggle.',
        ],
        links: [
          ['/docs/deployment/operations-platform/suite/ai-configuration', 'Configuring the AI endpoint'],
          ['/blog/ai-agents-in-documents-security', 'AI agents in documents: the security checklist'],
          ['https://labs.cloudsecurityalliance.org/research/csa-research-note-atlassian-rovo-prompt-injection-20260811-c/', 'CSA: Indirect prompt injection in Atlassian Rovo'],
        ],
      },
      {
        heading: 'A migration order that survives contact with a calendar',
        body: [
          'Confluence migration is a content problem before it is a technical one. Four things decide the schedule, and doing them in this order is what keeps the project from slipping.',
        ],
        list: [
          'Inventory the spaces by owner, not by size. A space nobody owns is a space nobody will notice losing, and it should not be in scope for the first cutover.',
          'Map permissions before content. Confluence permissions are per-space with page-level overrides that have accumulated for years; the target model is group-based roles, and the mapping table is the deliverable that unblocks everything else.',
          'Move the page tree, then the attachments, then the history. Attachments and page history are the two things that make an import look successful and behave badly, so test them on your ugliest space rather than your cleanest.',
          'Retire the old system explicitly. Adoption completes when people stop looking for the old copy, and leaving it read-only but reachable is what makes a migration take twice as long as it should.',
        ],
        links: [
          ['/blog/how-to-migrate-from-google-workspace', 'A staged migration plan, and the mapping exercise it rests on'],
          ['/docs/deployment/troubleshooting/data-backup', 'Backup and restore, before you need it'],
        ],
      },
    ],
    checklist: {
      heading: 'What to establish before you decide',
      items: [
        'Your current Atlassian plan, because it decides whether you can turn metadata contribution off at all',
        'Whether a carve-out applies — customer-managed keys, Government Cloud, Isolated Cloud, HIPAA',
        'Which Data Center products you run, and their position on the 2026 / 2028 / 2029 schedule',
        'Whether you are replacing a wiki, an issue tracker, or both, and which of those you still use',
        'The number of Confluence spaces with no current owner',
        'Who holds the model endpoint decision, if you intend to enable AI',
        'A restore target for the new platform that is not the same disk as the data',
      ],
    },
  },

  '/solutions/confluence-alternative': {
    eyebrow: 'Confluence alternative',
    h1: ['A Confluence alternative', 'you can self-host.'],
    lead:
      'Confluence is a wiki, and a wiki is a solved problem. The hard part is moving a decade of spaces, permissions and page history somewhere you control. This page is about what a replacement has to do, what it does not have to do, and how the migration actually goes.',
    sections: [
      {
        heading: 'What teams actually use Confluence for',
        body: [
          'Strip out the parts nobody opens and four jobs remain: a home for documentation that is not a file share, page trees that stay navigable past a few hundred pages, comments and suggestions on a page while it is being written, and search that finds the page rather than the folder.',
          'A replacement is credible when it does those four well, and honest when it does not do the rest. The rest — macros, Marketplace apps, deep Jira linkage — is where a migration gets expensive, and it is worth auditing which of it is load-bearing before you scope anything.',
        ],
      },
      {
        heading: 'The options, side by side',
        body: [
          'There are four shapes of answer, and they fail in different ways. The comparison that matters is not a feature count. It is where the content lives, and who can be made to produce it.',
        ],
        table: {
          head: ['Option', 'Where it runs', 'Strongest at', 'The trade-off'],
          rows: [
            ['Confluence Cloud', 'Atlassian cloud', 'Ecosystem, macros, Jira linkage', 'Content sits on Atlassian infrastructure, under their AI settings'],
            ['Confluence Data Center', 'Your servers', 'Familiarity, existing investment', 'Hard end of life 28 March 2029, with no security fixes after'],
            ['Self-hosted wiki (Docmost, Outline)', 'Your servers', 'Documentation, fast to run', 'Weak on structured files; it is a wiki only'],
            ['ShimoDocs', 'Your Kubernetes cluster', 'Docs, sheets, slides, forms, tables and AI inside one boundary', 'You own the operations'],
          ],
          caption:
            'Confluence Data Center dates are Atlassian published schedule: no new subscriptions for new customers from 30 March 2026, no expansions for existing customers from 30 March 2028, end of life 28 March 2029.',
        },
        links: [
          ['https://www.atlassian.com/licensing/data-center-end-of-life', 'Atlassian: Data Center end of life'],
          ['/blog/best-self-hosted-document-collaboration-tools', 'The self-hosted options, reviewed'],
        ],
      },
      {
        heading: 'Where a wiki is not enough',
        body: [
          'Confluence is a document tool. Teams that live in it eventually keep something else open beside it, because a wiki is a poor place for a budget model, a release checklist or an intake form.',
          'ShimoDocs covers that adjacent surface in the same deployment: spreadsheets with a formula language for the model, app sheets and tables for the checklist and its owners, and forms for the intake. The point is not feature count. It is that the document, the data behind it and the AI that reads both sit inside one network boundary rather than three vendor tenancies.',
        ],
        links: [
          ['/on-premises', 'What running the suite on your own servers involves'],
          ['/airgap', 'Running it with no outbound access at all'],
        ],
      },
      {
        heading: 'How the migration actually goes',
        body: [
          'Confluence exports to HTML, and the export is faithful enough that the content moves cleanly. The three things that decide whether the migration sticks are the ones that do not appear in an import log.',
        ],
        list: [
          'Permissions translation. Space permissions plus years of page-level overrides do not map one-to-one onto group-based roles. Build the mapping table first; it is the artefact the whole project waits on.',
          'Attachments. They usually survive, and they usually break the internal links that pointed at them. Test on the messiest space you own.',
          'Page history and comments. Losing the discussion while keeping the text is the most common bad outcome, because the reasoning behind a decision lives in the comments rather than the page body.',
        ],
        note:
          'A read-only Confluence left reachable after cutover is the most reliable way to double the length of a migration. Retire it on a date, and tell people the date.',
        links: [
          ['/blog/shimodocs-vs-confluence', 'A working comparison, including where Confluence wins'],
          ['/blog/how-to-migrate-from-google-workspace', 'The staged migration plan this follows'],
          ['/docs/deployment/getting-started/quick-start', 'Install the suite and try the import yourself'],
        ],
      },
      {
        heading: 'The question the 2026 default raises',
        body: [
          'Atlassian began using customer data under its data contribution settings on 17 August 2026, and metadata contribution cannot be disabled below the Enterprise tier. That does not make Confluence a bad wiki. It does mean that for some organisations the hosting question moved from a preference to a requirement.',
          'If that is where you are, the relevant question is not which self-hosted wiki looks nicest. It is whether the platform can point its AI at a model you chose, inside a boundary you control, and whether every AI action lands in an audit log you can produce. Those are deployment properties, and they are the ones to test in a pilot.',
        ],
        links: [
          ['https://support.atlassian.com/security-and-access-policies/docs/data-contribution-settings/', 'Atlassian: Data contribution settings'],
          ['/blog/ai-training-content-control', 'Controlling what your content is used to train'],
          ['/security', 'Our own security and compliance position'],
        ],
      },
    ],
    checklist: {
      heading: 'What to have ready before you scope the migration',
      items: [
        'A list of spaces with a named owner, and a decision about the ones without',
        'The permission mapping table, drafted before any content moves',
        'Which Marketplace apps are load-bearing, and what replaces each one',
        'Your worst space, chosen deliberately as the import test case',
        'A cutover date after which the old system is no longer reachable',
        'A model endpoint decision, if AI is in scope',
      ],
    },
  },

  // The migration hub. The displacement pages answer "should I move"; this one
  // answers "what does moving involve", which is the question the same buyer
  // asks a week later and the one an administrator has to put a schedule
  // against. Everything factual here is checkable in content/docs — the import
  // and export format lists, the bulk user import limit, and the four operation
  // tools used to verify an import — and the parts a migration cannot carry
  // across are stated as losses rather than smoothed over.
  '/migration': {
    eyebrow: 'Migration',
    h1: ['Document migration into', 'a platform you control.'],
    lead:
      'A migration looks like a file-transfer project and turns out to be an identity and permissions project. This page is the assessment an administrator can work from: what comes across as data, what has to be rebuilt deliberately, and how to prove the move worked before anyone retires the old system.',
    sections: [
      {
        heading: 'Four things move, and only one of them is a file problem',
        body: [
          'The instinct is to treat this as an export-and-import exercise, because that is the part that visibly either works or does not. Content is in fact the least dangerous of the four assets a migration has to carry, and the other three are where schedules slip.',
        ],
        list: [
          'Content — pages, documents, spreadsheets and presentations. This is the mechanical part, and the part with a documented answer.',
          'Structure and permissions — who could see which page, inherited from spaces and folders and years of one-off overrides. No export produces this in the shape a target platform expects.',
          'Identity — who counts as a user and which group they belong to. This decides every permission downstream, which is why it has to land before people are onboarded rather than after.',
          'Conversation — comments, inline suggestions and the reasoning recorded while a document was being written. Losing this while keeping the text is the most common bad outcome, because the decision usually lives in the comments rather than the page body.',
        ],
        note:
          'Plan the four as separate workstreams with separate owners. The migration that treats them as one is the one that runs both systems in parallel for a year.',
      },
      {
        heading: 'What the platform can import',
        body: [
          'Content arrives as files. The suite accepts the formats people actually have, and every import type is a documented feature switch an administrator can inspect rather than a claim on a marketing page.',
        ],
        table: {
          head: ['Source format', 'Lands as', 'Extensions'],
          rows: [
            ['Word documents', 'Document', 'doc, docx, wps, wpt'],
            ['Markdown and plain text', 'Document', 'md, txt'],
            ['Excel workbooks and CSV', 'Spreadsheet', 'xls, xlsx, xlsm, csv'],
            ['PowerPoint decks', 'Presentation', 'ppt, pptx'],
            ['Tabular data', 'Application table', 'csv, xls, xlsx'],
            ['Mind maps', 'Mind map', 'xmind'],
            ['Attachments', 'Stored or converted', 'svg, xml and standard attachment types'],
          ],
          caption:
            'Import support as documented in the editor configuration reference, where each row is a feature switch with its own default and its own toggle.',
        },
        note:
          'Test before you promise anything. Open one real file of each class your organisation owns, including the awkward ones — a workbook with external links, a deck with embedded fonts, a document carrying tracked changes. A format list tells you what will be attempted, not what will survive contact with your worst file.',
        links: [
          [
            '/docs/deployment/operations-platform/suite/configuration/editor-configuration',
            'Editor configuration and import switches',
          ],
        ],
      },
      {
        heading: 'What does not come across, and has to be rebuilt',
        body: [
          'This is the part worth being blunt about, because a plan that assumes otherwise is the one that stalls in week three.',
          'There is no connector that reads a Confluence space, a Google Workspace drive or a SharePoint site and recreates it inside the suite. Nothing in the product documentation describes one. Plan on exporting from the source system in the formats above and importing the result as content, which means the tree, the permissions and the conversation are reconstructed by hand or by script rather than transferred.',
        ],
        list: [
          'Space and folder hierarchy, and every permission inherited from it',
          'Page-level permission overrides that accumulated over years',
          'Comments, inline suggestions and the reply threads attached to them',
          'Version history — an imported document carries the history it was exported with, not the history it had',
          'Macros, Marketplace apps and other platform-specific artefacts, which have no equivalent to import into',
        ],
        note:
          'Decide deliberately which of these you are willing to lose, and write the decision down. A migration that says "everything" out loud and quietly drops the comment threads is how a documentation platform loses the trust of the people who have to use it.',
      },
      {
        heading: 'The mapping exercise everything else waits on',
        body: [
          'Source platforms express permissions as per-space or per-folder access with individual overrides. A self-hosted suite expresses them as group-based roles driven by the identity provider. The gap between those two models is not closed by software; it is closed by a table somebody has to write.',
          'Build the mapping before any content moves, and validate it against the group structure your directory already has. Two things make this cheaper. Inventory spaces and folders by owner rather than by size, because an unowned space should not be in the first cutover at all. And expect the long tail: the overrides that matter are rarely the ones anyone remembers creating.',
        ],
        links: [
          ['/blog/sso-self-hosted-document-platform', 'Identity and SSO: LDAP, SAML, OIDC and group mapping'],
          ['/docs/deployment/operations-platform/suite/user-management', 'Suite user management'],
        ],
      },
      {
        heading: 'Getting users in before content',
        body: [
          'Accounts can be created in bulk rather than one at a time. The system configuration reference exposes an import limit of up to 500 user rows per batch, which is the setting to check before committing to an onboarding window.',
          'Connect the identity provider first and let the directory be the source of truth for group membership. Onboarding people into a local user list and retrofitting group mapping afterwards is the expensive version of this project, and it is the version that leaves orphaned access behind when someone leaves the organisation.',
        ],
        links: [
          [
            '/docs/deployment/operations-platform/suite/configuration/system-configuration',
            'System configuration reference',
          ],
          [
            '/docs/deployment/operations-platform/system-services/system-management/user-management',
            'User management in the operations platform',
          ],
        ],
      },
      {
        heading: 'Where people are migrating from',
        body: [
          'The four source systems that come up most often fail in different places, and knowing which one you are leaving tells you where to spend the test budget.',
        ],
        table: {
          head: ['Leaving', 'What exports cleanly', 'What you rebuild'],
          rows: [
            [
              'Google Workspace',
              'Docs, Sheets and Slides export to docx, xlsx and pptx, and Drive preserves the folder structure',
              'The sharing model, comment threads, and anything that depended on Apps Script or add-ons',
            ],
            [
              'Confluence',
              'Pages export to HTML and import as documents; attachments travel with them',
              'Space and page permissions, macros, and the Jira linkage',
            ],
            [
              'SharePoint or a file share',
              'Office files are already in importable formats and need no conversion',
              'Site permissions, metadata columns, and check-in version history',
            ],
            [
              'Notion',
              'Pages export to Markdown and CSV',
              'Databases, relations and rollups, which flatten into tables rather than surviving as relations',
            ],
          ],
          caption:
            'Export fidelity is a property of the source system, not of the destination. Verify it against your own content before you rely on it.',
        },
        note:
          'If you are leaving a platform because of a hosting or data-use decision, the migration is the price of that decision rather than a separate project. Budget it that way and give it a named owner.',
        links: [
          [
            '/blog/how-to-migrate-from-google-workspace',
            'A staged Google Workspace migration plan, with cutover and rollback',
          ],
          ['/solutions/confluence-alternative', 'What replacing Confluence actually involves'],
        ],
      },
      {
        heading: 'Proving the migration worked before you retire anything',
        body: [
          'The advantage a self-hosted platform gives a migration is the ability to inspect it from the server side. Four tools in the operations platform are aimed at exactly this, and they are the difference between hoping the import worked and being able to demonstrate that it did.',
        ],
        list: [
          'File information search — look a file up by its internal GUID or client file identifier and confirm its application, type, status and content size. The page is read-only, so it is safe to use during a live cutover.',
          'Import and export task tracing — every transcoding task carries a task ID, and the event search resolves that ID to the full event list, so a failure is located rather than guessed at.',
          'Document repair — when a file will not open after import there are two recovery paths, one from encrypted data and one from historical data, and a failed repair carries no risk to the file.',
          'Object storage compatibility and performance testing — checks configuration, connectivity, upload compatibility and upload throughput against the bucket you intend to use, before documents depend on it.',
        ],
        note:
          'Run all four against a deliberately awkward sample rather than a clean test file: the largest workbook, the deck with the most embedded media, the document with a decade of comments. A migration validated on clean files has not been validated.',
        links: [
          [
            '/docs/deployment/operations-platform/system-services/business-control/file-information',
            'File information search',
          ],
          [
            '/docs/deployment/operations-platform/system-services/business-control/transcoding-events',
            'Transcoding event search',
          ],
          [
            '/docs/deployment/operations-platform/system-services/business-control/document-repair',
            'Document repair',
          ],
          [
            '/docs/deployment/operations-platform/system-services/toolset/compatibility-testing',
            'Object storage compatibility testing',
          ],
        ],
      },
      {
        heading: 'The exit path is part of the plan',
        body: [
          'A migration decision is easier to defend when leaving again is a documented operation rather than a hope. Documents export to docx, markdown, PDF and images; spreadsheets export to xlsx, with a full export archive and single-form data as CSV; tables export to xlsx; presentations export to pptx and PDF. Backups cover the database, the object storage and the installation configuration, with a documented restore and post-recovery verification procedure.',
          'That matters beyond procurement. The reason a self-hosted deployment is defensible is that the data sits on infrastructure you control, and documented export formats are the evidence that the control is real rather than nominal.',
        ],
        links: [
          ['/docs/deployment/troubleshooting/data-backup', 'Backup, restore and post-recovery verification'],
          [
            '/docs/deployment/operations-platform/system-services/service-operations/system-upgrade',
            'System upgrade procedure',
          ],
          ['/blog/upgrade-and-rollback-document-platform', 'Upgrade and rollback on a self-hosted platform'],
        ],
      },
      {
        heading: 'When migration is the wrong answer',
        body: ['A page like this should say where it does not apply. Three cases are worth naming.'],
        list: [
          'If the value of your current platform is its ecosystem rather than its documents — Marketplace apps, macros, deep issue-tracker linkage — a document platform is not a like-for-like replacement, and the migration will surface that cost after the content has already moved.',
          'If you are moving only to reduce licence cost, the arithmetic often loses. You take on upgrades, backup testing, availability and capacity planning, and that operational time is the real price of the move.',
          'If nobody owns the retirement date, do not start. A migration with no date on which the old system becomes unreachable does not finish; it adds a second system to maintain.',
        ],
        note:
          'The honest version of this page is more useful than the persuasive one, because the person reading it has to justify the decision to somebody else.',
      },
    ],
    checklist: {
      heading: 'What to have ready before you schedule a cutover',
      items: [
        'A named owner for the migration, and a date on which the old system stops being reachable',
        'Identity connected, with group-to-role mapping tested on a pilot group',
        'The permission mapping table, drafted before any content moves',
        'A test set of real files: the largest workbook, the messiest deck, the most-commented document',
        'Object storage compatibility and throughput tested against the target bucket',
        'A restore rehearsed on the destination, not merely a backup taken',
        'A written decision about which comments, history and macros you accept losing',
      ],
    },
  },
}
