---
title: "Collabora in Nextcloud vs a Document Suite"
seoTitle: "Collabora vs a Self-Hosted Document Suite | ShimoDocs"
description: "Collabora on a file platform is an editor hung on object storage. A document suite makes the document the object. Architecture, not another Google Docs list."
layout: standard
category: comparisons
date: 2026-09-20
tags: [collabora, nextcloud, architecture, self-hosted]
faq:
  - question: "Is Collabora in Nextcloud a self-hosted office suite?"
    answer: "It is a self-hosted editor attached to a file platform. Files remain the source of truth; Collabora Online renders and writes them. A document suite makes the document, spreadsheet and presentation the source of truth, with comments, versions, permissions and audit on those objects from the start."
  - question: "When is hanging Collabora on Nextcloud the right architecture?"
    answer: "When the organisation has already paid the cost of Nextcloud as the file system, and the missing piece is opening Office files in the browser. That is an incremental integration. Confirm current Collabora Online and Nextcloud Office behaviour with those vendors."
  - question: "When does a document suite remove an integration surface?"
    answer: "When you are starting from zero and the work is document collaboration rather than file sync. A suite does not need a cabinet, a connector and an editor stitched together; the document layer is the product. You may still want a file platform beside it for the things that should stay files."
---

This is not another Google Docs alternative list. It is an architecture distinction that decides the rest of a self-hosted office evaluation.

One pattern is **object storage and a file tree, with an editor hung on the files**. Nextcloud is the usual cabinet. Collabora Online is the usual editor. Nextcloud Office is that pairing. ONLYOFFICE can occupy the same slot; the architecture does not change when the engine does.

The other pattern is a **document suite**: the document, spreadsheet and presentation are objects from the first save. Real-time sessions, comments, versions, permissions and audit are properties of those objects. Storage is a dependency, not the product.

If you already run Nextcloud, hanging Collabora on it is incremental. If you are starting from zero and the work is document collaboration, a suite removes a whole integration surface. Confirm current Collabora and Nextcloud Office capability with those vendors; this page is about the join, not a feature scorecard.

## The two stacks

| Layer | Files plus Collabora | Document suite |
| --- | --- | --- |
| Source of truth | The file in the cabinet | The document object |
| How editing starts | Open a blob; the editor is a guest | Open a document; the editor is the product |
| Comments and suggestions | Whatever the editor persists into the file | First-class on the object; they survive as collaboration, not only as OOXML |
| Versions | File revisions in the tree | Document history in the suite |
| Permissions | Folder and share ACLs on the tree | Roles on the workspace and the document |
| Audit | Cabinet and server logs, plus whatever the editor records | Document-shaped evidence: who opened, shared, exported this object |
| Real-time session | A property of the editor process | A property of the document service |
| AI | Whatever you bolt on later; confirm data flow | Agents on the document, endpoint you nominate |

The table is a join diagram, not a winner. A strong Collabora session can still leave permissions in the cabinet. A strong suite can still lose a print-fidelity test against Collabora or ONLYOFFICE. Pick the join you are buying.

```figure
type: layers
title: Where the join sits
items: Object storage / file tree | Identity on the cabinet | Editor process (Collabora) | Document service | Document permissions, versions, audit
detail: Nextcloud's centre. Already paid for if you run it. | Shares and group folders. The ACL language of files. | Hung on the tree. Incremental. Confirm with Collabora and Nextcloud. | The suite's centre. Not a Nextcloud app. | Attached to the object from the first save, not reconstructed from a folder log.
caption: Figure 1. Collabora occupies the middle row. A suite occupies the bottom two. Installing an editor does not grow the rows underneath it.
```

## What you are integrating, in the file-plus-editor pattern

Three moving parts, and three vendors to confirm with.

**The cabinet** holds blobs, versions of blobs, and shares. Nextcloud is the common case. A generic S3 bucket plus a file manager is the same pattern with less product around it.

**The editor** loads the blob, lets people type, writes the blob back. Collabora Online is LibreOffice in a server, which is why it feels close to desktop Office for many documents. Concurrent editing, comment storage and what happens to macros are editor questions. Confirm them with Collabora; they are not Nextcloud settings.

**The join** is the connector: who is allowed to open which file, how locks work, what a desktop client does while a browser session is live. This is where most "it works in the demo" surprises live. Confirm the join with both vendors, not one.

That is why this pattern is cheap when the cabinet already exists: two of the three parts are already in production. It is why the pattern is expensive when you are starting from zero: you are standing up a file platform in order to hang an editor on it, plus the join.

## What you are not integrating, in the suite pattern

A document suite still has storage, identity and an application tier. The difference is that those are **dependencies of the document**, not a cabinet the editor visits.

- Storage holds document bodies and attachments. It does not define the sharing model.
- Identity maps groups to roles on workspaces and documents.
- The real-time service is for the document session, not for a lock on a blob.

You give up a native file-sync client unless you run a cabinet beside the suite. That is a real loss for teams whose work is "the folder on my laptop". It is not a loss for teams whose work is "the brief we are writing". [What private cloud document collaboration means](/blog/what-is-private-cloud-document-collaboration) is the layer list; this page is which product owns which layer.

## When the incremental path is the right one

Keep Nextcloud. Add Collabora (or keep it). Do not start a suite project.

This fits when:

- The file tree is already the system of record.
- Editing is opening a docx or xlsx that already lives there.
- Desktop sync is load-bearing.
- You do not need document-layer audit, guest expiry on a single contract, or agents inside the document.

That is a large share of Nextcloud estates. Forcing a suite onto them is how you get two copies of every PDF and a migration nobody asked for. The [ShimoDocs versus Nextcloud](/blog/shimodocs-vs-nextcloud) comparison is the product-level version of the same split.

Confirm Collabora Online licensing and Nextcloud Office packaging with those vendors before you treat the plugin as "free with the cabinet".

## When the suite removes an integration

Start with a suite when the work is document collaboration and you do not already operate a cabinet you intend to keep as the record.

You are not buying "Collabora, but different branding". You are refusing the join: no cabinet ACL to translate into editor sessions, no connector version to pin, no "the file was updated in the client while three people were in Collabora". You still operate Kubernetes, a database and object storage — the [on-premises page](/on-premises) is honest about that — but you operate one document product rather than a platform plus an engine plus a join.

You may still want Nextcloud beside the suite for the file estate. That is coexistence, and it needs a rule about which copy is current. It is not the same as hanging Collabora on the cabinet and calling it a suite.

```figure
type: flow
title: Two ways to get a browser editor
items: Already have Nextcloud | Hang Collabora on the tree | Or start from documents | Run a suite | Optionally keep a cabinet for files
detail: The incremental path. Operations already exist. | Confirm the join, fidelity and concurrent editing with both vendors. | The greenfield path. No cabinet to please. | Document objects, permissions and audit from the first save. | Sync and PDFs can stay in Nextcloud without making it the document layer.
caption: Figure 2. Step two and step four are not interchangeable. One adds an editor. The other adds a document layer.
```

## Tests that distinguish the architectures

Feature lists will not. These will.

1. **Who is the source of truth after a conflict?** Three editors, one desktop client saving the same file. In the cabinet pattern the tree has to win or the editor has to win; write down which. In a suite the document session is the truth and a file export is a snapshot.
2. **Can you audit one document without reading a folder log?** If the answer is a Nextcloud share report plus a Collabora admin screen, you are in the join. If the answer is a document audit, you are in a suite.
3. **Where do comments live if you download the file?** Editor-in-file comments travel with OOXML when the engine persists them. Suite comments may be collaboration data. Both can be correct; they are not the same recovery story.
4. **What do you restore?** A bucket of files, or a document database plus object storage in a consistent pair? The [self-hosted office suite comparison](/blog/self-hosted-office-suite-comparison) is the framework for that question.

Packaging for Collabora Online, Nextcloud Office and Nextcloud's ONLYOFFICE connector changes. Confirm current behaviour with the vendors. The join versus the document object does not.

## Frequently asked questions

### Is Collabora in Nextcloud a self-hosted office suite?

It is a self-hosted editor attached to a file platform. Files remain the source of truth; Collabora Online renders and writes them. A document suite makes the document, spreadsheet and presentation the source of truth, with comments, versions, permissions and audit on those objects from the start.

### When is hanging Collabora on Nextcloud the right architecture?

When the organisation has already paid the cost of Nextcloud as the file system, and the missing piece is opening Office files in the browser. That is an incremental integration. Confirm current Collabora Online and Nextcloud Office behaviour with those vendors.

### When does a document suite remove an integration surface?

When you are starting from zero and the work is document collaboration rather than file sync. A suite does not need a cabinet, a connector and an editor stitched together; the document layer is the product. You may still want a file platform beside it for the things that should stay files.
