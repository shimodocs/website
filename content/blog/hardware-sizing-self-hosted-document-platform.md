---
title: "Sizing Hardware for a Self-Hosted Document Platform"
seoTitle: "Hardware Sizing for Self-Hosted Docs | ShimoDocs"
description: "How to size CPU, memory and storage for a self-hosted document platform, and why registered users are the wrong planning number."
layout: standard
category: self-hosting
date: 2026-03-23
tags: [sizing, infrastructure, capacity, operations]
keywords: "self hosted document platform sizing, document collaboration hardware requirements, capacity planning concurrent editors"
---

The most common sizing mistake is planning from the number of registered users. It is the number that appears in the licence negotiation, so it feels like the relevant one, and it has almost no relationship to what the hardware actually does.

This is what resource consumption in a document platform actually tracks, and how to size for it without over-buying.

## What drives consumption

Concurrent editors are the dominant factor. A collaborative document holds open a connection, maintains awareness state, applies and rebroadcasts operations, and keeps a version history. A user who is registered but not editing costs almost nothing.

The ratio between registered and concurrent depends entirely on the organisation. A 500-person company with a meeting-heavy culture might see 40 concurrent editors at peak; a similar company of shift workers might see 8. The number has to come from observation, not from a formula.

Four resources matter, in different proportions.

```figure
type: bars
title: What actually consumes resources
items: Concurrent editors | Coordination service memory | Object storage | Relational database | Search index
value: 92 | 78 | 61 | 44 | 33
caption: Figure 1. Indicative relative weight at a few hundred concurrent editors. Registered user count is deliberately absent: it predicts none of the rows above.
```

**CPU** is driven by operational transform or CRDT work, which is small per edit but constant. It scales roughly linearly with concurrent editors and is the easiest resource to add by adding application nodes.

**Memory** is the resource that surprises people. The coordination service holds document state in memory for every open document, so a few large spreadsheets with many editors can consume more than hundreds of small text documents. Memory per node should be sized for the largest working set you expect, not the average.

**Disk IOPS** matters at the database layer rather than the application layer. Provisioned IOPS rather than capacity is the constraint.

**Object storage** grows monotonically and is discussed below.

## A starting shape

These are starting points for a pilot, not a production commitment. The purpose is to get something running so you can measure.

| Concurrent editors | Application nodes | vCPU per node | Memory per node | Database |
| --- | --- | --- | --- | --- |
| Up to 50 | 1 | 4 | 8 GB | 2 vCPU, 8 GB, SSD |
| 50 to 200 | 2 | 4 | 8 GB | 4 vCPU, 16 GB, provisioned IOPS |
| 200 to 500 | 3 | 8 | 16 GB | 8 vCPU, 32 GB, provisioned IOPS |
| 500 to 1,500 | 4 or more | 8 | 16 GB | 16 vCPU, 64 GB, provisioned IOPS |

Treat the application tier as horizontally scalable and the database as a vertical problem. Adding application nodes is routine; splitting a database is not, so it is worth buying database headroom once rather than migrating later.

## The storage curve is not linear

Object storage does not grow with users. It grows with content and, more sharply, with version history.

Every save creates a version. A document edited fifty times has fifty versions, and the total is much larger than the current file. Two consequences:

**Estimate from editing behaviour, not from document count.** A team that produces twelve documents a month and edits each thirty times generates more storage than a team that produces a hundred documents and edits each twice.

**Set a lifecycle policy deliberately.** Retention of version history is a policy decision with a direct cost. Keeping every version forever is defensible; doing it accidentally is not. Our [retention guide](/blog/document-retention-policy-guide) covers the policy side.

A working rule for a pilot: measure storage growth for a month, then multiply by the number of months you intend to run before the next infrastructure review, and add fifty per cent. Storage growth is one of the few curves in this stack that is genuinely predictable once you have a month of data.

## Measure before you commit

Over-provisioning a pilot and right-sizing afterwards is faster and cheaper than modelling from first principles. Instrument these from day one:

- **Concurrent editors at peak**, sampled per minute. This is the number that drives everything else.
- **Coordination service memory per open document**, so you can find the worst case rather than the average.
- **Database CPU and IOPS at peak**, including backup windows, which are frequently the busiest period.
- **Object storage growth per week**, split between new content and version history.

Two weeks of this data will size the next two years better than any vendor calculator.

## Where teams overspend, and where they underspend

**Overspend: application CPU.** It is the easiest resource to add later, and buying three times the estimate up front is common. Start smaller than you think.

**Underspend: database IOPS.** Storage performance is often chosen on capacity rather than throughput, and the database degrades under concurrent writes in ways that are hard to diagnose. Provisioned IOPS is usually the cheapest insurance in the stack.

**Underspend: search capacity.** Users judge the entire product by search. An under-resourced index produces slow queries that read as a slow product, and the fix is usually memory rather than CPU.

**Overspend: high availability from day one.** Running a single node with a tested restore is a better first deployment than a cluster nobody understands. Our [Kubernetes deployment guide](/blog/self-hosted-collaboration-kubernetes-deployment) covers when the complexity starts paying for itself.

## Sizing the coordination layer

The coordination service is the component people size incorrectly, because it does not appear in a standard server specification.

It holds the in-memory state of every open document: the current content, the operation history needed for conflict resolution, and the presence information that drives live cursors and selections. Memory grows with open documents, and the relationship is not linear — a large spreadsheet with forty active editors holds far more state than a short brief with two.

Three practical consequences:

**Size for the worst case, not the average.** The average open document is small. The one that causes an incident is the twenty-thousand-row planning sheet that half the company opens on a Monday morning.

**Document size matters more than document count.** Two hundred small documents may consume less than five large ones. Track memory per document, not per user.

**Restarting the coordination service is disruptive but not destructive.** Clients reconnect and reload, which users experience as a brief interruption. That is a far better failure mode than a database restart, and it is worth knowing which of your components behaves which way before an incident forces the question.

A reasonable starting allocation is to give the coordination service as much memory as the application tier, and to monitor the peak working set rather than the mean. If a single document can consume more than a small fraction of available memory, that is a signal to encourage splitting large sheets rather than to buy more RAM indefinitely.

```figure
type: layers
title: What to buy up front, and what can wait
items: Database capacity | Provisioned database IOPS | Application tier | Coordination memory | Object storage
detail: Buy three years. Vertical scaling is a project with a window, not a knob. | Buy the throughput guarantee even when capacity looks generous. Running out presents as an application bug. | Buy six months and add nodes as needed. Stateless, so this is routine. | Size for the largest document you expect, not the average. The failure it prevents is the disruptive one. | Effectively unconstrained. A cost line rather than a capacity limit.
caption: Figure 2. The top two rows are expensive to change later and cheap to over-buy now. The bottom three are the opposite, which is why a pilot can start small.
```

## Storage performance versus capacity

Object storage is usually selected on price per terabyte and provisioned on capacity. The database is usually selected on the same basis, and it is the component where throughput matters more than space.

Two distinctions worth keeping separate in any specification:

**Throughput for the database.** Provisioned IOPS, not volume size. A database that runs out of input/output operations does not slow down gracefully; queries queue, application threads block, and the platform appears to hang in ways that look like an application bug.

**Throughput for object storage.** Less critical for interactive editing, since document bodies are read and written on open and save rather than continuously. It becomes critical during a restore, which is precisely when you can least afford a slow path.

A useful habit is to record in the runbook which storage volumes carry which guarantee. During an incident, the question "is this the disk or the query" is answered by knowing whether the affected path is throughput-limited, and that is only knowable if someone specified it.

## When to add a node

Horizontal scaling of the application tier is routine, and the trigger should be a measured signal rather than a calendar.

Signals that justify another application node:

- Sustained CPU above roughly seventy per cent at peak, on more than one node
- Coordination memory approaching the point where a single large document could destabilise a node
- Connection counts approaching the configured pool ceiling
- A user-visible degradation in operation latency during peak editing windows

Signals that do not justify it:

- High average CPU measured over a day, which hides short peaks
- A projection based on headcount growth with no observed change in concurrency
- A storage capacity threshold, which is unrelated to compute

The reason to be conservative about adding nodes is operational rather than financial. Every node is another thing to patch, monitor and reason about during an incident, and a two-node deployment that is well understood is usually better than a four-node one that is not.

## Growth planning

Two rules of thumb that hold up better than most.

First, **provision the database for three years and the application tier for six months**. The database is painful to resize; the application tier is not.

Second, **review after any change in editing behaviour, not on a calendar**. Enabling AI assistance, changing retention, or onboarding a team with heavy spreadsheet use all shift the curves. A quarterly review that does not account for those is a formality.

For the broader deployment picture, the [self-hosted collaboration guide](/blog/self-hosted-collaboration-guide) covers the reference architecture these numbers plug into, and our [capacity planning article](/blog/capacity-planning-concurrent-editors) goes deeper on concurrency specifically.
