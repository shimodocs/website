---
title: "Backup and Restore for a Document Platform"
seoTitle: "Backup and Restore a Document Platform | ShimoDocs"
description: "What to back up in a self-hosted document platform, why database and object storage must be restored together, and how to test it."
layout: briefing
category: self-hosting
date: 2026-03-27
updated: 2026-09-15
tags: [backup, restore, disaster recovery, operations]
keywords: "document platform backup, self hosted document restore, point in time recovery collaboration"
---

Backups are the control everyone claims and few can demonstrate. The gap is not usually the backup job, which runs and reports success. It is the restore, which is disruptive, rarely rehearsed, and only genuinely tested when something has already gone wrong.

This is what a document platform actually requires, and what a defensible restore looks like.

## Four things, not one

A document platform is not a single system with a single backup. Four components hold state, and they need different treatment.

| Component | Contains | Backup approach | Restore priority |
| --- | --- | --- | --- |
| Relational database | Permissions, membership, comments, version pointers, audit | Continuous log shipping plus periodic full backup | First — nothing else is meaningful without it |
| Object storage | Document bodies and attachments | Versioned bucket, replication, or snapshot | Second, to a matching point |
| Configuration and secrets | Deployment settings, certificates, integration credentials | Version-controlled, with secrets in a managed store | Before the restore, or nothing starts |
| Search index | A derived full-text copy | Do not back up; rebuild | Last, or during |

The search index deserves the emphasis. It is derived data, and treating it as a backup creates two problems: it doubles storage cost, and it hides bugs in the deletion path, because a document that was deleted from primary storage but survives in the index looks like it was never deleted.

The configuration row is the one that ruins otherwise good restores. An organisation can restore the database and the object store and then spend hours reconstructing the integration credentials that let the platform start.

```figure
type: layers
title: What a coherent restore needs, in order
items: Configuration and secrets | Relational database | Object storage | Search index
detail: Deployment parameters, certificates, identity provider credentials. Without these the platform starts but cannot authenticate anyone. | Restored to a chosen point in time with logs applied. The component that defines what the system believed. | Restored to a point consistent with the database, not to the latest available object. | Rebuilt from primary storage afterwards. A derived artefact, never a recovery source.
caption: Figure 1. The first and third rows are the two most commonly missing pieces. Most runbooks cover the second and mention nothing else.
```

## The consistency problem

This is the part that is genuinely hard, and the part most backup designs get wrong.

Database and object storage are backed up by different mechanisms on different schedules. If they drift, you get one of two failures:

**A database point before the content existed** leaves files in object storage that nothing references. Storage cost with no meaning, and a confusing audit trail.

**A database point after content was deleted** leaves pointers to objects that are gone. Users see documents in a list that will not open, which is a worse user experience than data loss because it looks like corruption.

Two approaches work:

**Synchronised snapshots.** Quiesce writes, snapshot both, resume. Simple to reason about, and it means a maintenance window.

**Log-based recovery with an object-storage marker.** Restore the database to a point in time, then restore object storage to the nearest consistent marker. More complex, no window, and it requires the object storage to support point-in-time or version-based recovery.

Whichever you choose, the requirement is the same: the runbook has to name the target point for both components, and the restore has to end with a consistency check that verifies every referenced document exists and every stored object is referenced.

That check is worth writing as a script and running after every restore. It converts "the restore completed" into "the restore produced a coherent system", which are different claims.

## Recovery objectives, stated plainly

A recovery point objective is how much data you can afford to lose. A recovery time objective is how long you can be unavailable.

Both should be written down, agreed with the business, and matched by the configuration. A common and expensive mismatch: a stated recovery point objective of one hour, delivered by nightly backups that give twenty-four.

| Objective | What it requires |
| --- | --- |
| RPO of 24 hours | Nightly full backup is sufficient |
| RPO of 1 hour | Continuous log shipping plus an object store with versioning |
| RPO near zero | Synchronous replication, which is a different architecture and a different cost |
| RTO of 8 hours | A documented restore procedure and a spare environment |
| RTO of 1 hour | Automated restore, pre-provisioned capacity, and rehearsal |

The last row is worth being honest about. A one-hour recovery time objective is achievable, and it means the restore is automated and rehearsed, not that a runbook exists.

## The restore drill

A drill is the only thing that turns a backup into a recovery capability. Schedule it, and treat a failed drill as an incident.

A workable drill:

```figure
type: timeline
title: A restore drill that finds real problems
items: Restore into an isolated environment | Start the platform and authenticate | Verify the consistency check | Open documents from each class | Compare against expectations | Record timings
detail: Never over the production deployment. The first drill will be messy and that is the point. | Identity integration is the step that most often fails, because credentials were not part of the backup. | Every referenced object exists, every object is referenced. Script this. | A spreadsheet with formulas, a document with comments, an attachment, a form response. | Row counts, comment counts, the most recent version timestamp. Agree these before the drill. | Actual time to service, against the recovery time objective. This is the number leadership needs.
caption: Figure 2. Step six is what makes the drill worth running. A restore that works but takes three times the objective is a finding, not a pass.
```

Run it quarterly, and after any change to the backup configuration or the platform version. A drill that has never been run against the current release is an assumption.

## Common failure modes

**The backup job's success is mistaken for the restore's success.** Different things. Job status is not evidence of recoverability.

**Secrets are not backed up.** The restore completes and the platform cannot authenticate. Every integration credential must be recoverable from somewhere other than the system being restored.

**Object storage versioning was never enabled.** Without it, point-in-time recovery of the content layer is impossible and the database can only be restored to a matching nightly point.

**The restore is tested but the consistency check is not.** A restore that produces an incoherent system passes a naive test and fails users.

**Nobody owns the runbook.** It was written once, references components that have been renamed, and is discovered to be stale mid-incident.

## Retention, cost and the 3-2-1 question

Backup design runs into the retention question quickly, because copies are cheap individually and expensive in aggregate.

The conventional guidance — three copies, two media, one off-site — remains sound for the database and configuration layers, which are small. Applying it literally to object storage is where costs escalate, because object storage is already replicated by the provider and a full third copy can double the bill for a marginal gain.

A more proportionate reading for a document platform:

**Database and configuration.** Follow the rule properly. These layers are small, cheap to copy and impossible to reconstruct. Three copies, one of them off-site and ideally in a different account or provider, is straightforwardly worth it.

**Object storage.** Rely on the provider's durability for hardware failure, and use versioning plus a cross-region replication for the threats that survive it: an application bug that deletes content, a compromised credential, or a region-level event. A third independent copy is worth adding only if the content is genuinely irreplaceable and not reproducible from elsewhere.

**Search index.** No copy at all. Rebuilt from primary storage during recovery.

The interaction with retention policy is worth stating, because the two are often designed separately. An object storage lifecycle rule that expires old versions will eventually reach into your backups if versioning and lifecycle are operating on the same bucket. Whether that is acceptable depends on your stated recovery objective: if you need to restore to ninety days ago, no lifecycle rule may delete anything younger than that. Our [retention guide](/blog/document-retention-policy-guide) covers setting those rules deliberately rather than by default.

One further cost point. Backup storage is frequently the fastest-growing line in a self-hosted deployment, because it grows with version history, not with user count. It is worth reviewing quarterly alongside the deployment's other storage, rather than discovering the curve in an annual budget review.

## Encryption and where the keys live

Backups deserve the same encryption discipline as production, with one additional requirement: the keys must not live only inside the system being backed up.

This is the failure that turns a backup into a liability. A backup encrypted with a key stored in the platform's own configuration means a total loss of the platform is also a loss of the ability to read its backups. The key has to be recoverable independently — in a separate secret store, in an escrow, or under the customer's control.

Three practical requirements:

**Encrypt backups at rest and in transit.** A backup copy is a complete copy of the platform's state, and often the least guarded one because it lives outside the production environment's controls.

**Keep the encryption key outside the backed-up system.** Document where it lives, and test that you can retrieve it without access to production.

**Treat backup access as privileged.** A credential that can read backups can read everything. It should be as restricted and as logged as database administrator access, and reviewed on the same cadence.

If you use customer-managed keys, the interaction with backup is worth confirming explicitly, because it is frequently inconsistent: content encrypted with a key you control and backups encrypted with a vendor-managed key, which means the backup path has a different and usually weaker custody story than production. Our [key custody article](/blog/byo-key-encryption-documents) covers why that distinction matters and what to require.

## Ransomware and the deletion threat

The threat model for backups has shifted. The dominant risk is no longer hardware failure but deliberate destruction, either by an attacker or by a compromised credential with delete permissions.

Three controls address it, and all are configuration rather than product features:

**Immutability or object lock.** A retention window during which backups cannot be deleted, even by an administrator. This is the single most effective control against deliberate destruction, because it removes the attacker's ability to destroy the recovery path.

**Separate credentials.** The account that writes backups should not be the account that can delete them, and neither should be the account the application runs as.

**An offline or out-of-band copy.** Something that is not reachable from the production network. It is inconvenient, and it is the copy that survives an attacker with domain credentials.

The interaction with legal hold is worth noting in the other direction: a backup that cannot be deleted for ninety days will preserve content you might prefer to expire. That is a feature for recovery and a complication for retention, and the resolution belongs in the retention policy rather than in the backup design.

## What to do first

If you have no restore capability today, the sequence is: enable object storage versioning, confirm log retention meets your stated objective, back up configuration and secrets somewhere independent, write the consistency check, and run one drill. That is a day of work and it changes your position more than any tuning exercise.

Our [database tuning article](/blog/database-tuning-document-collaboration) covers the point-in-time recovery configuration this depends on, [disaster recovery](/blog/disaster-recovery-document-platform) covers the wider design including site loss, and [monitoring](/blog/monitoring-self-hosted-document-platform) covers how you would know a backup had stopped working.
