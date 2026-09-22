---
title: "Leaving a Document Platform: Lock-In and the Exit Path"
seoTitle: "Document Platform Lock-In and the Exit Path"
description: "A .docx file exports. Permissions, share links, comments and embedded objects do not. How to test portability before you sign and keep the exit cheap."
layout: standard
category: guides
date: 2026-09-17
updated: 2026-09-17
tags: [lock-in, data portability, export, vendor exit]
keywords: "document platform lock-in, data portability, document export, vendor exit plan"
---

Most teams find out what a document platform holds on the day they try to leave it. That day is rarely chosen. It arrives with a renewal quote, or an acquisition, or an instruction to consolidate onto whatever the parent company already pays for.

By then the file count is a footnote. Documents export. What does not export is the structure around them: who could reach what, which links are live outside the company, which comment threads carry the reasoning behind a decision, which spreadsheets are embedded in which documents, and which automations run on top of all of it.

Lock-in is not in the bytes. It is in everything the bytes are wired to.

## Where lock-in actually lives

Six places hold a team inside a platform, and only the first is about file formats.

**Permissions and group structure.** Access is a graph: users, groups, workspaces, folders, per-object grants, guest exceptions, and a service account nobody remembers creating. A file copy carries none of it. Rebuilding it means re-deriving each person's effective access, and [the permissions model of the source platform is not the permissions model of the destination](/blog/access-control-best-practices-documents).

**External share links.** Every link shared with a client, contractor or supplier is an access path that lives outside your directory. When the old platform is switched off, those links either resolve somewhere new or break on purpose. That is a decision with a name attached to it, and it is not in the export.

**Comments and version history.** Comments record why a clause changed. Version history is where people look when something went wrong six months ago. Both are platform-side objects. In a self-hosted ShimoDocs deployment, the editor configuration surface exposes the number of versions saved per file (default 100) and the number of recent entries that can be restored (default 2,000) as quotas — a reminder that history is a store with its own retention settings, not something a document carries with it.

**Embedded sheets, slides and forms.** A document with an embedded live spreadsheet is two objects sharing one title. Export the document and you get a frozen copy of the sheet or a broken reference, depending on the target format. The next editor sees which.

**Integrations and automation.** Webhooks, API scripts, chat notifications, approval flows — whatever a team built on top of the platform. Invisible to a content export, expensive to rebuild, and usually discovered late.

**Search index and metadata.** Ranking, tags, view counts, last-opened dates, template links. Some can be regenerated from a fresh crawl of the files. None of it arrives with them.

```figure
type: compare
title: What a file export carries
left: Travels well
right: Stays behind
leftItems: Document text and formatting | Sheet values and formulas | Presentation slides | File names and folder structure | Uploaded file attachments
rightItems: Group and role assignments | External share links | Comment threads and mentions | Version history and authorship | Embedded sheets and automations
caption: Figure 1. The left column is what a format-preserving export gives you. The right column is what has to be rebuilt, re-decided, or accepted as lost.
```

## What "export to .docx" does not answer

A document export answers one question: can this file open somewhere else? An exit asks a different one: when the old platform is switched off, can the team keep working?

The gap is wider than it looks.

**Format fidelity is per format.** .docx is a reasonable target for a static report and a lossy one for a document whose value is in its structure — tracked suggestions, linked tables, embedded views, formulas that reference another file.

**Export is a job queue.** In a ShimoDocs deployment the editor configuration surface names an import/export timeout parameter with a default of 10 minutes, which is the shape of the platform's own expectation: bulk transfer is scheduled work with windows and failures, not one afternoon's download. Plan the exit as a queue you operate, with retries and a record of what completed.

**Export can be switched off.** The same configuration surface treats export as per-format feature switches — docx, Markdown, PDF, image, xlsx, pptx — each defaulting to on and each adjustable for the deployment. Portability is an administrative setting as much as a product capability, so ask who can change it and what the change process is.

**A backup is not an exit.** The deployment documentation puts the backup scope at MySQL, MongoDB, Redis, object storage, and the installation and environment configuration files, with the client responsible for the strategy, the safekeeping, the retention period and the recovery drills. Database backups on the built-in middleware run once per day and are retained for 7 days by standard; object storage retention follows the customer's own policy. Object storage copies inside the cluster are explicitly redundancy rather than backup. The post-recovery checklist finishes by confirming that users can log in and that core documents can be created, edited, saved, imported and exported. That proves the platform came back. It says nothing about whether the content leaves in a shape another platform can read.

```callout
tone: note
title: Run the test while you still have leverage
The export test costs one representative folder and about a week. Before you sign, that is a reasonable request. After the renewal quote lands, the same request competes with everything else in the quarter. Keep the result in the contract file: the folder you exported, the date, the formats that came back, and the list of what did not survive.
```

## Test portability before you sign

Four checks, each cheap while the contract is still being negotiated.

**Export a representative folder.** Not a sample document — a folder with the messy parts: nested groups, one restricted file inside an otherwise open directory, an embedded sheet, a document with two years of comments. What the export does to that folder is what it will do to the other forty thousand. One folder proves the method works. It does not prove the whole repository behaves the same way, and no test can.

**Check that permissions map.** Role vocabularies are short in every destination — owner, editor, commenter, viewer — and a role model has no equivalent for a deny. Write the mapping down group by group and name who signs it off. In a ShimoDocs deployment the operations platform manages accounts per tenant: it lists a team's users with their role and status and can enable or disable accounts in bulk. Reproducing a source group structure is not part of that flow, so those records come from the old platform or from your identity provider. The [shared-drive migration plan](/blog/migrating-shared-drives-to-a-document-platform) covers that mapping work in detail.

**Check that revision history and comments survive.** Count versions and comment threads before the export and after the import. If the destination cannot show who changed a paragraph, the export lost the reasoning, not just the text.

**Check that embedded objects survive.** Export a document with an embedded spreadsheet and a presentation, open it at the destination, and confirm the sheet is still a sheet rather than a picture of one.

Then write down who owns the test. If nobody owns it, nobody runs it, and the first person to notice will be someone who cannot open a file after cutover.

## Keep the exit cheap once you are in

```figure
type: flow
title: The exit path
items: Inventory | Export and verify | Map permissions | Run both | Retire the old platform
detail: What exists and who can reach it | Open the files; check the mapping | Groups, roles and live share links | Parallel operation before cutover | Delete on a named date
caption: Figure 2. The order matters more than the schedule. Every step is cheaper if the previous one produced a written record.
```

Four habits keep the next exit from becoming a project.

**Keep one canonical store.** Two platforms in parallel means two permission graphs, two sets of live links, and two answers to "where is the current version". Pick one, and make the other read-only or archived.

**Do not depend on what does not export.** If a workflow exists only as an automation inside the platform, you have already decided to rebuild it. Do that knowingly, and keep the decisions behind it in a document that does travel.

**Name an owner for the export test.** The backup guidance is explicit that the client owns the strategy, the drills and the acceptance of the result. The export test is the same kind of obligation and needs the same kind of owner: a name, a runbook, a date.

**Re-run it after each major upgrade.** Upgrades change database schemas and service configuration, and the upgrade flow shows those changes before it applies them and keeps a history of what ran. Add the export test to the upgrade checklist at the point where a version changes an export path.

## The limits you have to accept

Some things genuinely do not survive a move, and the honest version of an exit plan names them.

Comment threads usually arrive flattened into the document or not at all. Version authorship is often lost even when the text is intact. Live external share links break unless the destination can reissue them on comparable terms. Automations are rebuilt by hand. Attachments move, but the folder permissions they inherited do not.

That leaves a decision rather than a technique: which losses your team can live with, and which one ends the project. A team that publishes policies and reads them does not need comment history, and a wiki-shaped tool may be the cheaper destination — moving read-mostly published pages into a document suite is work that buys nothing. A team that has to show who approved a clause cannot lose authorship. Write the answer down before a renewal forces it.

Two things are worth saying plainly. ShimoDocs has no connector for Confluence, Google Workspace, SharePoint or Notion, so an exit into it is exported files plus a written mapping exercise, not a sync job. [Migrating from Confluence without a connector](/blog/migrating-without-confluence-connector) is that rebuild in detail. If your team will not do that work, that is a reason to choose a different destination or to stay where you are. And if the content is not sensitive and the team is small, the cheapest exit is often no exit at all; the [migration hub](/migration) and the [on-premises](/on-premises) pages are for the cases where the move is worth what it costs.
