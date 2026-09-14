---
title: "Legal Hold in Document Platforms"
seoTitle: "Legal Hold in Document Platforms | ShimoDocs"
description: "What a legal hold requires from a document platform: preservation that survives user deletion, custodian scoping, audit and release."
layout: feature
category: security
date: 2026-03-13
tags: [legal hold, preservation, litigation, records]
keywords: "legal hold document management, litigation hold, preservation obligation documents"
---

A legal hold is the moment a retention policy stops mattering and a different rule takes over. Content that was scheduled for destruction must be preserved, and the platform has to be capable of enforcing that against the normal behaviour of the system — including users deleting things.

Most document platforms handle the policy. Fewer handle the hold, and the gap is where organisations get into difficulty.

> This article describes preservation obligations in general terms. It is not legal advice. Trigger, scope and duration are determinations for your counsel.

## What triggers a hold

The duty to preserve arises when litigation or an investigation is reasonably anticipated — not when a complaint is filed. In US federal civil practice that standard is well established, and the sanctions exposure for failing to preserve electronically stored information is explicit in the rules governing that evidence.

The practical consequence is uncomfortable: the obligation often attaches before anyone in IT knows a matter exists.

That makes two things important.

**A documented trigger.** Who decides a hold is needed, and how does that decision reach the platform? If the answer is "legal emails IT", the process works until it does not.

**Reversibility of routine destruction.** Automatic retention is good practice and dangerous if it cannot be stopped promptly for a specific scope. The delay between "hold issued" and "destruction suspended" is a real risk window.

## The lifecycle

```figure
type: timeline
title: The hold lifecycle, and where platforms fail
items: Trigger and assessment | Scope definition | Custodian notification | Preservation enforced | Release
detail: Counsel determines a duty to preserve. Often before IT is aware a matter exists. | Which custodians, which repositories, which date range. Over-scoping is expensive; under-scoping is worse. | Custodians acknowledge the hold in writing. The acknowledgement is itself evidence. | The platform must preserve against deletion, retention rules and user action, and log access. | The matter closes, the hold is lifted, and normal retention resumes from that point.
caption: Figure 1. Steps four and five are software problems. Steps one to three are process, and a platform that only automates step four leaves the risk window open.
```

## What the platform has to do

Six capabilities, in rough order of how often they are missing.

**Preservation that survives user deletion.** A user deleting a held document must not destroy it, and the user should not necessarily be told that the deletion was ineffective. This is the baseline capability and the one that cannot be worked around manually.

**Hold precedence over retention.** A record under hold must be excluded from automatic disposal without anyone remembering to exclude it. Platforms where retention and hold are separate features, configured separately, fail this routinely.

**Scoping by custodian and matter.** A hold is not global. It covers specific people, repositories and date ranges, and it needs to be adjustable as a matter evolves — expanding scope is common, narrowing is rarer.

**An audit trail of preservation.** What was placed on hold, when, by whom, and who accessed it afterwards. Access logging matters because preservation without confidentiality is only half the obligation.

**Release with a clear resume point.** On release, normal retention resumes. The question is whether the clock restart at release or whether the record is treated as though it had been ageing normally. Decide explicitly, because both are defensible and the wrong one for your policy is a finding.

**Export that preserves context.** Producing held content for review needs to carry metadata, threading and version history, not just files.

## Where self-hosting changes the analysis

Hosted platforms present a hold as a feature configuration. Self-hosted platforms present it as something you operate.

| Capability | Hosted | Self-hosted |
| --- | --- | --- |
| Preservation enforcement | Vendor feature | Platform feature you configure |
| Access logging | Vendor tooling | Your logging stack |
| Retention and hold interaction | Vendor's implementation | Your configuration, and your problem if wrong |
| Data subject deletion requests | Vendor tooling | Must be reconciled with holds manually |
| Export for review | Vendor export | Your export process |

The last row is where self-hosted deployments often improvise. Producing a defensible export from a self-hosted platform is a process you should design before the first matter, not during it.

There is one genuine advantage: a self-hosted deployment has no third party who could delete content on their own schedule, and no dependency on a vendor's litigation support arrangements.

## Over-scoping and under-scoping

Both directions are costly, and they fail differently.

**Under-scoping** is the dangerous one. A hold that misses a custodian, a repository or a date range leaves content being destroyed while a duty to preserve applies. Nobody notices until the material is requested and turns out to be gone.

The common causes are mundane: a custodian known by a former name, a repository created after the hold was placed, a personal workspace nobody thought to include, or a date range that ended a day too early given a documented conversation.

Practical mitigations:

- **Drive custodian lists from the directory**, including aliases and historical accounts, rather than from a manually typed list.
- **Re-run the scope at intervals.** A hold placed at the start of a matter is usually too narrow by month three.
- **Include personal workspaces and chat exports**, which are consistently forgotten.
- **Pad the date range.** There is no penalty for preserving content slightly outside the relevant window, and there is a substantial one for missing it.

**Over-scoping** is expensive and safer. It increases review volume, storage cost and the number of people whose routine work is affected — and each affected person is a chance that the hold process is worked around.

The balance is a judgement for counsel. The engineering contribution is making scope changes cheap: expanding a hold should be a configuration change that takes minutes, not a project.

Whichever direction you err, the platform requirement is the same: scope has to be expressible as rules, adjustable without rebuilding the deployment, and auditable so you can show what was covered on a given date.

```figure
type: compare
title: How each scoping error fails
left: Under-scoped hold
right: Over-scoped hold
leftItems: Content is destroyed while a duty applies | Discovered only when material is requested | Exposure is sanctions and adverse inference | Cause is usually a forgotten repository or name variant
rightItems: Review volume and cost increase sharply | More people affected, more chances to work around it | Storage and processing costs grow | Cause is usually a cautious default nobody revisits
caption: Figure 2. Both are corrected the same way: by making scope a rule the platform applies and can re-evaluate, rather than a list maintained by hand.
```

## Reconciliation with deletion requests

A subject access or erasure request arriving during a hold creates a direct conflict: the obligation to erase against the obligation to preserve.

The resolution is not technical. Preservation generally prevails for content relevant to the matter, and the request is answered with that explanation rather than with a deletion. What matters practically is that the platform can identify which content is under hold quickly, so the request can be answered accurately rather than conservatively — a blanket refusal because nobody can tell what is held is a poor outcome.

## Implementing holds before you need them

1. **Write the trigger process.** Who decides, who is notified, in what timeframe.
2. **Configure retention with hold precedence and test it.** Place a hold, confirm the record survives its retention date, release, confirm the behaviour afterwards.
3. **Build the custodian list mechanism.** It should come from your directory, not from a spreadsheet.
4. **Design the export path** and test it once, on a small synthetic set.
5. **Log hold activity separately** from ordinary access logs, with its own retention.
6. **Rehearse a matter.** A tabletop exercise with counsel, records and IT will surface more problems than any configuration review.

## Relationship to retention

Holds only make sense against a retention schedule. If nothing is ever destroyed, every record is effectively held, and the hold loses meaning as a control. Our [retention policy guide](/blog/document-retention-policy-guide) covers building the schedule that holds operate against, and [access control best practices](/blog/access-control-best-practices-documents) covers who should be able to place and release one.

For the framework this maps onto, see [ISO 27001 and document management](/blog/iso27001-document-management) and, for regulated financial records specifically, [document collaboration for financial services](/blog/secure-document-collaboration-financial-services).
