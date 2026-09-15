// Commercial hub pages.
//
// The blog answers questions; these pages answer one deployment question each
// and link into the documentation that proves the answer. They are data-driven
// so a new hub is an entry here plus a route, with no new layout to maintain.
//
// Every factual claim on these pages is drawn from the product documentation in
// content/docs, which is synced from the product repository — so the hub and the
// guide it links to cannot describe the product differently.

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
          'Because a licence is a file rather than a phone-home check, enabling the suite on an isolated network does not require a temporary connection. The free perpetual licence for teams of up to five people is issued the same way.',
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
}
