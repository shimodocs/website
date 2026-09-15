---
title: "Monitoring a Self-Hosted Document Platform"
seoTitle: "Monitoring a Self-Hosted Document Platform | ShimoDocs"
description: "What to monitor in a self-hosted document platform, which alerts are worth waking someone for, and why user-visible actions beat host metrics."
layout: magazine
category: self-hosting
date: 2026-03-30
tags: [monitoring, observability, alerting, operations]
keywords: "document platform monitoring, self hosted collaboration observability, alerting document platform"
---

Monitoring a document platform usually starts with host metrics, because those are the ones the tooling provides by default. CPU, memory and disk are easy to collect and almost useless on their own: they tell you a machine is busy, not whether anyone can edit a document.

The useful question is what a user experiences, and working backwards from there.

## Start from user-visible actions

A document platform has a small number of actions that matter. If these five are healthy, the platform is healthy, regardless of what the host metrics say.

| Action | What it exercises | Typical failure signature |
| --- | --- | --- |
| Open a document | Object storage, database, coordination service | Slow or failing opens with normal editing |
| Edit and save | Coordination service, database writes | Edits lost, saves rejected, conflicts |
| Search | Search index, permissions filtering | Slow or empty results |
| List a repository | Database queries, permission resolution | Slow load as repositories grow |
| Sign in | Identity integration, session handling | Authentication failures, redirect loops |

Instrumenting these as synthetic checks — a script that logs in, opens a known document, edits and saves, searches, and lists a repository — gives you a single signal that correlates with what users actually report.

That check is more valuable than any dashboard of infrastructure metrics, because it fails when the platform fails for any reason, including the reasons nobody thought to alert on separately.

## What to collect per component

Synthetic checks tell you something is wrong. Component metrics tell you where.

```figure
type: matrix
title: Metrics worth collecting, by what they explain
items: Application latency | Coordination memory | Database throughput | Object storage latency | Search query time
detail: Per action, at percentiles rather than averages. The ninety-fifth percentile is what users notice, and it is where queueing shows up. | Peak working set per node, and the largest single document. The metric that predicts a mid-meeting incident. | IOPS consumed against provisioned, plus connection pool saturation. Explains "slow for no reason" better than CPU. | Time to first byte on document open. Explains slow opens when the database is idle. | Slow query count. Explains search complaints that look like platform complaints.
xAxis: EXPLAINS SYMPTOMS
xAxisEnd: EXPLAINS CAUSES
caption: Figure 1. The left column is what you alert on and the right is what you diagnose with. Confusing the two produces either alert fatigue or blind spots.
```

A common mistake is to instrument causes thoroughly and symptoms not at all. The result is a rich set of dashboards and an outage that nobody noticed until a user complained.

## Alerting that people respond to

An alert is a request for someone to act. If no action follows, the alert is noise, and noise trains people to ignore the channel.

Three rules that hold up:

**Alert on symptoms, page on user impact.** A synthetic check failing is worth waking someone. Disk at eighty per cent is worth a ticket. The distinction matters because it determines whether the alert is trusted.

**Every alert has a runbook entry.** If the responder has to work out what to do at three in the morning, the alert will be muted within a month.

**Review alerts that fired but needed no action.** Those are the ones to tune, and the review has to be periodic or the tuning never happens.

Alerts worth having for a document platform:

- Synthetic check failing from two independent locations
- Document open latency above a threshold at the ninety-fifth percentile, sustained
- Database connection pool saturation sustained above a high-water mark
- Coordination service memory per node above the point where one large document could destabilise it
- Object storage write failures, which indicate credential or lifecycle policy problems
- Backup job not completed within its window, and separately, no successful restore drill in the last quarter
- Certificate expiry inside the renewal window, because it causes a total outage and is entirely predictable

The last two are the alerts people forget to configure, and both cause outages that are embarrassing precisely because they were knowable in advance.

```figure
type: flow
title: What a page should lead you through
items: Synthetic check fails | Which action | Which component | Which change | Who is affected
detail: The alert that fires first, from two independent locations | Open, edit, search, list or sign in. Narrows the search space immediately. | Database throughput, coordination memory, object storage, search. One view answers this. | The last upgrade, configuration change or migration. Most incidents follow one. | Scope before communicating, not after. Users want to know if it affects them.
caption: Figure 2. An alert without the second and third steps is a notification rather than a runbook, and a responder who has to work that out at three in the morning will mute the channel.
```

## Logs

Metrics tell you that something is wrong. Logs tell you what.

What to retain:

**Authentication events.** Both successes and failures. Failures in volume indicate either a misconfiguration or an attack, and the two are distinguished by the pattern.

**Administrative actions.** Retention changes, permission grants, configuration edits, hold placement. These are the events an auditor asks about.

**Errors with enough context to reproduce.** A log line that says "failed to save" is not useful. One that includes the document identifier, the operation and the error class is.

**Access to sensitive repositories**, which is a compliance requirement in several frameworks rather than an operational one.

Retention for logs should be set explicitly and matched to the applicable obligation. Logs frequently contain personal data, so they are subject to the same retention discipline as the content — a point our [retention policy guide](/blog/document-retention-policy-guide) covers in general terms.

## What not to monitor

**Average latency.** Averages hide the queueing that users experience. Use percentiles.

**Every metric the platform emits.** Instrumenting everything produces dashboards nobody reads and costs storage. Choose the metrics that map to the five user actions.

**Host CPU as a proxy for health.** A document platform can be unhealthy at low CPU, during a database throughput problem, and healthy at high CPU during a large import.

**Uptime of the web tier alone.** A load balancer returning a health check does not mean anyone can open a document.

## Watching the things that fail slowly

Most monitoring attention goes to failures that are sudden. In a self-hosted deployment, the incidents that cause the most disruption usually develop over weeks.

**Version history growth.** Object storage grows steadily and nobody notices until a quota or a budget is reached. Track weekly growth and extrapolate; a change in the curve usually means a change in editing behaviour, an integration that saves too often, or a retention rule that stopped applying.

**Search index drift.** An index that stops keeping up with writes degrades gradually. Users report that search "misses things" long before anyone investigates. Track index lag — the gap between a write and its appearance in search results — and alert on a sustained increase rather than an absolute value.

**Database bloat.** Metadata tables accumulate dead rows. The symptom is a slow, general decline in query performance with no obvious cause. Track table sizes and autovacuum activity where applicable.

**Certificate and credential expiry.** Entirely predictable and entirely capable of causing a total outage. Every certificate, every integration credential and every token with an expiry date belongs in a calendar with an alert ahead of it.

**Backup staleness.** Covered elsewhere, and worth repeating in the monitoring context: the alert that matters is not "backup job failed" but "no successful restore drill in the last quarter". The first fires and gets retried; the second is the one that reflects an actual capability.

**Access drift.** The population with administrative rights tends to grow quietly. A monthly count, alerted on change, is a cheap control that catches both mistakes and misuse.

## Making the check independent

A synthetic check that runs from inside the platform's own network will not detect a failure at the network edge, which is a common failure mode and often the first symptom users report.

Run the check from at least two locations that do not share a network path, and preferably not from the same provider as the deployment. A monitoring system that fails alongside the thing it monitors is worse than no monitoring, because it produces confidence without evidence.

The same principle applies to alerting delivery. If alerts route through infrastructure that the incident took down, nobody is notified. An alerting path that depends on the platform being up — a webhook handled by the same cluster, for instance — will be silent during exactly the incident that matters most.

## The dashboards worth building

Three views, and no more than three, because dashboards that are never read are a cost rather than a benefit.

**A user-facing view.** The five synthetic checks with their current latency and status, plus error rates. This is the one to look at first during an incident, and the one worth displaying somewhere visible.

**A saturation view.** Database IOPS against provisioned, connection pool utilisation, coordination memory against available, object storage growth against budget. This answers "what is about to break".

**A compliance view.** Backup recency, restore drill recency, certificate expiry, access review recency, retention job success. Read by a different audience on a different cadence, and the view an auditor will ask to see.

Keeping them separate is deliberate. A single dashboard serving operations, capacity and compliance audiences ends up serving none of them well, and the compliance items get lost among the latency graphs.

## Handing over

A self-hosted deployment tends to be operated by whoever installed it. That works until that person is unavailable, which is why the monitoring setup should include a written handover: what each alert means, what to check first, and who to contact.

The test of a monitoring setup is not whether it looks comprehensive. It is whether someone who did not build it can respond to a page at three in the morning using the runbook and the dashboards alone. If that is not currently true, the runbook is the gap rather than the tooling.

## The minimum viable setup

If you are starting from nothing: build the synthetic check first, alert on it, then add database throughput and coordination memory. Those three cover the majority of incidents in a document platform, and the check is the one that will tell you about the failures you did not anticipate.

For what to do when the alert fires, [backup and restore](/blog/backup-and-restore-document-platform) and [disaster recovery](/blog/disaster-recovery-document-platform) cover the recovery side, and [hardware sizing](/blog/hardware-sizing-self-hosted-document-platform) explains what the memory and throughput numbers mean.
