---
title: "Comparing Self-Hosted Office Suites: What Actually Matters"
seoTitle: "Comparing Self-Hosted Office Suites | ShimoDocs"
description: "A framework for comparing self-hosted office and document collaboration suites, covering deployment, file fidelity, identity and AI."
layout: magazine
category: comparisons
date: 2026-02-16
updated: 2026-09-15
tags: [self-hosted, comparison, evaluation, office suite]
keywords: "self-hosted office suite comparison, best self-hosted office suite, open source office suite comparison"
faq:
  - question: "What is the first thing to compare between self-hosted office suites?"
    answer: "The deployment model, because the first question is what self-hosted actually means for that vendor. Vendor-hosted in your own cloud account gives data residency but not control of plaintext. A single-node install trades high availability for simplicity, a high-availability cluster adds resilience and rolling upgrades at the cost of simplicity, and an air-gapped install buys network isolation at the cost of convenience. Check whether the mode you need is a first-class deployment path or a documented workaround."
  - question: "Why do self-hosted suite evaluations fail?"
    answer: "Most fail because they start with the feature comparison and discover a structural problem in month three. Work the framework top to bottom instead: if a suite fails a hard requirement in the first three sections, stop there, and only do the feature comparison once it passes those."
  - question: "What is the key test of a suite data architecture?"
    answer: "Can you rebuild the search index from primary storage, and does losing the cache cause an outage or merely a slowdown? If the search index is not rebuildable, you have a backup problem you will discover at the worst moment. Whether object storage is S3-compatible matters too, because it decides whether your existing backup tooling applies."
  - question: "Why does the application tier being stateless matter?"
    answer: "It determines how much of the operational burden you can push onto Kubernetes rather than solving yourself. Of the layers a suite runs, the application tier is the only one that should be stateless. The relational database, object storage, search index and cache each hold something you have to plan either to rebuild or to restore."
  - question: "What does identity integration need to cover?"
    answer: "Five things, and provisioning users is only the first. SAML or OIDC against your existing directory, group-to-role mapping rather than provisioning alone, deprovisioning that revokes access when the directory account is disabled, no per-user local accounts beyond a break-glass administrator, and guest handling with expiry by default. A suite that provisions users but not permissions converts every departure into a manual task, and manual tasks get skipped."
  - question: "How should file fidelity be tested?"
    answer: "With five files from your own corpus, not vendor sample documents, which are chosen to pass. Check import fidelity for docx and xlsx, export fidelity that round-trips formatting and formulas, whether comments and tracked changes survive or are deliberately dropped, print layout for documents that end up as PDFs, and large spreadsheet performance, which is where most suites reveal their limits. Spreadsheets carry the highest behavioural risk, because a file that opens can still compute the wrong number."
---

Choosing a self-hosted office suite is not like choosing a hosted one. With a hosted product you are comparing features and a monthly bill. With a self-hosted product you are comparing an operational commitment, and the feature grid tells you very little about that.

This is the evaluation framework to use instead, and it is deliberately ordered by how often each item decides the outcome.

## How to use this

Work top to bottom. Most evaluations fail because they start with the feature comparison and discover a structural problem in month three.

If a suite fails a hard requirement in the first three sections, stop. If it passes those, the feature comparison is worth doing.

## 1. Deployment model

The first question is what "self-hosted" actually means for this vendor.

| Model | What you get | What you do not |
| --- | --- | --- |
| Vendor-hosted in your cloud account | Data residency | Control of plaintext |
| Single-node install | Simplicity, low operational load | High availability |
| High-availability cluster | Resilience, rolling upgrades | Simplicity |
| Air-gapped or offline | Network isolation | Convenience |

Check specifically whether the vendor supports the mode you need, and whether it is a first-class deployment path or a documented workaround. A product designed for one model and adapted for another tends to show it during upgrades.

Also establish whether the application tier is stateless. That single property determines how much of the operational burden you can push onto Kubernetes rather than solving yourself. Our [Kubernetes deployment walkthrough](/blog/self-hosted-collaboration-kubernetes-deployment) covers what to look for.

```figure
type: layers
title: Where state lives, and what that costs you
items: Application tier | Relational database | Object storage | Search index | Cache and sessions
detail: The only layer that should be stateless | Must be restorable to a point in time, or you cannot recover | Grows monotonically; lifecycle policy is a decision, not a default | Must be rebuildable from primary storage, or it is a backup liability | Losing it should be a slowdown, not data loss
caption: Figure 1. The last three rows are where evaluations find surprises, and where the search index quietly becomes the only copy of something.
```

## 2. Data architecture

Where does state live, and can you operate it with tools you already have?

- **Relational database.** Which engine, and is it a supported external dependency or bundled?
- **Object storage.** S3-compatible, or a bespoke store you cannot back up with existing tooling?
- **Search index.** Rebuildable, or does it hold the only copy of something?
- **Cache and sessions.** Survivable if lost?

The test is simple: can you rebuild the search index from primary storage, and does losing Redis cause an outage or a slowdown? If the search index is not rebuildable, you have a backup problem you will discover at the worst moment.

Backup and restore deserves its own assessment, and the [self-hosted collaboration guide](/blog/self-hosted-collaboration-guide) covers why an untested restore is not a backup.

## 3. Identity and access

This is where self-hosted deployments most often end up weaker than the service they replaced.

- **SAML or OIDC**, against your existing directory.
- **Group-to-role mapping**, not just user provisioning.
- **Deprovisioning** that revokes access when the directory account is disabled.
- **No per-user local accounts** beyond a break-glass administrator.
- **Guest handling** with expiry by default.

A suite that provisions users but not permissions converts every departure into a manual task, and manual tasks get skipped. Ask for the group mapping specifically and test the full lifecycle before onboarding content.

```figure
type: bars
title: Fidelity risk by file type
items: Word processing documents | Spreadsheets with formulas | Presentations | Forms | Large datasets
value: 38 | 86 | 49 | 33 | 68
caption: Figure 2. Indicative risk of behavioural loss rather than content loss. The second bar is the one that quietly decides migrations, because a file that opens can still compute the wrong number.
```

## 4. File fidelity

For any organisation that exchanges files externally, this is a hard requirement rather than a preference.

- **Import fidelity** for .docx and .xlsx, tested with your ugliest real files.
- **Export fidelity** that round-trips, including formatting and formulas.
- **Comments and tracked changes** surviving or being deliberately dropped.
- **Print layout** for documents that end up as PDFs or paper.
- **Large spreadsheet performance**, which is where most suites reveal their limits.

Test with five files from your own corpus. Vendor sample documents are chosen to pass.

## 5. Collaboration experience

Real-time editing is table stakes; the differentiators are at the edges.

- **Concurrent editing under contention** — three editors in one paragraph.
- **Suggestion mode** with accept and reject, if you have a review workflow.
- **Comments anchored to selections**, and what happens when the selection is deleted.
- **Version history** that a non-technical reviewer can navigate.
- **Offline behaviour**, if any part of your organisation works disconnected.

## 6. AI architecture

Increasingly the decisive section, and the one vendors describe least precisely.

- **Where does inference happen?** Ask for the data flow, not the feature name.
- **Can the endpoint be configured?** Including a model you host.
- **Does retrieval respect document permissions?** A confused-deputy problem is a real risk.
- **Are AI edits attributable?** A named agent and an entry in version history.
- **Can AI be disabled per workspace, and how quickly tenant-wide?**

Our [AI agents security checklist](/blog/ai-agents-in-documents-security) turns these into specific questions with specific answers to look for.

## 7. Operations and upgrades

The section that determines whether the deployment is still healthy in two years.

- **Upgrade path** and whether it can be staged.
- **Rollback**, including for schema migrations.
- **Monitoring** — what the product exposes, and whether the signals predict user-visible problems.
- **Support model** and response expectations.
- **Documentation quality** for the failure modes you will actually hit.

## 8. The boring things that decide projects

Finally, the items nobody puts in a comparison matrix:

- **Licence model and cost at your scale**, including what is not included.
- **Active development** and release cadence.
- **Exit path** — can you export everything, and has anyone done it?
- **Community or commercial support** when documentation runs out.
- **Hiring familiarity**, which affects how quickly a new administrator is productive.

## The questions that produce a decision

A framework is only useful if it ends. These are the questions to put to each shortlisted vendor, in order, and the answers that should stop an evaluation.

**Architecture.** Is the application tier stateless, and does the product support an external relational database and S3-compatible object storage? A no here means you are taking on database operations as well as application operations, which is a legitimate choice but should be a conscious one.

**Identity.** Can directory groups be mapped to roles, and does disabling a directory account revoke access without a second step? A no here means every departure becomes a manual task, and manual tasks get skipped.

**Data.** Can the search index be rebuilt from primary storage? A no means the index is a backup liability and will eventually be the thing that is missing.

**Fidelity.** Will the vendor commit, in writing, to the import and export cases you tested? A hedge here is information.

**AI.** Can the inference endpoint be configured, and does retrieval filter by document permission? The second half is the one vendors answer vaguely, and the vague answer is the answer.

**Operations.** Can an upgrade be staged in a non-production environment, and has the vendor documented a rollback that includes schema changes?

**Support.** What is the response commitment, and who is accountable when the platform holds regulated content?

**Exit.** What does a complete export look like, and has any customer done it?

Two or three of these will be decisive for any given organisation. The value of asking all eight is that you discover which two or three before you migrate rather than after.

## A scoring approach that works

Rather than a weighted matrix, use gates:

1. **Hard requirements** from sections 1 to 4. Pass or fail, no partial credit.
2. **Scored comparison** on sections 5 to 7 for the suites that pass.
3. **Reference checks** on section 8, including at least one organisation running it at your scale.

The gate approach prevents the most common failure: a product that scores brilliantly on features and cannot satisfy the identity or file-fidelity requirement that a regulated environment depends on.

For the wider decision about whether to self-host at all, start with [what private cloud document collaboration is](/blog/what-is-private-cloud-document-collaboration).

## Frequently asked questions

### What is the first thing to compare between self-hosted office suites?

The deployment model, because the first question is what self-hosted actually means for that vendor. Vendor-hosted in your own cloud account gives data residency but not control of plaintext. A single-node install trades high availability for simplicity, a high-availability cluster adds resilience and rolling upgrades at the cost of simplicity, and an air-gapped install buys network isolation at the cost of convenience. Check whether the mode you need is a first-class deployment path or a documented workaround.

### Why do self-hosted suite evaluations fail?

Most fail because they start with the feature comparison and discover a structural problem in month three. Work the framework top to bottom instead: if a suite fails a hard requirement in the first three sections, stop there, and only do the feature comparison once it passes those.

### What is the key test of a suite data architecture?

Can you rebuild the search index from primary storage, and does losing the cache cause an outage or merely a slowdown? If the search index is not rebuildable, you have a backup problem you will discover at the worst moment. Whether object storage is S3-compatible matters too, because it decides whether your existing backup tooling applies.

### Why does the application tier being stateless matter?

It determines how much of the operational burden you can push onto Kubernetes rather than solving yourself. Of the layers a suite runs, the application tier is the only one that should be stateless. The relational database, object storage, search index and cache each hold something you have to plan either to rebuild or to restore.

### What does identity integration need to cover?

Five things, and provisioning users is only the first. SAML or OIDC against your existing directory, group-to-role mapping rather than provisioning alone, deprovisioning that revokes access when the directory account is disabled, no per-user local accounts beyond a break-glass administrator, and guest handling with expiry by default. A suite that provisions users but not permissions converts every departure into a manual task, and manual tasks get skipped.

### How should file fidelity be tested?

With five files from your own corpus, not vendor sample documents, which are chosen to pass. Check import fidelity for docx and xlsx, export fidelity that round-trips formatting and formulas, whether comments and tracked changes survive or are deliberately dropped, print layout for documents that end up as PDFs, and large spreadsheet performance, which is where most suites reveal their limits. Spreadsheets carry the highest behavioural risk, because a file that opens can still compute the wrong number.
