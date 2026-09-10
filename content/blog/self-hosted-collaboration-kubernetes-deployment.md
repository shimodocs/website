---
title: "Deploying Self-Hosted Collaboration on Kubernetes"
seoTitle: "Kubernetes Deployment for Collaboration Software | ShimoDocs"
description: "Sizing, prerequisites and the difference between single-node and high-availability Kubernetes for a self-hosted collaboration suite."
layout: briefing
category: self-hosting
date: 2026-01-30
tags: [kubernetes, deployment, sizing, high availability]
keywords: "kubernetes deployment collaboration, self-hosted kubernetes docs, high availability document collaboration"
---

Kubernetes is the default target for self-hosted software, and for good reasons: rolling upgrades, declarative configuration and a scheduler that survives a node failure. It also adds a layer between you and the application that has to be understood before an incident, not during one.

This covers what a collaboration suite actually needs from a cluster.

## Start with a single node

The most common mistake is designing for high availability before anyone uses the system. A single-node Kubernetes deployment is a legitimate production configuration for a team of a few hundred, and it defers the complexity until you have a reason.

Use it to:

- Prove the install and the upgrade path.
- Validate identity integration against your directory.
- Measure real resource use before sizing a cluster.
- Test your backup and restore procedure.

Migrating from single-node to HA later is a configuration change plus a data migration, not a redesign, provided you keep the stateful components external from day one. Which is the next point.

## Keep the state outside the cluster

This is the single most important architectural decision.

A collaboration suite has three kinds of state:

| State | Where it belongs | Why not in-cluster |
| --- | --- | --- |
| Relational data | Managed MySQL 8, or a careful StatefulSet | Backups and failover are a solved problem elsewhere |
| Object storage | S3-compatible external service | Capacity grows without bound; object lifecycle matters |
| Session and coordination | Redis | Losing it should be survivable, not catastrophic |

Running MySQL inside the cluster is possible and occasionally correct, but it moves the hardest operational problem — point-in-time recovery for a stateful database — into a system that was not designed for it. If you already operate a managed database, use it. The [self-hosted collaboration guide](/blog/self-hosted-collaboration-guide) covers the backup implications.

Do keep the stateless application tier in the cluster. That is what Kubernetes is good at.

```figure
type: layers
title: State belongs outside the cluster
items: Application tier | Ingress and TLS | MySQL 8 | Redis | Object storage
detail: In the cluster: stateless, horizontally scalable, rolls without downtime | In the cluster: certificate automation you trust, or a total-outage risk | External: point-in-time recovery is a solved problem elsewhere | External: losing it should degrade, not destroy | External: capacity grows without bound, lifecycle policy matters
caption: Figure 1. Everything that holds state sits outside. That single decision determines how much of the operational burden Kubernetes carries for you.
```

## Prerequisites checklist

Before you run an installer, confirm:

- **A supported Kubernetes version** with a default StorageClass if any component needs a volume.
- **An ingress controller** with certificate automation you trust.
- **DNS for the access domain**, decided before install. Changing the domain later touches certificates, cookies and every shared link.
- **External MySQL 8** with a user, a database and a tested backup.
- **Redis** reachable from the cluster.
- **Object storage** with a bucket and credentials.
- **A container registry** the cluster can pull from, or an offline image bundle.

Two of these are the usual schedule killers: an undecided domain name and object storage that has never been used by anything before.

```figure
type: bars
title: What drives sizing, in order
items: Concurrent editors | Coordination service memory | Document size | Search index | AI retrieval path
value: 90 | 84 | 62 | 47 | 38
caption: Figure 2. Relative weight of each factor. Concurrent editors and coordination memory dominate; total registered users is a poor proxy and frequently misleads capacity planning.
```

## Sizing

Collaboration workloads are bursty and memory-sensitive rather than CPU-bound. The real-time coordination service holds connections open for every active editor, which makes memory the first constraint you hit.

Rough starting points for a mid-size deployment:

- **Application nodes:** start with three nodes of 4 vCPU / 8 GB for a few hundred users, and watch memory rather than CPU.
- **Concurrent editors, not total users, drive sizing.** A thousand registered users with eighty simultaneous editors is an eighty-user problem.
- **Document size matters more than document count.** A single very large spreadsheet can dominate a worker.
- **Search and AI add their own footprints.** An AI retrieval path reads and chunks documents, which is I/O and memory you should measure separately.
- **Object storage grows monotonically.** Version history accumulates. Decide a retention policy before the bill decides it for you.

Measure before you scale. The vendor's [resource planning guide](https://github.com/shimodocs/shimodocs/blob/main/docs/deployment/getting-started/resource-planning.md) documents the baseline; your own numbers are the ones that matter.

## High availability: what actually improves

Adding replicas helps for some failure modes and not others.

**Improved by HA:**
- A single application pod dying.
- A node draining during maintenance.
- Rolling upgrades without downtime.
- Traffic spikes absorbed by more replicas.

**Not improved by HA:**
- The external database going down. This is your real single point of failure.
- Object storage becoming unreachable.
- A bad configuration pushed to every replica at once.
- Certificate expiry.

It is worth being blunt about the first list: teams often build a three-node cluster and leave the database on a single instance with no failover. The cluster buys less availability than the database configuration costs.

## Upgrade strategy

Rolling upgrades are the payoff for running on Kubernetes, and they need two things to be safe.

**A rollback plan that has been exercised.** Not a documented one. A tested one, including how to revert a schema migration if the release included one.

**A staged environment.** Production should not be the first place a release runs. A staging namespace with the same manifests and a recent database copy catches most surprises.

Set an upgrade cadence and publish it. Predictability reduces user friction more than low frequency does, and security patches should not wait for a window that never arrives.

## What to monitor

Beyond the generic node metrics, these are the signals that predict a collaboration outage:

- **Websocket connection count** against your sizing assumptions.
- **Coordination service memory**, which trends up with concurrent editors.
- **Database connection pool saturation**, the most common silent failure.
- **Object storage latency**, which shows up as slow document open rather than an error.
- **Document save failures**, which users notice before your monitoring does.
- **Certificate expiry**, which is unglamorous and causes total outages.

The incident tooling in the repository's [troubleshooting documentation](https://github.com/shimodocs/shimodocs/blob/main/docs/deployment/troubleshooting/monitoring-metrics.md) describes the signals the suite exposes.

## A deployment order that avoids rework

1. Decide the **access domain**, and do not change it later.
2. Stand up **MySQL, Redis and object storage** externally, with backups verified by an actual restore.
3. Install **single-node**, connect identity, run the pilot.
4. Prove **backup and restore**, including object storage.
5. Scale to **HA** once you have measured real load.
6. Automate **certificate renewal** and alert on expiry.
7. Write the **upgrade runbook** and rehearse a rollback.

If you are still deciding whether to self-host at all, start with [what private cloud document collaboration is](/blog/what-is-private-cloud-document-collaboration). If the driver is compliance rather than architecture, [data sovereignty](/blog/data-sovereignty-document-collaboration) frames the argument.
