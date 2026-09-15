---
title: "Access Control for Document Platforms"
seoTitle: "Access Control for Document Platforms | ShimoDocs"
description: "Least privilege, group-derived roles and access reviews: the access control practices that hold up in a document platform audit."
layout: standard
category: security
date: 2026-03-16
tags: [access control, least privilege, identity, audit]
keywords: "document access control, least privilege documents, access review document platform"
---

Access control is the control that appears in every audit and fails most often. Not because the product lacks features, but because permissions accumulate faster than anyone reviews them, and because the failure mode — someone who left six months ago can still open client documents — is invisible until it is tested.

This is what good looks like in a document platform, and where it usually breaks.

## Least privilege, practically

The principle is that access is granted for a purpose and removed when the purpose ends. Applying it to a document repository runs into an immediate problem: content is heterogeneous and unclassified, so nobody can say what level of access is appropriate.

The workaround is to classify repositories first. Even three tiers change the problem from unanswerable to scoped. Our [retention policy guide](/blog/document-retention-policy-guide) covers the same classification step from a different angle, and both depend on it.

Once tiers exist, access follows a shape:

| Content tier | Who should have access | Default posture |
| --- | --- | --- |
| Published and general | Everyone in the organisation | Open within the directory |
| Team working material | Team members, plus explicit grants | Closed, membership-driven |
| Confidential | Named roles, per repository | Closed, reviewed quarterly |
| Regulated records | Named roles, system-enforced | Closed, reviewed and logged |

The important property is that access is **membership-derived**, not granted per file. Per-file permissions are how a repository becomes unreviewable.

## Group-derived roles

This is the single highest-leverage configuration decision.

```figure
type: flow
title: Identity lifecycle, and where permissions are decided
items: Directory account created | Group membership assigned | Role inherited in the platform | Group changes on transfer | Account disabled
detail: The authoritative event, in your directory, not the platform | By the team that owns the person's role, not by IT per request | No manual grant: the repository follows the group | Access moves with the person, without a ticket | All access revoked at once, with no second step
caption: Figure 1. If any arrow in this chain is manual, that manual step is the one that gets skipped. Departures are the ones that get skipped most.
```

The failure mode is specific and common: users are provisioned from the directory, but permissions are not. Every join, transfer and departure becomes a manual task, and the tasks that matter most — revocations — are the ones nobody notices missing.

What to require:

- **Group-to-role mapping** in the platform, so directory groups determine repository roles.
- **No per-user local accounts** beyond a documented break-glass administrator.
- **Deprovisioning that follows directory state**, with no second manual step.
- **Nested groups resolved**, so a person moved into a sub-team inherits correctly.

Test it as a lifecycle, not as a configuration: create a user, grant via group, change the group, disable the account, and confirm access disappears at each stage.

## Joiners, movers, leavers

The three events that audits sample.

**Joiners.** Access should exist on day one, from the group, with no manual provisioning. If onboarding requires a ticket, the ticket is a control that will be skipped under pressure.

**Movers.** The dangerous one. A transfer usually adds access and rarely removes the old access, so people accumulate permissions over years. The mitigation is that access derives from group membership and groups are reviewed, so a transfer changes the group and the access follows.

**Leavers.** Removal on the day, verified. This is the finding that appears most in audits of document platforms, because the platform was never wired into the offboarding process.

A practical check: sample ten people who left in the last year and confirm their access is gone. If that takes more than an hour, the process is not working.

## Deciding the role model

Before configuring anything, decide how many distinct roles the organisation actually needs. The temptation is a role per team; the result is dozens of roles nobody can review.

A model that holds up:

**Three or four content roles.** Reader, contributor, reviewer, administrator. These describe what a person can do to content, not who they are.

**Repository membership as the scope.** Who belongs to which repository is the access decision, and it derives from the team structure already recorded in the directory.

**A small number of functional exceptions.** Some roles genuinely do not fit — an external auditor needs read access across many repositories for a short period. Handle those as time-limited grants recorded with a reason, not as permanent roles.

**Administration separated from content access.** A platform administrator can usually reach everything. That is inherent, and it means administration should be a small, reviewed, logged population rather than a convenience granted to team leads.

The two failure modes at either extreme are worth recognising. Too few roles produces a proliferation of per-file exceptions, which are unreviewable. Too many roles produces a role catalogue nobody understands, which is also unreviewable. The workable middle is small enough to describe in a paragraph and expressive enough that exceptions are rare.

A useful test: can you draw the whole model on one slide and have a new team lead understand it in a minute? If not, it will not be applied correctly, and an unapplied model is worse than a rough one.

## Privileged access

Two distinct concerns.

**Administrators can read everything.** A platform administrator can usually access any document. That is inherent to administration and needs compensating controls: access reviews for the admin role, logging of administrative access, and a small population holding it.

**Break-glass accounts.** You need at least one account that works when the directory is unavailable. It should be documented, its credentials held somewhere appropriate, and its use alerted on. An undocumented local admin account is a finding; a documented one is a control.

## Access reviews

The evidence that someone examined access and confirmed or corrected it.

Three properties make a review useful:

**Generated from the system.** A review compiled by hand from memory is not evidence of anything.

**Owned by the content owner.** The team that owns the repository reviews who can reach it, not central IT, who cannot judge appropriateness.

**Actioned.** Reviews that only record "reviewed, no changes" for every row across years suggest nobody looked.

Quarterly for confidential repositories is a common cadence; annually for the rest is usually acceptable and should be stated in policy.

```figure
type: matrix
title: Where access decisions should be made
items: Directory group membership | Repository role | Per-file permission | Local platform account
detail: The right place. Owned by the team that knows the person's role, changed on transfer, revoked on departure. | Correct layer for scope: what a group can do in a given repository. Small enough to review. | Works around the model. Fine for a genuine one-off, a liability as a habit. | Should be limited to break-glass. Any others bypass the directory and are missed on departure.
xAxis: REVIEWABLE AT SCALE
xAxisEnd: UNREVIEWABLE IN PRACTICE
caption: Figure 2. Every access decision pushed to the right-hand columns makes the quarterly review longer, and reviews that take too long stop happening.
```

## External and guest access

Guest access deserves its own policy, because it is where least privilege is most often abandoned.

- **Expiry by default.** A guest account without an end date becomes permanent.
- **Scoped to a repository**, not to the organisation.
- **Named individuals**, not shared credentials.
- **Reviewed more frequently** than internal access, because the relationship is more likely to have ended.

Our [external sharing risks](/blog/external-sharing-risks-documents) covers the link-sharing side of this, which is a different mechanism with different exposure.

## What this means for self-hosted deployments

Self-hosting does not change the access control model, but it does put the integration work in your hands. Vendors who manage identity for you have already built the group mapping; in a self-hosted deployment you configure it.

That is usually a day of work and worth doing before onboarding content, because retrofitting permissions across an existing repository is the expensive path — as covered in our [migration walkthrough](/blog/how-to-migrate-from-google-workspace).

The compensating benefit is that the audit trail is yours. Producing an access report for a specific document and period, from systems you operate, is straightforward once logging is configured — and it is the evidence [SOC 2](/blog/soc2-document-collaboration-controls) and [ISO 27001](/blog/iso27001-document-management) reviews ask for.
