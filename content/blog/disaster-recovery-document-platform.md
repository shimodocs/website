---
title: "Disaster Recovery for a Document Platform"
seoTitle: "Disaster Recovery for Document Platforms | ShimoDocs"
description: "Designing disaster recovery for a self-hosted document platform: objectives, tiers of loss, site recovery and what to rehearse."
layout: magazine
category: self-hosting
date: 2026-04-08
updated: 2026-09-15
tags: [disaster recovery, resilience, business continuity, operations]
keywords: "disaster recovery document platform, self hosted collaboration business continuity, rto rpo document collaboration"
---

Disaster recovery is often treated as backup with a larger budget. The two answer different questions: backup answers "how do we get the data back", and disaster recovery answers "how do we get the service back, and how quickly".

A document platform makes that distinction concrete, because the data is only part of the service. Identity, configuration, network reachability and the search index all have to be restored to something usable.

## Tiers of loss

Designing for "disaster" as a single scenario produces either an expensive over-build or a plan that fails on the first real event. It is more useful to separate the tiers, because each has a different recovery mechanism.

| Tier | Scenario | Recovery mechanism | Typical objective |
| --- | --- | --- | --- |
| 1 | Component failure | Redundancy or restart | Minutes, no data loss |
| 2 | Data corruption or accidental deletion | Point-in-time restore | Hours, minimal loss |
| 3 | Region or data centre loss | Failover to a second site | Hours to a day |
| 4 | Deliberate destruction | Immutable backup, isolated copy | Days |

Most organisations design for tier three and are unprepared for tier two, which is the one that actually happens most often. Accidental bulk deletion and application bugs that corrupt metadata are far more common than site loss.

Tier four is the tier that has grown in importance, and it is the one where a conventional backup design fails, because an attacker with administrative credentials can delete the backups too. Immutability is what addresses it, as covered in our [backup article](/blog/backup-and-restore-document-platform).

```figure
type: matrix
title: Which tier each control actually addresses
items: Application redundancy | Point-in-time recovery | Cross-site replication | Object lock and immutability
detail: Addresses tier one only. Restarting a failed node does nothing for corrupted metadata. | The control for tier two, and the most valuable one in practice. Requires log retention and object versioning. | Addresses tier three. Expensive, and it does not protect against deletion that replicates faithfully to the second site. | Addresses tier four. Unlike replication, it survives credentials that can delete.
xAxis: MOST COMMON SCENARIO
xAxisEnd: LEAST COMMON, HIGHEST IMPACT
caption: Figure 1. Spending is frequently inverted: the most common scenario gets the least attention because it is unglamorous and does not appear in an architecture diagram.
```

## What "the service" includes

Restoring the data is necessary and not sufficient. A working service needs six things.

**The relational database**, restored to a coherent point in time.

**Object storage**, restored to a point consistent with the database rather than to the latest available object.

**Configuration and secrets** — deployment parameters, integration credentials, certificates. Without these the platform starts and cannot authenticate anyone.

**Identity reachability.** A restored platform that cannot reach its directory is a platform nobody can sign in to. If the identity provider is in the failed site, this is a dependency the recovery plan has to address.

**Network and DNS.** The recovery site needs to be reachable at the address clients expect, which usually means a DNS change with a time-to-live that determines how fast clients follow.

The [incident response runbook](/docs/deployment/troubleshooting/incident-response-sop) gives the operational sequence to follow while the recovery team is deciding whether the event is a service failure or a site failure.

**The search index**, rebuilt rather than restored, and large enough to take meaningful time at scale. It belongs in the recovery timeline rather than after it.

The DNS time-to-live is worth a specific mention because it is a configuration value that silently sets a floor on recovery time. A record with an hour-long time-to-live means an hour of recovery that no amount of engineering removes, and it is a one-line change to fix in advance.

## Choosing a recovery strategy

Four shapes, in increasing cost.

**Restore in place.** Backups and a documented procedure, with no standby. Cheapest, and appropriate when a full-day outage is tolerable.

**Pilot light.** Data replicated to a second site, with infrastructure provisioned on demand. Recovery time is dominated by provisioning, which is faster in a mature environment with infrastructure as code.

**Warm standby.** A running deployment at a second site, kept current, with users directed by DNS. Recovery is a DNS change plus a verification. The cost is running the platform twice.

**Active-active.** Both sites serve traffic. Substantially more complex for a stateful platform, and rarely justified for an internal collaboration tool.

Most self-hosted deployments land on warm standby for the platform tier, or restore-in-place with a genuine acceptance of the recovery objective. The honest version of the decision is a number: how many hours of unavailability is the organisation prepared to accept, and is it prepared to fund the difference?

## Rehearsing

A recovery plan that has never been executed is a hypothesis. Two exercises are worth running, and they test different things.

**A restore drill** verifies the data path. It is described in our [backup article](/blog/backup-and-restore-document-platform) and it answers: can we get the content back.

**A failover exercise** verifies the service path. It answers: can we get users working again, including identity, DNS and the client experience.

A failover exercise is more disruptive and correspondingly more informative. A workable first version does not move production traffic: provision the standby, restore into it, point a test DNS entry at it, and have a small group sign in and work for an hour. That exercises identity, certificates and the client experience without risking the production service.

```figure
type: timeline
title: A first failover exercise
items: Provision the standby | Restore data into it | Point a test name at it | Have real users sign in | Verify and document gaps
detail: From infrastructure as code, not by hand. The exercise also tests whether the code is current. | Database and object storage, to a consistent point, with the consistency check run | A DNS name that no production client uses, with a short time to live | A small group, doing real work: opening, editing, commenting, searching | The gaps found here are the plan's real content, and the timing is the number to report
caption: Figure 2. Step four is what makes the exercise real. A failover that works for administrators and not for ordinary users has tested the wrong population.
```

## The organisational half

Technical recovery is roughly half the work. The other half is knowing who decides.

Three things to write down before an incident:

**Who declares a disaster**, and who can authorise the cost of a failover. This is a business decision with a financial consequence, and it should not be made by whoever happens to be on call.

**Who communicates to users**, through what channel, including a channel that does not depend on the platform being up. A status page hosted on the same infrastructure is not a communication plan.

**What the business does meanwhile.** For a document platform, work does not stop; it moves to whatever the fallback is. Knowing the fallback — and having tested that people can reach it — converts an outage into an inconvenience.

## Cost, and what each tier buys

Recovery capability is bought, and the prices are not proportional to the benefit. Being explicit about what each increment costs makes the decision a business one rather than an engineering preference.

| Increment | What it costs | What it protects against | When it is worth it |
| --- | --- | --- | --- |
| Object versioning and log retention | Storage, modest | Accidental deletion, corruption, application bugs | Almost always |
| Immutable backup copy | Storage, modest | Deliberate destruction by a compromised credential | Whenever the content is not reproducible |
| Automated restore with a consistency check | Engineering time, one-off | Slow and incoherent recovery | Once the platform holds anything that matters |
| Warm standby site | Running the platform twice | Site loss | When the availability objective is under a day |
| Active-active | Substantial engineering and operational cost | Short outages at the site level | Rarely, for an internal collaboration platform |

The ordering is deliberate. The top three rows cost little, address the scenarios that actually occur, and are the ones teams most often skip. The bottom two rows cost a great deal and address the scenarios that occur least, and they are the ones most often proposed first because they are the ones that look like disaster recovery on an architecture diagram.

A useful discipline is to state, for each row, the scenario it addresses and confirm that the scenario has either happened to the organisation or plausibly could. Rows that fail that test are architecture rather than risk management.

## Testing the plan without a second site

Organisations without a standby site often conclude that failover cannot be rehearsed, and therefore do not rehearse anything. That is not the case.

Three exercises that are meaningful without a second site:

**A restore into an isolated environment**, with the consistency check and a timing measurement. This is the highest-value exercise available and needs no standby.

**A paper exercise with the decision-makers.** Walk through a scenario hour by hour: who notices, who declares, who authorises, who communicates. The gaps this surfaces are almost always organisational, and they are as likely to cause a prolonged outage as any technical failure.

**A network and DNS exercise.** Confirm that the time-to-live values are what you believe, that a record change propagates in the expected time, and that clients follow it. This is quick and it tests a component that is frequently the floor on recovery time.

Together these address most of what a full failover would reveal, at a fraction of the disruption. The full exercise remains the only way to test provisioning at scale, and it is worth doing once a plan is otherwise mature rather than as the first step.

## Where most deployments actually are

A realistic assessment for a self-hosted document platform is usually: backups exist and have not been restored, redundancy covers the application tier only, and the recovery plan is a document that has not been exercised.

The highest-value improvements, in order: enable object versioning and log retention so point-in-time recovery is possible, write the consistency check, run one restore drill, then decide about sites. That sequence addresses the scenarios that actually occur before spending on the ones that rarely do.

For related material, [backup and restore](/blog/backup-and-restore-document-platform) covers the data path in detail, [monitoring](/blog/monitoring-self-hosted-document-platform) covers early warning, and the [self-hosted collaboration guide](/blog/self-hosted-collaboration-guide) covers the architecture these decisions sit within.
