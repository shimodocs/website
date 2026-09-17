---
title: "Upgrading a Document Platform Without Downtime Drama"
seoTitle: "Upgrading a Document Platform Safely | ShimoDocs"
description: "Why upgrades are the highest-risk routine operation in a self-hosted document platform, and how to stage and roll back without drama."
layout: standard
category: self-hosting
date: 2026-04-01
updated: 2026-09-17
tags: [upgrades, change management, rollback, operations]
keywords: "document platform upgrade, self hosted collaboration upgrade rollback, change management document platform"
---

Installing a platform is a project. Operating it is a series of upgrades, and upgrades are where self-hosted deployments accumulate risk — not because the software is fragile, but because an upgrade touches every layer at once and is usually scheduled against a business deadline rather than a technical one.

This is how to make an upgrade a routine operation.

## Why upgrades carry the risk

A deployment that runs for a year untouched is not stable; it is accumulating debt. When the upgrade eventually happens, it carries a year of accumulated schema migrations, configuration changes and dependency updates in a single step.

The opposite approach — upgrading regularly — is genuinely lower risk, and it is worth understanding why. Each upgrade then contains a small delta, the release notes are short enough to read properly, and a rollback reverses one step rather than twelve.

Three properties make an upgrade risky:

**Schema migrations.** Usually forward-only. A migration that has run cannot simply be undone, which limits rollback to restoring the pre-upgrade backup.

**Stateful components.** The database holds the source of truth, so the upgrade has to be coherent across the database and the application tier.

**Configuration drift.** The running configuration may have diverged from the documented one over months of small changes, and the upgrade assumes the documented one.

## The pipeline

A staged pipeline turns an upgrade from an event into a procedure.

```figure
type: flow
title: An upgrade pipeline that catches problems early
items: Read the release notes | Upgrade staging | Run the checklist | Rehearse rollback | Schedule production
detail: Look specifically for migration steps, configuration changes and anything marked as breaking. This step is where most incidents are prevented. | On a copy of production data, not an empty database. Migrations behave differently against real data volume. | Open, edit, save, search, list, sign in, and check the version history of a known document. | Before you need it. Knowing whether rollback means a restore or a downgrade changes the risk assessment entirely. | With a window and a rollback decision point, not "after hours sometime".
caption: Figure 1. Step two is the one teams skip, and it is the one that reproduces the migration problems that only appear at production data volumes.
```

Upgrading staging against production-sized data is the single highest-value step. A migration that completes instantly against an empty database can take hours against a real one, and that difference is not discoverable any other way.

## Reading release notes properly

Most upgrade incidents are foreseeable from the release notes and simply were not read carefully.

What to look for:

**Schema or data migrations**, especially ones that rewrite large tables. These determine the maintenance window length far more than the application binary does.

**Configuration changes**, particularly defaults that change. A new default for external sharing or session lifetime is a security change delivered as a version bump.

**Deprecations.** A feature marked deprecated in this release is usually removed in the next one, which turns a deferred upgrade into a forced migration later.

**Minimum versions of dependencies.** A jump in the required database or coordination service version is an infrastructure change disguised as an application upgrade.

**Known issues.** Vendors document them, and knowing about them in advance converts an incident into a known condition.

A useful habit is to record, at each upgrade, what the release notes implied would happen and what actually happened. Over a year, that record tells you how much scrutiny a given vendor's releases merit.

## Rolling back

The honest answer for most document platforms is that rollback is not symmetric. Downgrading an application against a migrated schema usually does not work, which means rollback is a restore.

That changes the risk calculation, and it should change the plan:

**Take a backup immediately before the upgrade**, verify it completed, and verify the restore path is available. This is the real rollback mechanism.

**Know the restore duration.** It is the true rollback time, not the time the upgrade takes. If a restore takes four hours, the upgrade has a four-hour worst case regardless of how fast the new version installs.

**Hold a decision point.** A named time at which someone decides to continue or roll back, rather than an open-ended assessment.

**Keep the previous release artefacts.** Rolling back is faster and safer if the previous version is already available rather than downloaded during an incident.

```callout
tone: tip
title: Rehearse a full restore, not a database-only one
Time the rehearsal end to end, and include the object storage restore to the same point. A restore that stops at the database measures the shorter half of the job, and the number it produces is the one people put in the change record.
```

```figure
type: matrix
title: Which changes are reversible
items: Application binary | Configuration change | Additive schema migration | Destructive schema migration
detail: Reversible in minutes. Keep the previous artefacts and the rollback is a redeploy. | Reversible if the previous values were recorded. Take a configuration snapshot before changing anything. | Often reversible, since new columns rarely break the old application. Verify rather than assume. | Not reversible without a restore. A dropped column or a rewritten table is a one-way door.
xAxis: REVERSIBLE IN PLACE
xAxisEnd: REQUIRES A RESTORE
caption: Figure 2. The bottom-right cell is what makes a pre-upgrade backup mandatory rather than prudent.
```

## The maintenance window question

Whether an upgrade needs a window depends on the platform's architecture rather than on preference.

Application-tier components that are stateless can usually be rolled one node at a time, with users experiencing brief reconnections rather than an outage. The database is the component that determines whether a genuine window is required, because a migration takes it out of service.

Three approaches, in increasing order of complexity:

**A stated window.** Simplest to plan and to communicate. Choose a low-traffic period based on observed data rather than convention, and tell users what to expect.

**Rolling application upgrade with a database window.** Most of the platform stays available, with a short interruption while migrations run. This is the common pattern for a well-behaved platform.

**Zero-downtime migration.** Requires the migrations to be backwards-compatible and applied ahead of the code, which is a property of the release rather than of your deployment. If the vendor does not design for it, you cannot achieve it.

## Change control for constrained environments

If the deployment falls under a regulated regime, the upgrade process is also an evidence obligation. The questions an auditor asks are predictable:

- Who approved this change, and when?
- What testing was performed, and what was the result?
- What was the rollback plan, and was it validated?
- What was the actual outcome, and how long did it take?

Producing that evidence is cheap if the process is followed and expensive if it is reconstructed afterwards. Our [ISO 27001 article](/blog/iso27001-document-management) covers where this sits in a control framework, and [SOC 2](/blog/soc2-document-collaboration-controls) covers the equivalent set of criteria.

The practical implication is that the pipeline in Figure 1 should produce artefacts — a release note summary, a test result, a backup verification, a rollback decision record — rather than existing only as a conversation.

## Communicating an upgrade

The technical work of an upgrade is usually done well and the communication is usually done badly, which produces most of the complaints.

Three things users need, and the reason each matters:

**What will be unavailable, and when.** A specific window in the users' own time zone, not a server time zone. An upgrade announced as "02:00 UTC" generates support tickets from people who did the conversion wrong.

**What they should do beforehand.** Unsaved work, open documents and in-flight imports. A short, concrete instruction prevents the most common data loss complaint, which is a user losing an edit because the platform restarted underneath them.

**What changes for them.** If the upgrade alters sharing defaults, changes a menu, or adds a capability, say so before it appears. Users who discover a change mid-task assume something broke.

For a rolling upgrade with no downtime, telling users is still worthwhile. A brief reconnection during a meeting is less alarming when it was expected.

## After the upgrade

The post-upgrade checklist is short and frequently skipped, which is how subtle failures survive for weeks.

**Verify the user-visible actions** — open, edit, save, search, list, sign in — on the new version rather than trusting the upgrade's own success message.

**Check version history on a document edited before the upgrade.** Migrations that mishandle existing version records produce a document that opens correctly and has lost its history, and nobody notices until someone needs to compare versions.

**Confirm the identity integration.** Authentication usually works immediately, and group-membership refresh frequently does not.

**Confirm retention and hold behaviour.** If retention rules are configuration rather than data, a config change in the upgrade can alter them silently. Check that a document you expect to be past its retention date is still treated as such.

**Re-run the monitoring synthetic checks** and compare latency against the pre-upgrade baseline. A version that is functionally correct and materially slower is a finding.

**Record the outcome**, including the actual duration, anything that differed from the release notes, and anything that had to be worked around. That record is what makes the next upgrade easier.

## What to do this quarter

If upgrades have been deferred, do not attempt to jump several versions at once. Upgrade to the next release, verify, and repeat on a short cycle until current. Then stay current, because the value of the whole pipeline is proportional to how small each delta is.

For the components involved, [backup and restore](/blog/backup-and-restore-document-platform) covers the real rollback mechanism, [database tuning](/blog/database-tuning-document-collaboration) covers the migration-affected layer, and [monitoring](/blog/monitoring-self-hosted-document-platform) covers how you would know an upgrade had gone subtly wrong rather than obviously wrong.
