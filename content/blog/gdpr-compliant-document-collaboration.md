---
title: "GDPR-Compliant Document Collaboration"
seoTitle: "GDPR Document Collaboration Requirements | ShimoDocs"
description: "What GDPR actually asks of document collaboration software: controller and processor duties, retention, breach response and international transfers."
layout: standard
category: security
date: 2026-02-27
tags: [gdpr, compliance, personal data, retention]
keywords: "gdpr compliant document collaboration, gdpr document management, data protection by design documents"
---

"GDPR compliant" is a phrase vendors use loosely. There is no certificate, no register, and no authority that grants the label. What exists is a set of obligations that fall on specific parties, and the useful question is which of them your document platform helps you meet and which it quietly makes harder.

This is a practical breakdown of where collaboration software touches those obligations.

> This article describes regulatory requirements in general terms. It is not legal advice, and the specifics depend on your organisation, your data and your jurisdiction. Work with your own counsel or data protection officer.

## Who is responsible for what

The first thing to establish is your role, because it determines your obligations.

**You are the controller** for the personal data in your documents. You decide why it is processed and how.

A **hosted vendor is a processor** acting on your instructions. That relationship needs a written agreement covering the processor obligations, and it creates a dependency you do not fully control.

If you **self-host**, the vendor may not be a processor at all. You run the software inside your own boundary, and there is no third party processing your documents. That does not reduce your obligations as a controller — it removes one category of supplier risk.

Teams often conflate "our vendor is compliant" with "we are compliant". The vendor's posture is an input. Your controller duties remain yours either way.

## Where a document platform touches personal data

Collaboration software is not one processing activity. It is several, and they carry different obligations.

```figure
type: layers
title: The processing activities inside a document platform
items: Document content | Metadata and analytics | Search index | Access logs | AI retrieval and inference
detail: The personal data people wrote down. The primary processing activity and the one the others copy. | Who opened what, when, from where. Often personal data in its own right and frequently overlooked. | A second full-text copy with its own retention and deletion behaviour. | Evidence of access, needed for accountability and also subject to retention limits. | Document text packaged into a prompt and sent to a model endpoint, if AI is enabled.
caption: Figure 1. Four of these five are copies. Erasure requests are answered by the storage layer and failed by the ones underneath it.
```

The practical consequence: a deletion request has to reach every layer. Deleting a document from the library while the search index, the cache and the analytics store keep copies is a partial response, and it is the most common finding in a data protection review of a document platform.

## The articles that decide most evaluations

You do not need to memorise the regulation. These are the obligations that show up in practice.

### Records of processing

You need to know what personal data is processed, why, and where. A document repository is usually the least-mapped system in the organisation, because it holds whatever people put there rather than a defined set of fields.

Practical step: classify repositories by sensitivity and purpose. Even a rough tiering — general, confidential, restricted — turns an open-ended inventory into a scoped one.

### Data protection by design and by default

The design obligations reward defaults rather than intentions. In a document platform that means:

- Sharing defaults that fail closed rather than open.
- External link sharing off until deliberately enabled.
- Retention applied by default rather than on request.
- Permissions inherited from directory groups rather than set per file.

Every one of those is a configuration decision, and every one is easier to make in a platform you operate.

### Security of processing

Appropriate technical and organisational measures, proportionate to risk. Encryption in transit and at rest are baseline. Access control, logging and the ability to restore are the parts that actually get examined.

The uncomfortable version of this obligation is evidencing it. Being able to produce an access log for a specific document over a specific period, from systems you operate, is a different thing from asserting that access is controlled.

### Breach notification

There is a deadline attached, which makes it an operational requirement rather than a policy one. Meeting it means being able to answer, quickly: what was affected, who could access it, and when did it start.

A platform with a usable audit trail turns that from a multi-day investigation into a query. A platform without one turns it into an estimate, and estimates are what regulators find unsatisfactory.

### International transfers

Where personal data leaves the relevant jurisdiction, a transfer mechanism is needed. This is where hosted collaboration gets complicated, because the vendor's infrastructure, support tooling and subprocessors may all sit in different countries.

Our [data sovereignty article](/blog/data-sovereignty-document-collaboration) covers the distinction between residency and sovereignty, which is the part procurement conversations usually blur.

## What self-hosting changes

Self-hosting does not make an organisation compliant. It changes four things.

| Obligation | Hosted suite | Self-hosted |
| --- | --- | --- |
| Processor agreement | Required with the vendor | Vendor may not be a processor |
| Subprocessor chain | Vendor's list, changes on their schedule | None, by construction |
| Transfer mechanism | Needed for the vendor's processing | Only for your own transfers |
| Erasure evidence | Vendor's tooling and attestation | Your own deletion process |
| Breach detection | Vendor notifies you | You detect and notify |

The last row is the one teams underestimate. When you self-host, breach detection becomes yours. That is a real capability you have to build — monitoring, alerting and a response process — and it is the strongest argument against self-hosting in a small organisation with no security function.

## What to do about the content already there

Most organisations start with a repository that predates any classification. The question is what to do with it, and the answer is rarely "classify everything".

A sequence that works:

**Start with the repositories, not the files.** A repository has an owner, a purpose and usually a rough sensitivity level. Individual files do not have any of those, and attempting file-level classification stalls immediately.

**Apply a default tier per repository.** Anything in the HR repository is personnel data. That single step covers the majority of personal data without inspecting a single document.

**Handle the exceptions by rule.** Where a repository obviously contains mixed content, set the default to the higher tier and grant access accordingly. Over-restricting produces complaints; under-restricting produces findings.

**Leave the archive alone, deliberately.** Dormant content from a decade ago is a retention problem, not a classification problem. Decide whether it is in scope for the current project, and write down the decision.

**Set the review cadence before you finish.** Classification drifts as repositories are created. A quarterly review of new repositories is cheaper than an annual re-classification of everything.

The point of this work is not completeness. It is that a rough, defensible tiering lets every subsequent control — access, retention, sharing, AI — become scoped rather than global.

```figure
type: compare
title: Two ways to fail a data protection review
left: Under-mapped
right: Over-engineered
leftItems: Nobody can say where personal data lives | Access cannot be scoped, so it is granted broadly | Retention cannot be applied per class | AI retrieval has no boundary to respect
rightItems: Classification takes a year and never finishes | Repositories stay unclassified while the project runs | Teams route around the controls to get work done | The policy exists and the practice does not
caption: Figure 2. Both extremes produce the same outcome: no working control. A rough tiering delivered this quarter beats a perfect one delivered next year.
```

```keypoints
title: The four questions a reviewer will actually ask
- **Where does personal data live, and who can read it?** An answer that stops at "in the document platform" is not an answer. Name the repositories, the storage and the people.
- **How does it leave the boundary, and under what instrument?** External sharing, support access and AI inference are three different routes with three different answers.
- **How long is it kept, and who decided that?** A retention rule nobody can point at is not a rule. The decision has to have an owner and a date.
- **What happens when something goes wrong, and how quickly can you show it?** Breach notification runs on a clock, and the evidence is gathered long before anyone knows they need it.
```

## A workable checklist

Work through this before enabling AI or onboarding regulated content.

**Inventory**
- Which repositories hold personal data, and for what purpose?
- Where does that data flow outside the organisation, including AI inference?
- What is the retention rule for each class, and who set it?

**Defaults**
- Does external sharing fail closed?
- Is retention applied automatically?
- Are permissions group-derived and deprovisioned on leave?

**Evidence**
- Can you produce an access log for one document over one month, and how long does it take?
- Can you demonstrate that a deletion reached the search index and backups?
- When did you last test a restore?

**Response**
- Who detects a breach, and within what window?
- Can you enumerate affected data subjects from your own logs?

If several of those are unanswerable, the honest position is that the platform is in a pilot rather than in production.

## Where a self-hosted suite fits

The [AI agents checklist](/blog/ai-agents-in-documents-security) covers the inference path in more detail, and [ISO 27001 and document management](/blog/iso27001-document-management) covers the control framework that most of this maps onto.

The general shape: if your driver is an obligation about where personal data is processed or who can access it, the architectural questions come before any feature comparison. Our [self-hosted office suite comparison](/blog/self-hosted-office-suite-comparison) is the framework for that evaluation.
