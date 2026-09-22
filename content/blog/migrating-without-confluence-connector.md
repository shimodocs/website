---
title: "Migrating from Confluence Without a Connector"
seoTitle: "Migrate Confluence Without a Connector | ShimoDocs"
description: "There is no Confluence, Google Workspace, SharePoint or Notion connector. What file import can move, what you rebuild, and how to plan the cost."
layout: briefing
category: guides
date: 2026-09-21
tags: [migration, confluence, import, lock-in]
faq:
  - question: "Is there a Confluence connector or importer?"
    answer: "No. The product documentation describes no connector that reads a Confluence space, a Google Workspace drive, a SharePoint site or a Notion workspace and recreates it inside the suite. Content moves by export from the source and import of supported files. The tree, the permissions and the conversation are rebuilt."
  - question: "What can you actually import from Confluence?"
    answer: "Files in the formats the editor configuration documents as switches: Word and related documents, markdown and plain text, Excel and CSV, PowerPoint, tables, mind maps, and listed attachment types. The Confluence space export is HTML. HTML is not one of those switches, so the HTML has to be converted to markdown or Word before import. Confirm the conversion on a messy space before you schedule the rest."
  - question: "What does not come across from Confluence?"
    answer: "Space and page trees, space permissions and page-level overrides, macros and Marketplace apps, Jira linkage, and comment threads as they existed on the page. An imported document carries the history it was exported with, not the history the page had. Those are rebuilds, not import failures."
---

There is no connector. That is the whole first answer, and it is the one a Confluence migration plan has to start from.

The product documentation does not describe a connector that reads a Confluence space, a Google Workspace drive, a SharePoint site or a Notion workspace and recreates it inside ShimoDocs. Nothing in this article should be read as a promise that one is coming. Migration is export from the source, conversion into a format the suite actually imports, and a deliberate rebuild of structure, permissions and conversation.

If that cost is unacceptable, stay, or pick a destination that does sell a Confluence importer — and confirm what that importer actually preserves. This page is what moving **without** a connector looks like.

## 1. What the suite will import

Content arrives as files. Each import type is a feature switch in the editor configuration, with its own default, not a marketing claim.

| Source format | Lands as | Extensions (as documented) |
| --- | --- | --- |
| Word documents | Document | doc, docx, wps, wpt |
| Markdown and plain text | Document | md, txt |
| Excel workbooks and CSV | Spreadsheet | xls, xlsx, xlsm, csv |
| PowerPoint decks | Presentation | ppt, pptx |
| Tabular data | Application table | csv, xls, xlsx |
| Mind maps | Mind map | xmind |
| Attachments | Stored or converted | svg, xml and standard attachment types |

That list is the [migration hub](/migration) table, taken from the editor configuration reference. Test it on your worst files before you promise a date. A format that will be *attempted* is not a format that will survive a workbook with external links or a deck with embedded fonts.

**Confluence's export is HTML**, plus attachments. HTML is not a row in the table above. Plan a conversion step: HTML to markdown or to Word, then import. Attachments usually travel with the export; internal links that pointed at them usually break. That conversion is part of the project, not a footnote.

User accounts are a separate import. The system configuration reference exposes a batch limit of up to **500 user rows** per import. Check the live setting before you commit to an onboarding window. Connect the identity provider first and let groups drive roles; a local user list you later retrofit is the expensive version.

```figure
type: flow
title: What a Confluence page actually does on the way in
items: Space export (HTML) | Convert to md or docx | Import as a document | Rebuild the tree | Map permissions
detail: Confluence's export. Faithful enough for prose; macros flatten or vanish. | Required, because HTML is not an import switch. | Editor configuration determines what is attempted. | Folders and workspaces, by hand or by script you write. | Group roles, not page-level overrides. The mapping table is the deliverable.
caption: Figure 1. Steps four and five are the project. Steps one to three are the file transfer people mistake for the project.
```

## 2. What you rebuild, because nothing will carry it

These are losses to name in the plan, not defects to file.

- **Space and page hierarchy.** The suite is folders and workspaces around files, not a Confluence page tree. Someone designs the new tree. A script can help; it cannot guess which nested page was the real home.
- **Permissions.** Confluence is per-space with years of page-level overrides. The suite is group-based roles from the directory. There is no one-to-one copy. The mapping table is the artefact the rest of the migration waits on. The [Confluence alternative page](/solutions/confluence-alternative) is blunt about this for the same reason.
- **Macros and Marketplace apps.** They have no import target. Each load-bearing macro is a rebuild or a deletion. Inventory them before you export.
- **Jira linkage.** Issue keys in prose will still be text. Live gadgets and the "open this page from the ticket" habit will not. If that habit is the product, you are not replacing Confluence; you are replacing an Atlassian workflow. Keep Jira, move the documents, and be explicit.
- **Comments and page history.** Losing the discussion while keeping the body is the usual bad outcome. An imported file carries the history it was exported with, not the history the page had. Decide which spaces may lose comments, in writing, before cutover.
- **Who owns the space.** Unowned spaces should not be in the first wave. They are how stale trees get a second life.

```figure
type: matrix
title: What an export contains, against what the suite can land
items: Page body prose | Attachments | Page tree | Space and page permissions | Macros and Jira gadgets
detail: Survives HTML export; convert, then import as a document. | Usually travel; links to them usually break. | Rebuilt. Not an import field. | Translated via a mapping table, never copied. | No target. Rebuild or drop.
xAxis: MOVES AS A FILE
xAxisEnd: REBUILT BY PEOPLE
caption: Figure 2. The right-hand column is the schedule. A plan that only budgets the left-hand column will slip in week three.
```

## 3. A sequence that does not pretend there is an importer

The [Google Workspace migration plan](/blog/how-to-migrate-from-google-workspace) is staged around inventory, format, permissions, cutover and an end date. The same order applies here, with Confluence-shaped work in the middle.

**Inventory spaces by owner, not by size.** Count pages, attachments, macros, and whether Jira is load-bearing. Retire empty and unowned spaces in Confluence before you export them.

**Pick a conversion path and prove it on the messiest space.** One space, HTML export, convert, import, open, search, follow an attachment. If that loop is ugly, the rest of the estate will not be smoother.

**Write the permission mapping before any bulk import.** Groups you already have in the directory, roles the suite actually has, a default for anything that cannot be mapped. Failing closed is the safer default.

**Move users in batches of at most 500 rows**, after identity is connected. Do not onboard people onto local accounts as a shortcut.

**Wave the content.** Internal reference spaces first. Team working spaces second. Anything with legal or customer sensitivity last, once the conversion is boring.

**Retire Confluence on a date.** A read-only Confluence left reachable is the most reliable way to double the project. The [lock-in and exit article](/blog/document-platform-lock-in-and-exit-planning) is the same advice in the other direction: if you will not do this work, pick a different destination or stay.

## 4. How to talk about cost without inventing a connector

The rebuild is the cost. File transfer is not.

A space with a clean tree, few macros and comments nobody needs is cheap to move: convert, import, fix links. A space that is the engineering handbook, wired into Jira, with a decade of page restrictions, is a documentation redesign that happens to include an import. Calling both "migration" is how budgets die.

There is no honest way to quote a page-per-hour rate from this site. There is an honest way to refuse a plan that assumes the tree, the ACLs and the macros arrive with the HTML.

If the evaluation is still "wiki or suite", read [ShimoDocs versus Confluence](/blog/shimodocs-vs-confluence) before you budget a move. Many organisations should keep the wiki for hierarchical engineering docs and move only the document-shaped work. That is a smaller import, on purpose.

## Frequently asked questions

### Is there a Confluence connector or importer?

No. The product documentation describes no connector that reads a Confluence space, a Google Workspace drive, a SharePoint site or a Notion workspace and recreates it inside the suite. Content moves by export from the source and import of supported files. The tree, the permissions and the conversation are rebuilt.

### What can you actually import from Confluence?

Files in the formats the editor configuration documents as switches: Word and related documents, markdown and plain text, Excel and CSV, PowerPoint, tables, mind maps, and listed attachment types. The Confluence space export is HTML. HTML is not one of those switches, so the HTML has to be converted to markdown or Word before import. Confirm the conversion on a messy space before you schedule the rest.

### What does not come across from Confluence?

Space and page trees, space permissions and page-level overrides, macros and Marketplace apps, Jira linkage, and comment threads as they existed on the page. An imported document carries the history it was exported with, not the history the page had. Those are rebuilds, not import failures.
