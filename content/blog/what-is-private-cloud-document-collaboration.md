---
title: "Private Cloud Document Collaboration: Self-Hosted Guide"
seoTitle: "Self-Hosted Docs: What Actually Has to Move | ShimoDocs"
description: "The editor, sync, storage and AI have to run on infrastructure you control. What that takes to operate, and when self-hosting the suite is the wrong choice."
layout: standard
category: self-hosting
date: 2026-01-12
updated: 2026-09-23
tags: [private cloud, self-hosted, architecture, data sovereignty]
keywords: "self-hosted document collaboration, on-premises document suite, air-gapped document collaboration"
featured: true
faq:
  - question: "What is private cloud document collaboration?"
    answer: "It means running the collaboration software itself — the editor, the real-time sync service, storage, search and the AI features — inside a network boundary you govern, rather than subscribing to a multi-tenant service. The editing experience can look identical. What changes is who holds the keys, who can be compelled to produce the data, and who decides when the product changes underneath you."
  - question: "Does self-hosting storage alone make a deployment private?"
    answer: "No. Self-hosting storage while leaving the editor and the AI features in a vendor cloud leaves the plaintext inside a process you do not control, because the editor is where the plaintext lives. A complete deployment also covers the application tier, the real-time collaboration service, the relational database, object storage, the AI layer and identity."
  - question: "Which layers have to be self-hosted for the boundary to hold?"
    answer: "The application tier, the real-time collaboration service, the relational database, object storage, the AI layer and identity. If any of those stays with a third party, that party sits inside your trust boundary whether or not it appears on the architecture diagram."
  - question: "What do you give up when you move to a private cloud?"
    answer: "Uptime becomes your operations problem, upgrades land on your schedule, some vendor integrations are unavailable, and you still pay for infrastructure. For most organisations the staffing cost of operations is the largest real cost of the move, and it is larger than the change in licence spend."
  - question: "When is private cloud document collaboration the wrong choice?"
    answer: "When nobody owns operations and there is no on-call rotation, when the team is under ten people and saving money is the main driver, when the only requirement is encryption that every serious vendor already provides, or when deep integration with an ecosystem you cannot replace is load-bearing. Self-hosting concentrates risk rather than removing it."
  - question: "How does ShimoDocs deploy?"
    answer: "As a self-hosted suite covering documents, writers, spreadsheets, presentations, forms and tables, with the AI workspace included. It runs on a single node or a high-availability Kubernetes cluster, connects to your MySQL, Redis and object storage, and runs AI against the model endpoint you nominate."
---

Private cloud document collaboration means running the editor, real-time sync, storage, search and AI on infrastructure your organisation controls. It is the self-hosted alternative to a public SaaS document suite.

This guide explains which layers belong inside that boundary, what your operations team takes on and when private deployment is the wrong choice. Self-hosting the storage alone does not put the editor or an external AI service under your control.

If the documents cannot sit on Microsoft 365 or Google, the next page is the boundary you actually need: [on-premises document collaboration](/on-premises), [air-gapped document collaboration](/airgap), or a [self-hosted Confluence alternative](/solutions/confluence-alternative). What an operator can check about control is on the [security page](/security).

## The short definition

Private cloud document collaboration means running the collaboration software itself — the editor, the real-time sync service, the storage layer, the search index and the AI features — inside a network boundary you govern, rather than subscribing to a multi-tenant service.

In practice that means three things move:

| Layer | Public cloud suite | Private cloud collaboration |
| --- | --- | --- |
| Data at rest | Vendor storage buckets | Your object storage |
| Access control | Vendor identity plus your SSO | Your identity provider, end to end |
| Feature changes | Vendor roadmap | Your upgrade schedule |

The user-facing experience can be nearly identical. Real-time cursors, comment threads, mentions and version history all work the same way. What changes is who holds the keys, who can be compelled to hand over data, and who decides when the product changes underneath you.

## Why the distinction matters more than it used to

Ten years ago the argument for private deployment was mostly about cost and control. Two things have changed that.

**Regulatory expectations tightened.** Data residency requirements, sector rules for financial and health records, and contractual obligations to customers increasingly ask not just "where is the data stored" but "who can access it, and under what legal process". A vendor's data-processing agreement is one answer. Running the service yourself is a much shorter answer.

**AI changed the value of the content.** Document repositories used to hold decisions and drafts. They now hold the raw material that trains and grounds AI systems. When an AI feature reads your documents to answer a question, the question of where that inference happens stops being abstract.

> The shift is not that collaboration software became riskier. It is that the content became more valuable, and the number of parties who could touch it went up.

```figure
type: layers
title: Every layer that touches plaintext has to move
items: Application tier | Real-time collaboration service | Relational database | Object storage | AI inference layer
detail: The editors and APIs your users touch | Websocket coordination for concurrent editing | Metadata, permissions, comments and version pointers | Document bodies and attachments | The model endpoint plus the retrieval pipeline that feeds it
caption: Figure 1. Self-hosting is not one component. A hosted editor with self-hosted storage still leaves the plaintext in somebody else's process.
```

## What actually has to be self-hosted

A common half-measure is to self-host storage while leaving the editor and AI in the vendor's cloud. That does not achieve much, because the editor is where the plaintext lives.

A complete private deployment usually includes:

- **The application tier** — document, spreadsheet, presentation, form and table services.
- **The real-time collaboration service** — websocket coordination for concurrent editing.
- **The relational database** — metadata, permissions, comments, version pointers.
- **Object storage** — the file blobs themselves.
- **The AI layer** — the model endpoint and the retrieval pipeline that supplies document context.
- **Identity** — LDAP, SAML or OIDC against your existing directory.

If any of these stays with a third party, that party is inside your trust boundary whether or not it appears on the architecture diagram.

```figure
type: compare
title: What changes when the suite moves in-house
left: On a hosted suite
right: On your own infrastructure
leftItems: You inherit the vendor's uptime | The vendor controls upgrade timing | Plaintext is readable by the operator | AI inference runs on the vendor's stack
rightItems: Uptime is your operations problem | Upgrade timing is a change-management decision | Plaintext stays inside your boundary | You nominate the inference endpoint
caption: Figure 2. The trade is not features for control. It is operational burden for control, and the two are not symmetric.
```

## What you give up

Honest comparisons list the costs, so here they are.

**You own the uptime.** A managed service has an operations team on call. You need monitoring, backups and someone who can respond at 2am. For most organisations this is the largest real cost, and it is a staffing cost rather than a licence cost.

**You own the upgrades.** Security patches land on your schedule. Slower can be safer, but only if you actually apply them.

**You lose some integrations.** Vendors with a large ecosystem have connectors that a smaller self-hosted product may not. Check the specific integrations your team depends on before committing.

**You still pay for infrastructure.** Self-hosting is not free. It moves spend from a per-seat subscription to cloud or data-centre cost, which is often cheaper at scale and rarely cheaper for a handful of users.

## When private cloud collaboration is the right fit

It tends to fit when at least two of these are true:

1. **The content is regulated or contractually restricted.** Customer records, clinical notes, legal matters, financial models, government work.
2. **You already run infrastructure.** If you have a Kubernetes platform and an operations team, adding a workload is incremental.
3. **Your document volume is large enough that per-seat pricing is painful.** Cost curves cross.
4. **AI adoption is blocked on data handling.** Teams want an assistant but cannot send documents to a third-party model.
5. **You need to control the upgrade cadence.** Validated environments, certification, change control.

If none of those apply, a public cloud suite is probably the right call, and you should not self-host for its own sake.

## When it is not

Be sceptical of private deployment if:

- Nobody owns operations and there is no on-call rotation.
- The team is under ten people and the main driver is saving money.
- The only requirement is "the data must be encrypted", which every serious vendor already does.
- Deep integration with an ecosystem you cannot replace is load-bearing.

Self-hosting concentrates risk rather than removing it. It is the right trade when you are better positioned to carry that risk than the vendor is — usually because you have regulatory, contractual or architectural reasons the vendor cannot satisfy.

## How ShimoDocs approaches it

ShimoDocs is built as a self-hosted suite: documents, writers, spreadsheets, presentations, forms and tables, with the AI workspace included. It deploys to a single node or a high-availability Kubernetes cluster, connects to your MySQL, Redis and object storage, and runs AI against the model endpoint you nominate.

Because the AI layer is configurable, the retrieval pipeline that feeds document context to a model stays inside your environment. You choose the model provider, and you can point it at something running on your own hardware.

If you are evaluating the category, the next useful step is deciding which of the costs above you can actually carry. The [on-premises page](/on-premises) is that deployment, and the [security page](/security) is where the control claims can be checked. A [self-hosted Atlassian alternative](/solutions/atlassian-alternative) is the same decision when the incumbent is Confluence or Jira rather than a public cloud suite.

## Questions to ask any vendor in this category

Before you commit, get specific answers to these:

- Where does the plaintext exist at any moment, and who can read it?
- What happens to the deployment if the vendor disappears?
- Can the AI features be disabled or pointed at a local model?
- What is the upgrade path, and can it be staged?
- Which identity providers are supported, and does group sync work?
- What does the backup and restore story look like, and has it been tested?

The answers separate products that were designed to be self-hosted from products that were designed to be hosted and happen to have a deployment option.

Self-hosting still leaves a product-shape question. A file platform with an editor hung on the tree is not a document suite; [ShimoDocs versus Nextcloud](/blog/shimodocs-vs-nextcloud) and [Collabora in Nextcloud versus a document suite](/blog/collabora-nextcloud-vs-document-suite) are that distinction. The [platform comparison](/comparison) is the capability matrix.

## Frequently asked questions

### What is private cloud document collaboration?

It means running the collaboration software itself — the editor, the real-time sync service, storage, search and the AI features — inside a network boundary you govern, rather than subscribing to a multi-tenant service. The editing experience can look identical. What changes is who holds the keys, who can be compelled to produce the data, and who decides when the product changes underneath you.

### Does self-hosting storage alone make a deployment private?

No. Self-hosting storage while leaving the editor and the AI features in a vendor cloud leaves the plaintext inside a process you do not control, because the editor is where the plaintext lives. A complete deployment also covers the application tier, the real-time collaboration service, the relational database, object storage, the AI layer and identity.

### Which layers have to be self-hosted for the boundary to hold?

The application tier, the real-time collaboration service, the relational database, object storage, the AI layer and identity. If any of those stays with a third party, that party sits inside your trust boundary whether or not it appears on the architecture diagram.

### What do you give up when you move to a private cloud?

Uptime becomes your operations problem, upgrades land on your schedule, some vendor integrations are unavailable, and you still pay for infrastructure. For most organisations the staffing cost of operations is the largest real cost of the move, and it is larger than the change in licence spend.

### When is private cloud document collaboration the wrong choice?

When nobody owns operations and there is no on-call rotation, when the team is under ten people and saving money is the main driver, when the only requirement is encryption that every serious vendor already provides, or when deep integration with an ecosystem you cannot replace is load-bearing. Self-hosting concentrates risk rather than removing it.

### How does ShimoDocs deploy?

As a self-hosted suite covering documents, writers, spreadsheets, presentations, forms and tables, with the AI workspace included. It runs on a single node or a high-availability Kubernetes cluster, connects to your MySQL, Redis and object storage, and runs AI against the model endpoint you nominate.
