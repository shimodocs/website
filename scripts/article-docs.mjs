// Which deployment guides each article should point at.
//
// The blog is the site's strongest content and the guides are its deepest, and
// until this existed they did not link to each other at all: a reader who
// finished "Self-hosted collaboration guide" had no path into the runbook that
// installs the thing, and a crawler found the guide tree only from
// /help-center and the two hub pages.
//
// The mapping is written rather than derived. Matching on tags or keywords
// would produce links like a Kubernetes guide under an article about retention
// policy — technically related, useless to the reader, and exactly the kind of
// thing that makes an internal link graph look machine-generated.
//
// Guide ids are the ids from content/docs, so a renamed or deleted guide fails
// the build rather than shipping a dead link.
export const ARTICLE_DOCS = {
  'access-control-best-practices-documents': [
    'deployment/operations-platform/suite/user-management',
    'deployment/operations-platform/system-services/system-management/audit-logs',
  ],
  'ai-agents-in-documents-security': [
    'deployment/operations-platform/suite/ai-configuration',
    'deployment/system-requirements',
  ],
  'ai-training-content-control': ['deployment/operations-platform/suite/ai-configuration'],
  'best-google-docs-alternatives': [
    'deployment/getting-started/quick-start',
    'deployment/system-requirements',
  ],
  'best-self-hosted-document-collaboration-tools': [
    'deployment/getting-started/quick-start',
    'deployment/system-requirements',
    'deployment',
  ],
  'byo-key-encryption-documents': [
    'deployment/system-requirements',
    'deployment/operations-platform/system-services/control-panel/advanced-settings',
  ],
  'data-residency-requirements-guide': [
    'deployment/system-requirements',
    'deployment/getting-started/resource-planning',
  ],
  'data-sovereignty-document-collaboration': [
    'deployment/getting-started/quick-start',
    'deployment/system-requirements',
  ],
  'document-retention-policy-guide': [
    'deployment/troubleshooting/data-backup',
    'deployment/operations-platform/system-services/system-management/audit-logs',
  ],
  'external-sharing-risks-documents': [
    'deployment/operations-platform/suite/user-management',
    'deployment/operations-platform/system-services/system-management/audit-logs',
  ],
  'gdpr-compliant-document-collaboration': [
    'deployment/system-requirements',
    'deployment/troubleshooting/data-backup',
  ],
  'google-docs-alternative-private-cloud': [
    'deployment/getting-started/quick-start',
    'deployment/system-requirements',
  ],
  'google-workspace-alternatives-for-enterprise': [
    'deployment/getting-started/quick-start',
    'deployment/getting-started/resource-planning',
  ],
  'hipaa-compliant-document-collaboration': [
    'deployment/system-requirements',
    'deployment/troubleshooting/data-backup',
  ],
  'how-to-migrate-from-google-workspace': [
    'deployment/getting-started/quick-start',
    'deployment/getting-started/resource-planning',
    'deployment/system-requirements',
  ],
  'iso27001-document-management': [
    'deployment/operations-platform/system-services/system-management/audit-logs',
    'deployment/troubleshooting/data-backup',
  ],
  'legal-hold-document-management': [
    'deployment/operations-platform/system-services/system-management/audit-logs',
    'deployment/troubleshooting/data-backup',
  ],
  'open-source-document-collaboration-options': [
    'deployment/getting-started/quick-start',
    'deployment',
  ],
  'secure-cloud-collaboration': [
    'deployment/getting-started/quick-start',
    'deployment/system-requirements',
  ],
  'secure-document-collaboration-financial-services': [
    'deployment/system-requirements',
    'deployment/operations-platform/system-services/system-management/audit-logs',
    'deployment/troubleshooting/data-backup',
  ],
  'self-hosted-collaboration-guide': [
    'deployment/getting-started/quick-start',
    'deployment/getting-started/single-node-kubernetes',
    'deployment/system-requirements',
  ],
  'self-hosted-collaboration-kubernetes-deployment': [
    'deployment/getting-started/single-node-kubernetes',
    'deployment/getting-started/high-availability-kubernetes',
    'deployment/getting-started/resource-planning',
  ],
  'self-hosted-office-suite-comparison': [
    'deployment/getting-started/quick-start',
    'deployment/system-requirements',
  ],
  'shimodocs-vs-coda': ['deployment/getting-started/quick-start', 'deployment/system-requirements'],
  'shimodocs-vs-confluence': ['deployment/getting-started/quick-start'],
  'shimodocs-vs-google-docs': [
    'deployment/getting-started/quick-start',
    'deployment/system-requirements',
  ],
  'shimodocs-vs-microsoft-365': [
    'deployment/getting-started/quick-start',
    'deployment/getting-started/resource-planning',
  ],
  'shimodocs-vs-notion': ['deployment/getting-started/quick-start'],
  'shimodocs-vs-sharepoint': [
    'deployment/getting-started/quick-start',
    'deployment/getting-started/resource-planning',
  ],
  'shimodocs-vs-slab': ['deployment/getting-started/quick-start'],
  'soc2-document-collaboration-controls': [
    'deployment/operations-platform/system-services/system-management/audit-logs',
    'deployment/troubleshooting/data-backup',
    'deployment/system-requirements',
  ],
  'web3-security-tools-resources': ['deployment/system-requirements'],
  'what-is-private-cloud-document-collaboration': [
    'deployment/getting-started/quick-start',
    'deployment/system-requirements',
    'deployment',
  ],
}
