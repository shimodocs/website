---
title: "SOC 2 Controls for Document Collaboration"
seoTitle: "SOC 2 for Document Collaboration | ShimoDocs"
description: "What SOC 2 means for a document platform, why self-hosting moves the service organisation boundary, and which controls actually matter."
layout: briefing
category: security
date: 2026-03-04
tags: [soc2, compliance, audit, controls]
keywords: "soc 2 document collaboration, soc 2 controls, service organization document platform"
---

SOC 2 gets treated as a vendor badge. It is not one. It is an auditor's opinion about a specific organisation's controls over a specific system, covering a specific period — and once you self-host, the organisation being examined is yours.

That single fact reframes most SOC 2 conversations about document platforms.

> This article describes SOC 2 in general terms. It is not audit or legal advice. Your auditor determines scope and applicability.

## What a SOC 2 report actually is

The AICPA Trust Services Criteria define the control areas. A SOC 2 engagement produces a report in which an independent auditor expresses an opinion on whether the service organisation's controls meet those criteria, over a defined scope and period.

Two things follow that people miss:

**It is about controls, not features.** A product cannot be SOC 2 compliant. The organisation operating it can have controls that satisfy the criteria.

**It has a boundary.** The report describes a system. Content and processes outside that boundary are not covered, no matter how the badge is displayed.

## The five criteria, and which apply

Security is always in scope. The other four are optional and depend on what the service does.

```figure
type: matrix
title: Trust Services Criteria, and what a document platform contributes
items: Security | Availability | Confidentiality | Processing integrity | Privacy
detail: Mandatory. Access control, change management, monitoring, incident response, risk assessment. The bulk of any document platform report. | Uptime commitments, capacity, backup and recovery, tested restore. Mostly operational. | Classification, retention, disposal and protection of confidential content. Closest to the document problem. | Completeness and accuracy of processing. Rarely in scope for a collaboration tool, relevant if it computes something. | Personal data handling: notice, choice, retention, subject access. Overlaps with GDPR duties.
xAxis: ALWAYS IN SCOPE
xAxisEnd: SCOPE DEPENDS ON THE SERVICE
caption: Figure 1. A hosted document vendor will typically report on Security plus Availability and Confidentiality. The last two are usually excluded, and that exclusion is worth reading.
```

## The boundary problem when you self-host

This is the part that surprises teams.

| Deployment | Who is the service organisation | Whose SOC 2 report covers the content |
| --- | --- | --- |
| Vendor-hosted suite | The vendor | The vendor's |
| Self-hosted, you operate it | **You** | Yours — the vendor's report does not |
| Self-hosted, vendor-managed operations | Depends on the contract | Negotiated, and rarely the simple answer |

A vendor's SOC 2 report is evidence about their hosted service. It is not evidence about your deployment, because they do not operate it.

That is not an argument against self-hosting. It is an argument for understanding what you are taking on. In a self-hosted model, the controls that were the vendor's responsibility become yours: change management for upgrades, monitoring, incident response, backup restoration, access review, and the evidence for all of them.

The compensation is that you also control the evidence directly instead of relying on someone else's report.

## The controls that actually get tested

Across document platform audits, the same areas produce findings.

### Access provisioning and deprovisioning

Tested by sampling joiners, movers and leavers, then checking that access matched the role and was removed on the right date. Document platforms fail this when users are provisioned from the directory but permissions are set per file.

The fix is structural: group-derived roles, no per-user local accounts beyond a break-glass administrator, and deprovisioning that follows directory state automatically. Our [access control guide](/blog/access-control-best-practices-documents) covers the detail.

### Access reviews

Periodic evidence that someone examined who can access what and confirmed or revoked it. Sampling looks for the review, the outcome and the date.

A platform that can generate the report is much cheaper to audit than one that requires manual compilation.

### Change management

Evidence that changes to the system were authorised, tested and approved. If you self-host, this is your change process applied to every upgrade — including the vendor's releases. A platform with a staged upgrade path makes this tractable.

### Backup and recovery

Not the schedule. The tested restore, with a date and a result. This is the control most often evidenced weakly, because testing is disruptive and gets deferred.

### Incident response

Evidence that incidents were detected, assessed, contained and reviewed. For a self-hosted deployment you also need detection, which is a capability rather than a document.

### Encryption and key management

In transit and at rest, plus the process for managing keys and rotating them. If you hold your own keys, the procedure matters more, not less — see [document encryption and key custody](/blog/byo-key-encryption-documents).

## Type I against Type II

The distinction matters when you are reading a report rather than commissioning one.

```figure
type: timeline
title: How the two report types differ
items: Type I — design at a point in time | Type II — operating effectiveness over a period | The observation window | The bridge letter
detail: The auditor opines that controls are suitably designed as of a single date. Faster and cheaper, weaker evidence. | The auditor tests whether controls actually operated, across a window typically between three and twelve months. | A Type II over three months says less than one over twelve, and the report states the window plainly. | Issued when a report period ends, covering the gap to the current date. Ask for it; a report without one may be stale.
caption: Figure 2. When someone sends you a SOC 2 report, the first things to read are the system description, the period and the complementary user entity controls.
```

The **complementary user entity controls** section is the one most often skipped. It lists the controls the auditor assumed the customer would operate — which is often where access review, data classification and retention obligations land. Those are yours regardless of deployment model, and they are frequently the reason a "SOC 2 compliant vendor" does not make an organisation compliant.

## The evidence pack you will actually need

Audits are lost on missing evidence rather than missing controls. Teams often have the control working and cannot produce the artefact that proves it operated on a date.

For a document platform, this is the pack to maintain continuously rather than assemble during fieldwork.

**Access evidence.** A report, generated from the platform, listing who can access each confidential repository as of a date. Plus a sample of joiner, mover and leaver tests showing access matched the role.

**Review evidence.** The access reviews themselves, with the reviewer named, the date, and the changes made. A review with no changes ever recorded reads as a review nobody performed.

**Change evidence.** For every platform upgrade: the approval, the test result, and the date it went to production. A staged upgrade path exists precisely so this is producible.

**Restore evidence.** The date of the last restore test, what was restored, how long it took, and the result. Backup job completion is not evidence of restorability.

**Incident evidence.** Detection time, assessment, containment, resolution and the review. For a self-hosted deployment, this includes demonstrating that detection exists at all.

**Configuration evidence.** Proof that the defaults are what the policy says — external sharing disabled, retention rules active, logging enabled. Configuration drifts, so this needs a cadence rather than a one-off screenshot.

The practical test is uncomfortable but useful: pick one control at random and try to produce its evidence in under an hour. Where you cannot, the gap is an evidence problem you can fix before an auditor finds it.

There is a second-order benefit. A platform that produces these artefacts natively makes the pack cheap to maintain, and that is a more honest reason to prefer it than a badge on a marketing page.

## What to ask a document platform vendor

1. **Is the report Type I or Type II, and what period does it cover?**
2. **What is the system boundary**, in plain terms — does it include the storage layer, the search index and the AI inference path?
3. **Which criteria are in scope**, and what was excluded?
4. **What complementary user entity controls are listed?** Map each to an owner in your organisation.
5. **If we self-host, what does your report still cover?** Expect a narrow answer.
6. **Which of our controls does a self-hosted deployment add?** Then decide whether you can operate them.

## Where this lands

For a vendor-hosted suite, a SOC 2 Type II report with a current period and a clear boundary is a reasonable input to your supplier assessment.

For a self-hosted suite, the more useful question is whether the platform makes your own controls cheaper to operate and easier to evidence. That is what our [self-hosted office suite comparison](/blog/self-hosted-office-suite-comparison) framework tests for, and it is closer to what an auditor will actually examine.

If your driver is a regulatory obligation rather than a customer questionnaire, [GDPR document collaboration requirements](/blog/gdpr-compliant-document-collaboration) and [HIPAA document collaboration](/blog/hipaa-compliant-document-collaboration) cover the equivalent analysis for those regimes.
