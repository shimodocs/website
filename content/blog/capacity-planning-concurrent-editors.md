---
title: "Capacity Planning Around Concurrent Editors"
seoTitle: "Capacity Planning for Concurrent Editors | ShimoDocs"
description: "Why concurrent editors, not registered users, determine document platform capacity, and how to measure and project the number that matters."
layout: standard
category: self-hosting
date: 2026-04-10
tags: [capacity, concurrency, sizing, operations]
keywords: "concurrent editors capacity planning, document platform concurrency, collaboration platform sizing"
---

Every capacity conversation about a document platform starts with a user count and should start with a concurrency figure instead. The two are related by a ratio that varies by an order of magnitude between organisations, and the ratio is what determines whether the deployment is comfortable or constantly at its limits.

This is how to measure concurrency, what it drives, and how to project it.

## Why the ratio varies so much

Concurrency is the number of users actively editing at the same moment. It depends on working patterns rather than headcount.

| Organisation shape | Typical peak concurrency | Why |
| --- | --- | --- |
| Meeting-heavy professional services | 8 to 15 per cent of staff | Long collaborative editing sessions, shared documents |
| Product and engineering | 5 to 10 per cent | Much work happens in other tools |
| Shift-based operations | 2 to 4 per cent | Overlapping shifts, task-oriented use |
| Seasonal or project-based | Highly variable | Peaks can be several times the annual average |

The last row is why an annual average is a misleading planning number. An organisation whose usage triples during a quarterly planning cycle needs capacity for the peak, and the average would suggest half the infrastructure.

The practical approach is to measure for a month, identify the peak, and plan against a peak that is higher than the observed one by whatever margin the organisation's growth and seasonality justify. Our [hardware sizing article](/blog/hardware-sizing-self-hosted-document-platform) covers what the resulting number feeds into.

## What concurrency actually drives

Not all resources scale the same way with concurrent editors, and knowing which is which prevents adding capacity in the wrong place.

```figure
type: bars
title: How each resource responds to concurrency
items: Coordination memory | Application CPU | Database write throughput | Object storage | Search index
value: 95 | 82 | 58 | 22 | 40
caption: Figure 1. Indicative sensitivity to concurrent editor count. Object storage is largely independent of concurrency and grows with content and version history instead, which is why it belongs in a separate budget conversation.
```

**Coordination memory** is the most sensitive and the least forgiving. It scales with open documents and their size, and it is the resource whose exhaustion produces the most disruptive failure.

**Application CPU** scales roughly linearly and is the easiest to address, because application nodes are stateless.

**Database write throughput** rises with editing activity, and it is the resource where concurrency and content growth interact: more editors means more writes, and more history means a larger database to write into.

**Search index** grows with content rather than concurrency, though query load rises with usage. It is usually a memory question.

**Object storage** is almost entirely independent of how many people are editing at once.

## Measuring it properly

Three measurements, and the third is the one people miss.

**Peak concurrent editors, sampled per minute.** Not per hour, which averages away the peaks that matter, and not per day, which is useless for capacity.

**Peak concurrent open documents**, which is a different number and drives coordination memory more directly. Two hundred editors across two hundred short documents is a very different load from two hundred editors across five large ones.

**Largest single document by state size.** This is what determines whether one document can destabilise a node. A deployment can be comfortable at its average and fragile because of one large spreadsheet.

Recording these three over a month gives a defensible basis for planning. Recording only the first is common and insufficient.

```figure
type: matrix
title: Load events that have nothing to do with headcount
items: Bulk migration import | Backup window | AI indexing run | Quarterly planning peak
detail: Thousands of documents generate version records, index entries and audit events in a short period. A capacity event disguised as a project. | Competes with production for the same provisioned throughput. On a busy deployment it is indistinguishable from a shortfall. | Sustained, unrelated to editing, and easy to enable broadly before anyone models the cost. | Genuine user concurrency, and predictable if anyone looked at last quarter's data.
xAxis: PLANNED AND SCHEDULABLE
xAxisEnd: ARRIVES WITH THE WORKLOAD
caption: Figure 2. Three of the four can be moved to a quieter period. The fourth cannot, which is why the planning cycle belongs in the capacity model rather than in a footnote.
```

## The peaks that are not about users

Concurrency is the primary driver and not the only one. Three events produce load spikes that have nothing to do with how many people are editing.

**Bulk imports.** A migration brings thousands of documents into the platform, generating version records, index entries and audit events in a short period. A migration is a capacity event, which is why our [migration walkthrough](/blog/how-to-migrate-from-google-workspace) recommends staging it rather than importing everything at once.

**Backup and maintenance windows.** These compete with production for input and output. On a deployment with provisioned throughput, a backup running during a busy period is indistinguishable from a capacity shortfall.

**AI operations at scale.** Indexing a repository for retrieval, or a large batch of summarisation requests, generates sustained load that is unrelated to editing. If AI features are enabled broadly, this becomes a capacity input rather than a curiosity.

Planning for these as separate line items, rather than folding them into general headroom, produces a more accurate picture and makes the cause of a spike identifiable when it happens.

## Projecting forward

Three drivers, and they should be projected separately because they move independently.

**Headcount.** Usually the slowest-moving and the easiest to forecast, with the caveat that the concurrency ratio may change as the organisation changes shape.

**Editing intensity.** Harder to forecast and often more impactful. A team that adopts heavy version history, or moves a class of work into the platform that previously lived elsewhere, can shift the load without any change in headcount.

**Content volume.** Grows with version history and is the driver of storage cost rather than compute cost. It is also the most predictable of the three once a month of data exists.

A useful cadence is quarterly: revisit the three measurements, compare them against the previous quarter, and check whether any of the three drivers moved in a way the projections did not anticipate. Capacity problems that arrive as surprises are usually one of these drivers moving unnoticed.

## The headroom question

How much spare capacity to carry is a judgement, and the two failure modes are symmetric: too little produces incidents, too much produces a deployment that is expensive to run and, more subtly, untested at its limits.

A workable position for a document platform:

**Run at roughly fifty to sixty per cent of capacity at observed peak.** This leaves room for a peak that exceeds the observed one, room for the load of a backup or migration running alongside, and — importantly — room for a single node to be lost without the remainder being overwhelmed.

**Keep the database with more headroom than the application tier.** It is the harder component to scale and the one whose saturation is hardest to diagnose. Buying three years of headroom once is cheaper than a migration at year two.

**Keep object storage effectively unconstrained**, since it is a cost line rather than a capacity limit and running out of it is an outage with an obvious remedy.

The reason fifty to sixty per cent rather than something tighter is that a document platform's load is bursty in ways that averages hide. A single large document opened by a large meeting can move coordination memory more than a day of steady editing, and that burst needs somewhere to go.

## What to do when capacity runs short

The remedies differ sharply in cost and speed, and knowing them in advance shortens an incident.

**Immediate.** Scale the application tier horizontally, which is why stateless design matters. It addresses CPU and, partially, coordination memory if the load is spread across more nodes.

**Short term.** Tune rather than add: database indexes for the queries that are actually slow, connection pool sizing, buffer pool adjustments. Our [database tuning article](/blog/database-tuning-document-collaboration) covers where these pay off.

**Medium term.** Vertical scaling of the database, which usually requires a window and a tested backup.

**Long term.** A change in deployment shape — splitting the coordination service, or moving to a multi-node architecture — which is a project rather than a remedy.

The pattern worth noticing is that application capacity is a knob and database capacity is a project. That asymmetry is the reason the sizing guidance keeps returning to buying database headroom early.

## The organisational version of capacity planning

There is a non-technical driver that matters as much as any measurement: whether anyone is accountable for capacity.

In many self-hosted deployments, the platform is installed by one team, handed to another, and used by everyone, with no single owner of the growth curve. The measurements described above are collected by nobody, and the first sign of a capacity problem is an incident.

The fix is procedural and cheap: assign an owner, agree a review cadence, and put the three measurements somewhere that owner looks. The measurements themselves take an afternoon to instrument; the accountability is what makes them useful.

## When to add capacity

Two signals, and neither is a threshold on a single metric.

**Sustained resource pressure at peak**, across more than one node, for more than a few days. A single node spiking is normal; every node spiking consistently is a capacity signal.

**A projection that the current headroom will be consumed within the planning horizon**, given observed growth rather than hoped-for growth.

What should not trigger it: a single day's spike, a metric exceeding a threshold for an hour, or a headcount forecast with no observed change in concurrency.

The reason to be deliberate is that capacity decisions are cheap to make early and disruptive to make late, and the difference between the two is measurement. A deployment with three months of concurrency data can plan; one without it can only react.

For the operational side, [monitoring](/blog/monitoring-self-hosted-document-platform) covers collecting these numbers continuously rather than by special request, and [database tuning](/blog/database-tuning-document-collaboration) covers the layer where concurrency and content growth meet.
