---
title: "Tuning the Database Behind a Document Platform"
seoTitle: "Database Tuning for Document Platforms | ShimoDocs"
description: "The relational database holds a document platform's real source of truth. Here is what to tune, and what to back up before anything else."
layout: feature
category: self-hosting
date: 2026-03-25
tags: [database, tuning, mysql, operations]
keywords: "document platform database tuning, mysql document collaboration performance, database backup point in time recovery"
---

It is tempting to treat the database as plumbing and the object store as the content. The opposite is closer to the truth.

Document bodies live in object storage, and they are replaceable from a backup with modest effort. The relational database holds permissions, comments, version pointers, sharing relationships, membership and audit records. Lose it and you have a pile of files with no idea who should see them.

That makes the database both the highest-value component and the one most worth tuning deliberately.

## What lives where

Getting this split right determines what you tune and what you back up.

```figure
type: layers
title: Where state actually lives
items: Application nodes | Coordination service | Relational database | Object storage | Search index
detail: Stateless. Nothing is lost if a node dies, which is why they scale horizontally. | Holds open document state in memory. Loss is disruptive and recoverable: clients reconnect and reload. | Permissions, membership, comments, version pointers, sharing, audit. The true source of truth and the restore-critical component. | Document bodies and attachments. Large, replaceable, and useless without the database that indexes it. | A derived copy. Rebuildable from primary storage, and should never be treated as a backup.
caption: Figure 1. Only two of these five must be preserved for a coherent restore. The bottom row is a liability if anyone mistakes it for one of them.
```

## The settings that matter

Exact parameter names differ between MySQL and PostgreSQL. The concerns do not.

**Buffer pool or shared buffers.** The single most consequential setting. A database with a working set larger than its buffer pool will read from disk for routine operations, and the symptom is a platform that feels slow under load for no visible reason. Size it to hold the working set — which for a document platform is metadata and permissions, not content — and leave headroom for the operating system.

**Connection limits.** Document platforms open many short-lived connections, and a pool that is too small causes queuing that looks like database slowness. A pool that is too large causes context switching that also looks like database slowness. Instrument actual concurrency before changing the limit.

**Write-ahead log or binlog retention.** This is what makes point-in-time recovery possible. Configure it before you need it, and confirm the retention window against your recovery point objective. A backup taken nightly plus a seven-day log window gives you a far better recovery position than nightly backups alone.

**Slow query logging.** Enable it from day one. The queries that degrade a document platform are usually the ones the application issues on every page load, so they appear in slow logs long before users complain loudly enough to investigate.

**Autovacuum, if PostgreSQL.** Bloat in metadata tables is a slow, cumulative problem. Tuning it is unglamorous and prevents an incident that arrives eighteen months in.

## Backups are the point

Every tuning decision above is secondary to being able to restore.

Three requirements that are frequently missed:

**Point-in-time recovery, not just nightly dumps.** A nightly dump means losing up to a day of permissions and comments. Log retention narrows that to minutes. For a platform holding regulated content, the difference matters in an incident review.

**Database and object storage restored together.** Restoring the database to a point before a document was created leaves an orphaned file. Restoring it to a point after a file was deleted leaves a pointer to nothing. They have to be consistent, which usually means coordinating the two backup schedules rather than running them independently.

**A tested restore, on a schedule.** The most common finding in a document platform review is a backup job with a green tick and no evidence that restoration was ever attempted. A restore test is disruptive, which is exactly why it gets deferred, and deferring it is how organisations discover a problem during an incident.

```figure
type: flow
title: Restore order, and why it matters
items: Stop writes | Restore the database | Restore object storage | Verify consistency | Rebuild search
detail: Prevent divergence while the restore is in flight | To the chosen point in time, with logs applied | To a matching point, not to the latest available | Confirm every referenced document exists and every document is referenced | Reindex from primary storage; the index is derived, never restored
caption: Figure 2. Step four is the one that finds problems. A restore that completes without a consistency check has proven only that the tooling runs.
```

## Query patterns worth knowing

Generic tuning advice is less useful than knowing which queries the application issues repeatedly. Four patterns dominate in document platforms.

**Permission resolution on every access.** Answering "can this user open this document" typically walks group membership, repository roles and per-document grants. It runs on every page load and every API call, and it is the query most likely to benefit from indexing and from caching the resolved permission set.

**Listing a repository.** These queries sort and paginate, and they frequently join against metadata for display. They are the ones that degrade as repositories grow, and the fix is usually a compound index rather than more memory.

**Version and comment lookups.** High volume, small result sets, and very sensitive to index coverage. A missing index here produces per-document latency that compounds in a list view.

**Audit writes.** Append-only and constant. They are rarely slow individually and can dominate total write volume. If audit logging is writing to the same database as interactive traffic, it is worth checking whether it can be batched or separated, because it competes for the same IOPS budget.

The reason to look at patterns rather than parameters is that a document platform's load is dominated by a handful of repeated queries. Indexing them well is worth more than any buffer pool adjustment.

## Connection pooling in practice

Every application node maintains a pool. The arithmetic that catches people out is that pools multiply.

Three application nodes with a pool of fifty means up to a hundred and fifty concurrent database connections, which is well beyond what many default configurations handle gracefully. The symptoms of exceeding the limit are queuing and timeouts that present as application slowness, so teams add application nodes and the problem gets worse.

Practical guidance:

- **Set the pool per node against the database's actual capacity**, divided by the number of nodes, with headroom.
- **Know the database's maximum connections** and how much memory each connection costs. On some configurations a connection is not free.
- **Instrument pool saturation.** A pool that is consistently near its ceiling is a signal, and it is invisible unless it is measured.
- **Watch for connection leaks.** A pool that slowly fills over days and recovers only on restart indicates connections not being returned, which is an application bug rather than a tuning problem.

## When the database is not the problem

A meaningful share of "the database is slow" investigations end somewhere else. Two candidates worth ruling out first.

**The search index.** Users frequently describe a slow index as a slow platform, and the index is a separate component with its own resource profile. If queries are slow but the database is idle, look at search before tuning the database.

**Object storage latency on document open.** Opening a large document reads its body from object storage. If open is slow and editing is fine, the database is probably not involved.

Establishing which component is actually slow is the first step, and it is the one most often skipped. A baseline of latency per user-visible action — open, edit, save, search, list — will localise a problem in minutes and is worth building before you need it.

## Where tuning goes wrong

## Where tuning goes wrong

**Tuning before measuring.** Changing buffer sizes on the basis of a blog post rather than an observation usually moves the bottleneck rather than removing it. Get a baseline first.

**Scaling the database horizontally too early.** Sharding a document platform's metadata is a significant engineering project and is rarely justified before the application tier and the query patterns have been optimised.

**Ignoring the backup window.** Backups compete with production for IOPS. On a deployment with provisioned throughput, the backup window is often the busiest period, and it is worth scheduling against observed low points rather than at midnight by convention.

**Treating the search index as durable.** It is derived data. If the index is the only copy of something, the deletion path has a bug and the backup strategy is hiding it.

## The operational summary

Watch the database more closely than anything else in the stack, back it up with point-in-time recovery, test the restore on a schedule, and keep it consistent with object storage.

Everything that follows in our operations cluster builds on that: [backup and restore](/blog/backup-and-restore-document-platform) covers the procedure end to end, [monitoring](/blog/monitoring-self-hosted-document-platform) covers what to alert on, and [disaster recovery](/blog/disaster-recovery-document-platform) covers the wider design. If you are still choosing a deployment shape, the [self-hosted collaboration guide](/blog/self-hosted-collaboration-guide) is the starting point.
