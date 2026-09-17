---
title: "Migrating a Shared Drive Without Losing Permissions"
seoTitle: "Shared Drive Migration: Permissions First | ShimoDocs"
description: "Folder inheritance and document permissions are different models. How to inventory a file server, phase the cutover, and handle the files nobody claims."
layout: magazine
category: guides
date: 2026-09-17
tags: [migration, permissions, file server, cutover, archive]
keywords: "migrate shared drive, file server to document platform, document permissions migration"
---

A shared drive is not one system. It is a folder tree with an access control list at every level, a decade of exceptions layered on top, and a group of people who have learned that asking for access takes three days.

Copying the files is the easy half. Permissions are where the project goes wrong, because folder inheritance and document permissions are not the same model, and the mapping between them loses information in ways that only appear after cutover.

This is a plan for an SMB share, an NFS mount or a SharePoint library moving onto a document platform: what to measure first, which parts to phase, and what to leave exactly where it is.

## Folder inheritance is not a permission model you can copy

On a file server, access is computed from the path. A folder grants Modify to a group, everything beneath it inherits that grant, and the effective permission on a file is the accumulation of what sits above it minus any deny entries attached to the file itself. The file system answers one question: can this principal reach this node.

A document platform answers a different question. Which container does this object belong to, and what role does the principal hold there? Access follows membership of a workspace or folder, and the role is a short vocabulary — owner, editor, commenter, viewer — rather than a bitmask.

The difference is invisible while the folder tree is intact. It shows up the moment you translate it:

- **Deny entries disappear.** One restricted file inside an otherwise open folder is the common case, and a role model has no equivalent for a denial. Re-express each one as an explicit restriction on the new object, or isolate the file in a closed folder.
- **Broken inheritance is a classification signal.** Where someone stopped a file or folder from inheriting, the reason is usually that the content is sensitive. Treat the list as input to classification rather than as noise to clean up, and read [access control for document platforms](/blog/access-control-best-practices-documents) before deciding what each entry becomes.
- **Nested groups flatten.** Access computed through three levels of nesting, plus a service account and the backup agent, becomes a plain list of who holds which role. Someone has to check that by hand.

| Shared drive pattern | Document platform equivalent | What does not carry over |
| --- | --- | --- |
| Folder group with change access | Workspace membership with an editor role | The line between editing and deleting |
| Read-only group on a subfolder | Viewer role on that folder | Precedence when a user is in both groups |
| Explicit deny on one file | Nothing automatic | The denial itself |
| Broken inheritance | Nothing automatic | The reason it was broken, which was the point |
| Individual file grants | Re-granted on request | An accurate record of who asked |
| Anyone with the link | Off by default | Nothing worth keeping |

Write this table before anything moves, and put a default in the last column. Unmapped access should fail closed: an access request is a five-minute ticket, while an over-permissioned repository is a finding that arrives nine months later.

## The "everyone has access" legacy nobody wants to own

Most shares older than five years carry a root grant that should not be there: Domain Users or Everyone with Modify, added during a migration in 2010 and never revisited, because whoever closes it acquires a ticket queue and gets blamed for the Thursday afternoon finance cannot open a folder.

**Open by default was usually not a decision.** It was a default nobody revisited, and closing it is real work rather than a configuration change.

**Sometimes it was a decision.** A published library, a read-only reference set, a drop folder any team may write to and none may read — those are legitimately open. Do not invent controls for content whose purpose is to be reachable. Measure instead of debating: take the ten folders where over-exposure would actually matter, enumerate who can reach each one, and write the answer down. The finding is rarely "everyone has access to everything". It is that four folders are more exposed than anyone believed, and two of them are meant to be.

## Inventory what is used, not what exists

The inventory decides the scope, so collect it before exporting anything:

- **Total files and total bytes**, split by top-level folder.
- **Files modified in the last 12 months**, and in the last 90 days.
- **Distinct last-modified-by accounts.** This is the population you will ask to claim content, and it is far smaller than the file count.
- **Deepest paths and largest folders.** Depth predicts mapping pain. Size predicts transfer time.
- **File-type distribution**, so the format decisions use the real spread rather than the five types you assume.
- **ACL exceptions**: denies, per-file grants, and folders that stopped inheriting.

The third number changes the plan. A drive with four million files will often show only tens of thousands modified in the past year, touched by a few hundred accounts. The rest is dormant, and dormant content is a different project — a records problem wearing a collaboration problem's clothes.

```callout
tone: note
title: Last-access times are not evidence
Windows delays last-access updates on NTFS by default, and NFS administrators routinely mount with `noatime` for performance. A file whose last access reads 2019 may simply have a timestamp nobody updated. Use last-access data to confirm a pattern across a folder, never as the only reason a single file is left behind.
```

```figure
type: screenshot
src: /assets/extract-1.webp
alt: A document open in an editor with a live cursor labelled James, two resolved comments in a sidebar, and a table naming the owning team for each workstream.
width: 1672
height: 941
caption: Figure 1. What the destination actually holds: one file, named owning teams inside it, a live cursor, and comments anchored to lines. Permission is granted on this object and the workspace around it, not on the path it happened to sit under.
```

## The long tail nobody will claim

Dormant content has no owner who will volunteer, because claiming it means accepting responsibility for reviewing it. So make claiming the default-free path:

1. **Publish the inventory by folder with the last-modified-by account named.** People recognise their own name in a list.
2. **Ask for one of three answers**: migrate it, archive it as it stands, or dispose of it at the end of its retention period.
3. **Set a date.** Folders with no answer by that date are archived, not migrated.
4. **Do not let the migration team adjudicate content.** They have no basis to decide whether a 2017 contract folder is still live.

The tail is also where the personal data sits: old CVs, scanned identification, exported contact lists, customer records with columns nobody should keep. Moving that content inherits the liability and the review obligation; leaving it does not remove either. Pair the archive decision with a real rule — the [retention policy guide](/blog/document-retention-policy-guide) covers the schedule, and [legal hold](/blog/legal-hold-document-management) covers the exception that overrides it.

## Why a big-bang cutover fails, and what a phased one looks like

A single-weekend cutover fails for four reasons that have nothing to do with the software.

**Verification becomes impossible.** Checking ten files per wave catches systemic import problems. Checking four million files at once catches nothing, because nobody can look at them.

**Over-sharing is silent.** Under-permissioned users file a ticket within the hour. Over-permissioned users do not, and you discover the problem during an audit or an incident.

**There is no rollback.** Once people have edited in the new system, reversing costs a second migration, so the decision stops being reversible the moment you start.

**Links break all at once.** Drive letters, UNC paths, desktop shortcuts, automounts, and spreadsheet formulas that reference another workbook by path. Hyperlinks inside documents can be rewritten in a batch; formula references are content and usually cannot. Count them first, because the count decides whether you rewrite, keep an alias to the old share, or accept the breakage.

```figure
type: flow
title: A phased cutover, in the order that keeps it reversible
items: Pilot one team | Wave by document class | Source goes read-only | Access is revoked | Cold archive retained
detail: Content with real permissions that a tolerant team owns | Export, import, verify against the mapping, announce | Ambiguity removed before access is | The step that retires the system, and the one teams skip | A documented retrieval path for the retention period
caption: Figure 2. The read-only window is the part to bound. A quarter covers a full planning cycle; longer than that and people assume both systems are permanent.
```

Phasing works because each wave produces evidence. Move one team, verify permissions against the mapping table, fix what the sample exposes, then widen the scope. Keep the source share read-only for a defined window: long enough to cover one planning cycle, short enough that nobody settles into two systems. Announce the revocation date at the start, not when you feel ready.

Revocation is where the platform's own administration surface matters. ShimoDocs exposes it through the operations platform's user management: select the tenant, search by username, email or ID, confirm the selection count, then disable the accounts in bulk and refresh the list to confirm the status changed. It is the same operation you need during offboarding, which is a second reason to get the identity mapping right before the first wave.

## Leave the archive where it is

The honest case for a large archive is that it is not a document collaboration problem. If a group holds 12 TB of closed projects, drawings and scans whose last edit was 2018, moving it onto a document platform transfers bytes and builds an index nobody queries — and puts records under a permission model you then owe a review.

Leaving it in place has conditions, and they are not free:

- **Read-only and backed up**, with a restore you have actually tested rather than a job that reports success.
- **A named owner** that is a team, not the one person who still remembers the share.
- **Retention still applied.** Read-only is not a legal hold, and it does not suspend a disposal obligation.
- **A cost you accept.** If the reason for the project is an out-of-support array or a licence renewal, the archive *is* the project, and it has to move.

The same honesty applies to the destination. A plan to close the file server in one quarter while keeping every folder path identical will not hold: the paths are what the new model does not have, and the exceptions are what it cannot express.

A shared drive migration is finished when the old share is read-only, the alias points at the new location, one access review has been completed against the mapping table, and the announced end date has passed. Until then you are running two permission models, and the older one is still live.

If ShimoDocs is the destination, two things must be true before the first wave. The deployment must be proven, as the [self-hosted collaboration guide](/blog/self-hosted-collaboration-guide) sets out, and the [quick start guide](/docs/deployment/getting-started/quick-start) is explicit that the all-in-one single-node path is sized for verification rather than long-term production traffic — size the cluster deployment against the live content you intend to move, not the archive you intend to leave. The [migration hub](/migration) covers what transfers, what is rebuilt, and how the move is verified, and the [Google Workspace plan](/blog/how-to-migrate-from-google-workspace) applies if a cloud drive is retired in the same project.

ShimoDocs is free for teams of up to five people, and the Team plan is $5 per user per month, 20% off billed annually. That pricing is irrelevant if the archive stays on the old array — a legitimate outcome, and often the correct one.
