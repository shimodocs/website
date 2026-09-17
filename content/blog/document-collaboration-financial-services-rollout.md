---
title: "Rolling Out Document Collaboration Across a Bank"
seoTitle: "Document Rollout for Financial Firms | ShimoDocs"
description: "A big-bang cutover is not available in a regulated firm. How to sequence document platform waves so each one produces evidence the next can reuse."
layout: feature
category: industry
date: 2026-09-17
updated: 2026-09-17
tags: [financial services, rollout, change management, compliance]
keywords: "document collaboration rollout financial services, regulated firm document platform, business unit migration waves"
---

A regulated firm does not switch a document platform on. The suite runs inside your own Kubernetes cluster, single-node or high-availability, and every group that touches it sits inside a change process, a records schedule and an examination cycle.

That changes the rollout more than it changes the product. The generic version of the work — pick a team, train them on real documents, retire the old tool — is in [a 30-day plan for rolling out a document platform](/blog/document-platform-adoption-plan). This article is about what changes when the organisation is a bank, an insurer or a broker-dealer, and the rollout has to survive being looked at afterwards.

The controls an examiner asks about are a separate problem, covered in [secure document collaboration for financial services](/blog/secure-document-collaboration-financial-services). This is the delivery problem: getting the platform in, business unit by business unit, without losing the ability to say who could read what.

## Why there is no big-bang cutover

Three constraints close the option before anyone argues about it.

**Exam readiness.** A cutover is a period during which access is being rebuilt. Examinations and records requests do not schedule around that period. If someone asks who could read a specific file on a date two weeks ago, "we were migrating" is not an answer, and by then the old system may already be read-only. Every record class needs a stated move date and the access position on both sides of it.

**Change control.** A firm-wide cutover is one change record with an unbounded blast radius and a rollback nobody can rehearse. You cannot un-migrate a week of work that people did in the new tool. The change board will not approve that, and it should not. A wave per business unit is a change with a window, an owner and exit criteria, which is something the board can approve and something you can be held to.

**Records obligations.** The old repository usually holds records under a retention rule, and at any moment it holds live legal holds. You cannot decommission it until every retained class has a destination with a rule at least as long, and every hold has been mapped to something that will still exist afterwards. That work is measured in months.

So the unit of the rollout is a business unit, not a feature. Each wave carries its own change record, its own evidence and its own exit criteria, and each one is expected to leave behind something the next wave reuses rather than re-decides.

## The pilot has to be a real process, with a witness

Do not pilot with the friendliest team. A friendly team produces an agreeable report and no evidence, and the report is not what wave two needs.

Pick one process that already has an audience outside the project: a committee pack, a client deliverable, a supervision log, a report that internal audit or the regulator already reads. The process must be real enough that the team cannot quietly work around the platform when it gets difficult. If they can, they will, and the pilot will report success while the work stays where it was.

Then name the witness before the first day — internal audit, risk, or the compliance officer who owns the process. Their job is to test one claim at the end: this document was produced here, here is who could read it, and here is what changed since version one. If the only people watching are the project team, the pilot proves nothing the steering committee can carry into wave two.

Keep the pilot off the firm's most critical process. A pilot should be able to fail on a Tuesday without that failure being a firm-level event.

## Decide four things before the first migration

```keypoints
title: The four decisions wave one must not inherit from wave two
- **Retention classes.** Which document classes are records, for how long, and which system is the retention system of record for each. A class whose system of record is not the platform should stay out of the migration rather than arrive without a rule.
- **Who may approve an external share.** A named role, per class, with a stated maximum duration. "The business decides" is not an approval route; it is the absence of one.
- **What must never leave the boundary.** The classes that may not be shared externally at all, and the destinations that are out of bounds regardless of class. Self-hosting puts the boundary on infrastructure you own, so the boundary is yours to draw and to describe.
- **Who owns the audit trail.** Who exports it, how often, where the export is stored, and for how long. The built-in operation log is not a system of record and should not be described as one.
```

The second and the fourth are where firms lose time later. The operations platform's operation log records administrative operations — configuration updates, version upgrades, service restarts, user management actions — each with the operating user, the object and the time, and the page itself is read-only. Read the retention note before promising it to anyone: the documentation states that logs record only operations the system audited and may be affected by environment retention policies. That makes it an administrative record, not a per-document access report. If the examination question is "who could read this document in March", settle your answer now, and expect the answer to involve an export on a schedule and a person's name. Writing the rule itself is a separate exercise; [the document retention policy guide](/blog/document-retention-policy-guide) covers how to set durations you can defend.

There is also a boundary fact to agree early. The platform does not reach into Google Workspace, SharePoint, Confluence or Notion and pull content across. Migration is an export and import exercise, and [the migration hub](/migration) covers the phases and formats. A wave plan that assumes live sync stops at the first class with no export.

## Sequence the waves so evidence compounds

```figure
type: timeline
title: The rollout, wave by wave
items: Wave 0: one process, one witness | Wave 1: the first business unit | Wave 2: the unit that shares its work | Wave 3: back office, highest volume | Wave 4: client-facing desks, if at all
detail: A process an auditor already sees, with evidence the team produced itself. | Retention classes and share approvals settle here, not in a policy document. | Reuses the retention map and approval route instead of re-deciding both. | Low variety, high volume. Tests the support ratio before client-facing units. | The desks whose tools will not move. Exceptions get owners and expiry dates.
caption: Figure 1. Each wave is chosen so its output is the next wave's input. A wave that produces no reusable artifact has cost you the wave without buying the next one.
```

Three artifacts are what compound: the retention map, the approval route for an external share, and the exception list.

- **Wave 1, one business unit.** The first real unit works from the pilot's decisions and returns a retention map covering its own classes, plus a support ratio you can budget from.
- **Wave 2, the unit that shares work with wave 1.** Choose adjacency deliberately. A unit that already exchanges documents with the first one inherits an access model instead of inventing one, and the change is visible to people who work together rather than announced to strangers.
- **Wave 3, back office and operations.** Low variety, high volume. This is where the support ratio and the training material get tested at scale, before a client-facing unit is exposed to either.
- **Wave 4, client-facing desks.** Last, because an external share that goes wrong here is a client event, not an internal one.

Sizing belongs at the wave boundary, not only at the start. Application nodes are estimated from user count — the documented formula is users × 0.03 ÷ 160, roughly one node per 5,300 users, rounded up with headroom — and the middleware baseline steps at 3,000 users, with application and middleware deployed separately from 10,000. Moving one 4,000-person division is a different infrastructure conversation from moving three units of a thousand, and the wave plan is what makes that visible before it becomes a surprise.

## What the rollout does to the people doing it

```figure
type: bars
title: Where rollout effort actually goes
items: Pre-migration decisions | Training on real documents | Champion and owner hours | Evidence per wave | Exception handling
value: 30 | 26 | 20 | 14 | 10
detail: Retention classes, share approval, the boundary, audit ownership | An hour inside the unit's own file set, not a feature tour | Two to four hours a week per champion, agreed with their manager | The access and change record each wave has to produce | Named desks with owners, expiry dates and a monthly review
caption: Figure 2. Relative share of rollout effort, not measured hours. The two largest rows are both work completed before a user opens the platform, which is not how these programmes are usually staffed.
```

Effort does not go where the plan normally budgets it, and champion time is a cost rather than a volunteer gesture.

- **A champion per unit, with hours.** Two to four hours a week for the first month, agreed with their manager before the wave starts. The champion answers "where does this go", sits with people while they do real work, and reports what keeps breaking. An unpaid volunteer with a day job is not a champion; they are the only active user by week three.
- **Training on the unit's own documents.** One session, under an hour, four tasks by hand: create a document, share it internally, share it externally through the approved route, find last week's version. A feature tour teaches the features. It does not teach where this unit's work goes.
- **One named owner per business unit.** The name on the wave. They own the roster, the exit criteria and the exception list, and they are the person the steering committee asks when the numbers move the wrong way.
- **Account operations, rehearsed before you need them.** Accounts are managed per tenant in the operations platform, where users are listed with role and status and can be enabled or disabled in bulk. The mover and leaver path is therefore routine, and it is also the operation you will run under pressure mid-wave. Rehearse it in wave one, when nobody is watching, not in wave four when somebody is.

## What the steering committee should look at, and what no rollout fixes

Do not put logins in the pack. Logins measure provisioning and the security review, not adoption.

- **Documents created inside the platform, by unit, weekly.** The only early number that says the work moved. A burst that decays means the burst was testing.
- **Documents edited by more than one person.** A single-author document is a file share with a new address.
- **Documents shared externally, and the approval route used.** If the count is zero, either the unit has no external counterparties or the route is too slow to use. Find out which.
- **Access requests for the old tool.** People ask for what they intend to use. A count that climbs is a stalled wave with a delay on it.
- **Search failures, collected weekly.** Treat them as the folder backlog. Ask every Friday what could not be found.

Then the parts a rollout does not fix.

**Some desks will not move.** A desk whose work runs in a blotter, a settlement system or a pricing model reads and writes there, and no amount of training changes that. The right output is a named exception with an owner, a reason and an expiry date, reviewed monthly. An exception nobody reviews is the second system you were trying to retire.

**A good pilot can still be followed by a stalled wave two.** This is the most common way these programmes lose a year. Wave one succeeded because the project team carried it personally, and nothing reusable came out of it. Wave two then re-argues retention, rewrites the training, and lands on a unit receiving a third of the attention. If wave one produced no artifacts, do not start wave two; go back and produce them.

**Self-hosting is not the compliance answer.** It converts vendor assurances into evidence you own, and it puts you inside the control environment. Availability of a system holding regulated records, restore testing, retention, deletion and the operational team itself all become examinable. Firms that treat deployment as the finish line are the ones surprised in the next cycle.

If you need one platform holding the whole firm by the end of the quarter, this is not the plan to run. Business-unit waves, each producing evidence the next one reuses, is a slower shape — and it is the one that survives an examination.
