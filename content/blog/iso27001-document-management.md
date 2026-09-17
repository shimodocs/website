---
title: "ISO 27001 and Document Management"
seoTitle: "ISO 27001 Document Management Controls | ShimoDocs"
description: "How ISO 27001 applies to document collaboration: ISMS scope, the Annex A controls that matter, and why certification is not a product feature."
layout: magazine
category: security
date: 2026-03-06
updated: 2026-09-14
tags: [iso 27001, compliance, isms, controls]
keywords: "iso 27001 document management, iso 27001 document collaboration, annex a controls documents"
---

ISO 27001 is an information security management system standard. It certifies an organisation's management of information security, not the security of a product. That distinction is the source of most confusion when a document platform is described as "ISO 27001 certified".

The standard is nonetheless extremely useful for document collaboration, because a large share of its control set is about exactly the things a document platform does: classification, access, retention, deletion and logging.

> This article describes ISO/IEC 27001 in general terms. It is not certification or legal advice. Your certification body determines applicability.

## What gets certified

Certification applies to an **information security management system** within a defined scope. The scope statement names the organisational units, locations, systems and services covered — which means two things worth knowing.

First, the certificate covers what the scope says and nothing else. A certificate with a narrow scope says little about systems outside it.

Second, a software vendor's certificate covers the vendor's own ISMS. It does not transfer to your deployment. If you run the platform, the controls that matter for your certification are yours to operate.

## The control set

ISO/IEC 27001:2022 restructured Annex A into four themes containing 93 controls.

```figure
type: layers
title: Annex A in four themes (ISO/IEC 27001:2022)
items: Organisational controls — 37 | People controls — 8 | Physical controls — 14 | Technological controls — 34
detail: Policies, roles, classification, supplier relationships, incident management, business continuity. The largest theme and the least product-dependent. | Screening, terms of employment, awareness and training, disciplinary process, remote working. | Physical perimeters, entry controls, equipment protection, secure disposal, clear desk. For a self-hosted deployment this is your facility. | Access control, authentication, logging, monitoring, backup, deletion, masking, data leakage prevention. This is where a document platform contributes.
caption: Figure 1. The technological theme is where a product helps. The other three are organisational, and no platform substitutes for them.
```

The Annex A list is not a checklist to implement wholesale. Annex A is a catalogue of possible controls; the standard requires you to select those applicable to your risks and justify the selection.

## The controls that map onto documents

These are the ones that repeatedly surface in document platform reviews.

| Control area | ISO/IEC 27001:2022 | What it means for a document platform |
| --- | --- | --- |
| Classification of information | A.5.12 | Repositories need sensitivity tiers, and content needs to inherit them |
| Labelling of information | A.5.13 | Users must be able to see which tier a document belongs to |
| Transfer of information | A.5.14 | External sharing rules, and controls on where content may go |
| Protection of records | A.5.33 | Retention, integrity and protection against tampering |
| Access control | A.5.15, A.8.2, A.8.3 | Least privilege, privileged access management, information access restriction |
| Authentication | A.8.5 | Directory identity, MFA, session controls |
| Logging and monitoring | A.8.15, A.8.16 | Access logs, retention of logs, monitoring for anomalies |
| Information deletion | A.8.10 | Deletion that reaches every copy, and can be evidenced |
| Data leakage prevention | A.8.12 | Controls on exfiltration and uncontrolled sharing |
| Backup | A.8.13 | Backup of data, software and systems, and tested restoration |

Two of these deserve more attention than they usually get.

**A.5.33 protection of records** is where retention and legal hold live. It is not enough to have a retention policy; the platform has to enforce it and prevent premature or unauthorised destruction. Our [retention policy guide](/blog/document-retention-policy-guide) and [legal hold guide](/blog/legal-hold-document-management) cover the operational side.

**A.8.10 information deletion** is where most self-hosted deployments are weakest, because deletion has to reach the search index, the caches, the backups and — if AI is enabled — whatever retrieval layer copies content. Being able to demonstrate that is a genuine engineering requirement rather than a policy statement.

## The management system, not just the controls

The control list is the visible part. The standard is really a cycle, and auditors test the cycle.

```figure
type: flow
title: The ISMS cycle an auditor will walk
items: Context and scope | Risk assessment | Statement of Applicability | Operate and monitor | Internal audit and review
detail: What the ISMS covers, who owns it, what interfaces it has | Identify risks to confidentiality, integrity and availability, and evaluate them | Which Annex A controls apply, why, and which were excluded with justification | Controls running, evidence collected, incidents managed, metrics reviewed | Independent internal audit, management review, corrective actions, improvement
caption: Figure 2. The Statement of Applicability is the document auditors read first. Every excluded control needs a reason, and "not applicable" with no rationale is a finding.
```

For a self-hosted document platform, the ISMS implications are concrete:

- **Supplier relationships (A.5.19–A.5.22)** still apply, but the vendor becomes a software supplier rather than a data processor. Different due diligence, different contract.
- **Business continuity (A.5.29, A.5.30)** now includes the document platform's availability, because you own it.
- **Incident management (A.5.24–A.5.28)** includes detection, which is yours when you self-host.
- **Change management (A.8.32)** applies to every platform upgrade, including the vendor's releases.

None of that is a reason to avoid self-hosting. It is a reason to add the platform to the asset register and the risk assessment rather than treating it as a tool somebody installed.

## Statement of Applicability, in practice

The Statement of Applicability is the document that connects your risk assessment to the controls you actually operate. It lists each applicable control, states whether it is implemented, and gives the justification. Auditors read it first because it tells them what to test.

For a document platform, three sections of it do the heavy lifting.

**Controls the platform provides.** Access control, authentication, logging, backup, deletion. For each, the justification should name the platform and the configuration rather than saying "implemented". "Access control is enforced through directory group mapping in the document platform, reviewed quarterly" is verifiable. "Access control is implemented" is not.

**Controls you provide around the platform.** Classification, retention schedules, access reviews, incident response. These are organisational and they do not become the platform's responsibility because the platform is self-hosted.

**Controls excluded, with justification.** Some Annex A controls genuinely do not apply. The finding is not the exclusion — it is an exclusion with no reasoning, or an exclusion that contradicts the scope statement.

A common failure for self-hosted deployments is scope drift. The platform is deployed by one team, used informally, and never added to the asset inventory or the risk assessment. It is then outside the ISMS scope while holding regulated content, which is a worse position than not having deployed it.

The remedy is procedural and cheap: add the platform to the asset register on the day it is installed, assign an owner, and note it in the risk assessment before content arrives. Retrofitting a platform into an ISMS during an audit cycle is significantly more expensive.

One further point worth stating for anyone comparing a vendor's certificate against a self-hosted option. A software vendor's ISO 27001 certificate covers the vendor's own management system. It says nothing about your deployment, and it does not transfer. What transfers is the usefulness of the product's controls in helping you satisfy your own Statement of Applicability — which is a different and more relevant question.

## A practical sequence

1. **Put the platform in scope.** Add it to the asset inventory and the risk assessment. Systems outside scope are the ones that produce findings.
2. **Classify before you migrate.** Define sensitivity tiers and decide which repositories hold which. Classification drives access, retention and sharing rules.
3. **Map the Annex A controls you rely on the platform for.** Access control, logging, retention, deletion, backup. For each, decide whether you are evidencing it from the platform or manually.
4. **Write the exclusions honestly.** If you exclude a control because the platform handles it, say so and reference the platform's configuration.
5. **Test the deletion and restore paths.** Both are controls, and both are evidenced by a dated test rather than a procedure.
6. **Review access from the platform, not a spreadsheet.** An access review generated from the system is auditable evidence; one maintained by hand is a liability.

## Where a self-hosted suite fits

Self-hosting suits an organisation that already runs an ISMS and wants to control the platform rather than inherit assurance about someone else's. It suits it badly if the platform would be the first system you operate under formal change control.

For the broader evaluation, our [self-hosted office suite comparison](/blog/self-hosted-office-suite-comparison) covers the architectural questions, [SOC 2 for document collaboration](/blog/soc2-document-collaboration-controls) covers the equivalent analysis under the AICPA criteria, and [data sovereignty](/blog/data-sovereignty-document-collaboration) covers the residency and jurisdictional questions that usually trigger the evaluation in the first place.
