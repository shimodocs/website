---
title: "What a Self-Hosted Document Platform Costs to Run"
seoTitle: "Self-Hosted Document Platform Running Costs | ShimoDocs"
description: "The licence is the smallest recurring line. Where a self-hosted document platform spends money every month: storage, staff time, upgrade windows and recovery."
layout: standard
category: self-hosting
date: 2026-09-17
updated: 2026-09-17
tags: [operations, cost, self-hosted, infrastructure]
keywords: "self hosted document platform cost, document collaboration running costs, operations cost self hosted"
---

Everyone brings the per-user price to a self-hosting conversation. The licence answers that and nearly nothing else: for any deployment large enough to need the rest of this article, it is the smallest recurring line in the bill.

The larger lines arrive after go-live. Storage grows with version history rather than with headcount. Middleware needs a second and a third node before anyone asks it to. And somebody has to patch the platform, read its alerts, restore it, and answer the access request that arrives at 5pm on the day that person is on leave.

What follows is a cost model and the questions that fill it in. It contains no invented figures, because the two variables that decide everything — how often your teams edit documents, and how much of the surrounding stack you already run — are not knowable from outside your organisation.

## What the licence covers, and what it leaves with you

The licence gets you the software and the installer. If you take the bundled option, it will place MySQL, Redis, MongoDB, Kafka, Elasticsearch and MinIO for you. The deployment documentation is clear that these are starting specifications rather than a managed service: middleware baselines are published as two bands, under 3,000 users and 3,000 users and above, and the same guide recommends managed middleware services wherever they are available.

What no licence changes is where the operational work sits. The backup guide draws the boundary explicitly. The customer formulates and executes the backup strategy, keeps the media safe, manages retention, runs the recovery drills, approves the recovery and accepts the result. ShimoDocs provides technical guidance for recovery; it does not perform it. Where external middleware or self-built object storage is involved, the backup and recovery strategy is entirely the customer's.

Two items outside the licence are easy to miss. Object storage has to be reachable directly from the browser, because static resource loading and document read and write both complete over a direct connection between the client and the bucket. That path — endpoint, certificate, bandwidth — is yours to buy and to keep working. The storage itself has stated expectations: an average API response under 50 milliseconds internally and under 200 milliseconds over the public network, enough concurrency for editing bursts and batch import, and availability in the region of 99.9 per cent in production.

Here is the shape of what remains.

```figure
type: bars
title: Where the recurring effort and spend goes
items: Retained content and backups | Upgrade and patch windows | Restore drills | Monitoring and capacity | Access administration
value: 100 | 72 | 58 | 46 | 34
detail: Version history | A window and a rollback point | Confirmations before, verification after | Scheduled checks exist; judgement does not | Joins, moves and departures without group mapping
caption: Figure 1. The relative weight of the recurring lines, as a shape rather than a measurement. No vendor can tell you the split for your organisation; the ranking is stable, the proportions are not. The top line grows with every save, and the copy that makes a backup a backup doubles it.
```

## Infrastructure that grows on its own

Live documents are not the cost curve. Version history is. Every save creates a version, and the platform's own bucket list shows where the storage goes: file content in one bucket, file snapshots in another, worksheet history and service document history in others. History buckets grow with how often people edit, so a small team that edits one planning sheet all day can outgrow a larger team that writes documents once.

Backups multiply whatever that total is. The documented default for databases on built-in middleware is a system scheduled backup once a day with seven days of retention; customer-maintained middleware is expected to be backed up at least daily with retention of seven days or longer. Object storage business data is cold-backed or replicated according to business level, because that is where document attachments and file objects live. Configuration is backed up when it changes, and a restore without it is a different configuration with the old data attached.

One line in that guide is worth repeating to whoever owns the budget. Multiple copies held inside object storage are part of the cluster redundancy mechanism and are not equivalent to data backup. Redundancy protects you from a failed disk. It does not protect you from a deletion that replicates. If you want the second thing, you buy a copy the platform does not count as production, and it carries its own storage cost and monitoring.

The middleware tier grows on a schedule of its own, following headcount bands rather than your usage. Elasticsearch is specified with at least three nodes. Kafka is specified with at least three brokers and a replication factor of three. MySQL is specified with master-slave switch for high availability. None of that is optional if the platform is meant to survive a node failure, and each component carries its own patching and inspection checks. High availability is also a multiplier on the footprint: the system requirements offer a single server for a pilot and three or more for production.

Compute is the most predictable part of the bill. Application nodes are estimated as users multiplied by 0.03 and divided by 160, which the documentation simplifies to roughly one node per 5,300 users, each sized for about 160 QPS. Bandwidth is estimated at 0.25 Mbps per user, for public and internal access alike. If the servers are domestic CPU architecture, the same guide recommends estimating the entire resource picture at twice the standard specification.

If you are still choosing hardware, [the sizing guide](/blog/hardware-sizing-self-hosted-document-platform) covers what to buy before it matters. Procurement is the first line of a monthly bill, not the end of the project.

## The cost the licence comparison never contains

No quote contains a named person, and the platform does not run without one.

```keypoints
title: Four jobs that need an owner
- **Patching and upgrading.** Version currency, package validation, schema changes on major releases, and a rollback point someone has actually verified.
- **Reading the checks.** Storage growth, middleware headroom and concurrency peaks, reviewed after a change in how teams edit rather than on a calendar.
- **Running the restore drill.** Confirmations before, verification after, and the approval trail the backup guide asks you to record every time.
- **Answering the access request.** Joins, moves and departures are provisioning events. Without group-to-role mapping every one is a manual task, and the departures are the ones that get skipped.
```

The plumbing partly exists. The middleware check page supports real-time and scheduled checks at an interval of 1 to 1440 minutes, keeps up to 365 days of history, and can notify a channel when a component fails and when it recovers. What the platform cannot supply is the judgement: whether a Redis connection count at 23:00 is a blip or the first minute of an incident. Static resource detection, the administrator tool that inspects the JavaScript and CSS a page references along with cache and CDN status, is a page-level diagnostic, not availability alerting. The [monitoring article](/blog/monitoring-self-hosted-document-platform) covers which signals deserve waking somebody.

The restore drill costs the most of the four, and the backup guide explains why. Before recovering, you confirm the target environment, data range, restore point and window; you confirm whether the restore overwrites live data, whether downtime is required, and what the rollback point is if it fails; you check that the backup files are readable, the directory is mounted correctly and every configuration file needed is present. Afterwards you verify the services, login and the document lifecycle, then record the executor, the approver and the checker. That is a change request, a window and three people, and it is only a rehearsal if it happens on a schedule.

## Upgrades, windows, and the standing cost of being ready

Every upgrade is a change-management event with a technical component, not the other way round. The tooling does its share: it validates the package format, integrity and signature, checks the product type and deployment architecture, verifies whether the current licence covers the upgrade, lists the resources that will be added, modified, deleted or restarted, takes a pre-upgrade snapshot and offers a rollback to the pre-upgrade version. Major version upgrades may update the database schema, and the documentation states plainly that the work belongs in non-peak business hours.

The cost in an upgrade is the window, and the window is priced by what your organisation does when the platform is unavailable. Ranking that dependency is a prerequisite for choosing a cadence. If the suite holds the on-call runbooks, an upgrade window is an incident-response outage wearing a maintenance hat. If it holds meeting notes and project plans, a monthly cadence is affordable. The frequent mistake is promising the first cadence while operating the second environment.

Disaster recovery has the same character. A second environment is worth paying for only if it is close enough to production to promote: same version, same configuration, same middleware majors, monitored, licensed, and proven by a real restore. Keeping it there is a monthly commitment, and it is the line that drifts first, because nobody tests on the environment nobody uses. The cheaper option is legitimate and should be chosen deliberately: a cold restore with a longer recovery time objective, agreed in writing with the people it affects.

```figure
type: layers
title: The cost stack, read from the outside in
items: Staff time | Platform capacity | Backup and a recovery target | Retained content | The licence
detail: The layer no licence comparison can show you, and for most teams the largest of the five. | Application nodes, the middleware baseline, and the object storage the browser talks to directly. | A second copy, and a second environment whenever the stated recovery time needs one. | Version history, snapshots and attachments, which grow with editing rather than with headcount. | The line the quote leads with, and for any team that needs the rings above it, the smallest.
caption: Figure 2. The licence sits at the centre. Each ring outside it is a consequence of running the thing rather than a purchase order you can defer.
```

## When the arithmetic flips

There is no user count at which self-hosting becomes the cheaper answer, and anyone quoting one is selling something. There is a ratio, and it has two halves.

The first half is how much of the work you already do. If your platform team runs MySQL, Redis, Kafka and Elasticsearch for other applications, if a rotation already carries a pager, and if restore drills are a habit rather than an event, adding a document platform costs little beyond capacity. If the same team would be learning five middleware components, accepting an object storage availability commitment and building a drill calendar from scratch, the marginal cost is a project that repeats every month.

The second half is what a failure costs. A team that can tolerate a day without its document platform should buy a backup, document the restore and stop there. A team whose contracts or regulators require a stated recovery time has to fund the second environment and the rehearsals.

Two honest statements follow.

**If cost is the only driver, self-hosting usually loses at small scale.** The hosted service is free for teams of up to five people, and the Team plan is $5 per user per month, 20% off billed annually, with somebody else holding the pager. Check [the pricing page](/pricing) against your own estimate first. A three-node cluster with a part-time owner costs more than that and delivers less availability, every month.

**Paying someone else is not free either.** You trade a licence line you can forecast for an operations line you cannot see, which is a good trade only if you were never going to staff that line. Self-hosting is the wrong answer when the driver is the invoice and nobody wants the pager. It is the right answer when residency or contractual constraints cannot be met any other way, or when the operations function already exists and the marginal work is genuinely small.

The questions that settle it are not financial. Does a contractual or regulatory requirement force the content onto infrastructure you control? Is there a named owner with the standing to refuse a feature request that would add a component? Will a restore drill appear on the calendar without anyone being chased? If the last answer is no, the rest of the arithmetic is hypothetical. Start with [the backup and restore guide](/blog/backup-and-restore-document-platform), prove one restore, and rebuild the estimate from what it actually took.
