---
title: "Choosing Object Storage for a Document Platform"
seoTitle: "Object Storage for Document Platforms | ShimoDocs"
description: "S3-compatible storage for a self-hosted document platform: versioning, lifecycle rules, performance and the settings that prevent regret."
layout: magazine
category: self-hosting
date: 2026-04-13
updated: 2026-09-15
tags: [object storage, s3, infrastructure, lifecycle]
keywords: "object storage document platform, s3 compatible storage collaboration, lifecycle policy document versions"
---

Object storage holds the document bodies and attachments, and it is usually treated as the simplest component in the stack: point the platform at a bucket and move on. That works until version history turns storage into the fastest-growing cost line in the deployment, or until a deletion request discovers that the bucket was never configured to support one.

This is what to decide deliberately rather than by default.

## What the platform needs

The requirement is S3 compatibility rather than a specific vendor, and the difference between implementations lies in the details.

| Capability | Why it matters |
| --- | --- |
| S3 API compatibility | The platform's storage layer expects it; gaps appear as intermittent failures |
| Object versioning | Required for point-in-time recovery and for undoing accidental deletion |
| Lifecycle rules | The mechanism that makes version history a policy decision rather than a cost surprise |
| Object lock or immutability | The control that survives a compromised credential |
| Server-side encryption | Baseline, with a considered answer on who holds the key |
| Multipart upload | Large attachments and presentations |
| Eventual or strong consistency | Listing behaviour after writes, which affects the platform's own consistency checks |

Two rows deserve attention beyond the table.

**Versioning is not optional.** Without it, the platform's redo and undo behaviour at the storage layer is limited, point-in-time recovery of content is impossible, and a deletion bug becomes permanent. It is also the setting most frequently left off, because the platform works without it in a pilot.

**Object lock is the control for deliberate destruction.** Where it is available, it removes the ability to delete backups within a retention window even for an administrator. It is the single most effective control against an attacker with credentials, as covered in our [backup article](/blog/backup-and-restore-document-platform).

```figure
type: layers
title: What sits in the bucket, and what each part needs
items: Document bodies | Attachments and uploads | Version history | Thumbnails and previews | AI retrieval chunks
detail: Current content. Small individually, and the part everyone thinks of. | Large, unpredictable in size, and the part that makes multipart upload a requirement rather than a nicety. | The volume driver. Every save creates one, so this row usually exceeds the current content by a wide margin. | Derived, regenerable, and safe to expire aggressively with a lifecycle rule. | Derived for retrieval, with its own lifecycle and its own deletion obligations.
caption: Figure 1. Rows three to five are derived or historical, and they are where storage cost and deletion failures live. Only the first two are what people picture when sizing a bucket.
```

## Version history is the cost curve

Every save creates a version. A team that edits a document fifty times generates fifty stored objects, and the total is several times the size of the current file.

This produces the storage curve that surprises teams: it does not grow with users, and it does not grow with the number of documents in an obvious way either. It grows with editing frequency.

Three approaches, each defensible:

**Keep everything.** Simplest, best for audit and legal hold, and the most expensive. Justified where version history is evidence.

**Keep a window.** Lifecycle rules expire non-current versions after a defined period, retaining recent history and discarding older. The right default for most operational content, provided the window is longer than the longest period anyone plausibly needs to compare versions.

**Keep periodic snapshots.** Retain, say, one version per week indefinitely and expire the rest after a shorter window. A reasonable compromise for content where the direction of change matters more than the exact sequence.

The decision belongs in the retention policy rather than in the storage configuration, because it is a records question. Our [retention guide](/blog/document-retention-policy-guide) covers the policy side; the storage layer only implements it.

## Lifecycle rules that prevent regret

Lifecycle configuration is where a small mistake produces irreversible outcomes, so a few rules are worth following.

**Never expire current versions.** It seems obvious and it is a genuinely common misconfiguration, because rules are often written by bucket path rather than by version state.

**Set an incomplete multipart upload rule.** Failed uploads leave fragments that are billed and never cleaned up. This is free money in most deployments.

**Expire derived data aggressively.** Thumbnails, previews and retrieval chunks are regenerable. Keeping them as long as source content multiplies storage for no benefit.

**Check the interaction between lifecycle and legal hold.** A lifecycle rule that expires an object under hold is a compliance problem, and whether the platform's hold mechanism prevents it is worth testing rather than assuming. Our [legal hold article](/blog/legal-hold-document-management) covers what the platform should enforce.

**Test the rules against a non-production bucket** before applying them to content. There is no preview for a deletion that has run.

```figure
type: timeline
title: The life of a stored version
items: Written on save | Becomes non-current | Lifecycle window | Transition or expiry | Deleted with content
detail: Every save creates one. This is where the volume comes from, not from the number of documents. | The moment the current version moves on. Most deployments hold far more of these than anyone expects. | The period the policy allows before disposal. A records decision, not a storage default. | To colder storage, or gone. Rules that act on the wrong path cause either runaway cost or premature loss. | The end state, and the one that deletion requests have to actually reach.
caption: Figure 2. Steps three and four are where cost and compliance are decided, and both are configuration rather than code. Neither announces a mistake.
```

## Performance and consistency

Two characteristics that matter less than expected during normal editing and a great deal during specific operations.

**Interactive editing barely touches object storage.** Document bodies are read on open and written on save, with the live editing handled by the coordination service. This means object storage latency affects the open experience and not the editing experience, which is a useful diagnostic distinction.

**Restores and migrations are throughput-bound.** Both read and write large volumes in a short period, and both are the moments when storage performance determines how long a window lasts. Sizing storage throughput on interactive load alone understates what a restore requires.

**Listing consistency affects recovery checks.** A platform that verifies every referenced object exists relies on listing behaviour matching what was written. Where an implementation offers eventual consistency for listings, the consistency check has to account for it, or it will report false failures immediately after a restore.

## Deletion that actually deletes

Object storage is where deletion requests most often fail, because three mechanisms conspire to retain content.

**Versioning** keeps non-current versions after a delete, which is the intended behaviour and must be handled explicitly rather than ignored.

**Lifecycle rules** may retain objects for a configured period regardless of a delete request.

**Object lock** prevents deletion outright while the retention window is open.

Any deletion procedure therefore has to specify what happens at each: whether non-current versions are removed, whether the lifecycle window is short enough to satisfy the obligation, and how content under lock is handled. A deletion that removes the current object and leaves four historical versions has not deleted the document, as covered in our [retention guide](/blog/document-retention-policy-guide).

## Choosing between implementations

S3 compatibility is a spectrum rather than a binary, and the gaps show up in specific places.

**Self-managed object storage** on your own hardware gives complete control over location, keys and lifecycle, and makes you responsible for durability, replication and upgrades. It is appropriate when the residency or isolation requirement is strict enough that a managed service is not an option, and it adds a stateful component that needs the same backup discipline as the database.

**A managed object storage service** removes the durability and capacity problems and keeps the data within a chosen region. It is the right default for most self-hosted deployments, because self-hosting the application does not require self-hosting every dependency. The distinction that matters is where the data sits and who can reach it, not who operates the disk.

**A filesystem presented over an S3 gateway** is a common shortcut and a frequent source of trouble. Gateway implementations vary in their support for versioning, multipart uploads and consistency, and the platform's assumptions about object storage may exceed what the gateway provides. Where this is chosen for convenience, it is worth verifying each capability in the table above rather than assuming compatibility from the API surface.

The test that separates a workable implementation from a problematic one is not the API list but the behaviour under the platform's actual patterns: many small writes, occasional large uploads, frequent listings, and periodic bulk reads during a restore.

## Monitoring storage specifically

Storage is the component whose problems develop most slowly and are least visible in ordinary monitoring, which makes a small number of targeted measurements worth having.

**Growth per week, split between current content and non-current versions.** The split is what tells you whether the curve is driven by content or by editing intensity, and the two have different remedies.

**Lifecycle rule effectiveness.** Confirm that rules are actually transitioning and expiring what you expect. A misconfigured rule fails silently and produces either unbounded growth or premature deletion, and neither announces itself.

**Request error rates**, particularly throttling responses. Object storage throttles on request rate as well as throughput, and a platform issuing many small requests can hit a limit that has nothing to do with bandwidth.

**Restore read throughput**, measured during a drill rather than during an incident. This is the number that determines how long a recovery actually takes, and it is frequently an order of magnitude lower than interactive expectations suggest.

These four measurements belong alongside the platform's other monitoring rather than in a storage console nobody opens. Our [monitoring article](/blog/monitoring-self-hosted-document-platform) covers the wider setup.

## A configuration checklist

Before putting content in a bucket:

1. **Versioning enabled**, with a deliberate answer on non-current version retention.
2. **Object lock considered**, and enabled if the content's loss would be material.
3. **Lifecycle rules** for incomplete multipart uploads, derived data and non-current versions.
4. **Encryption enabled**, with the key custody question answered rather than defaulted. Our [key custody article](/blog/byo-key-encryption-documents) covers what to ask.
5. **Throughput sized for restores**, not only for interactive use.
6. **Deletion procedure written** and tested against a document with multiple versions.
7. **Growth tracked weekly**, with the curve reviewed rather than discovered.

For the surrounding design, [backup and restore](/blog/backup-and-restore-document-platform) covers the consistency requirement between storage and database, and [capacity planning](/blog/capacity-planning-concurrent-editors) covers why storage belongs in a separate budget conversation from compute.
