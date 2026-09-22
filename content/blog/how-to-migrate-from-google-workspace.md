---
title: "How to Migrate from Google Workspace Without Losing Work"
seoTitle: "Migrating from Google Workspace: A Staged Plan | ShimoDocs"
description: "A staged migration plan for moving documents out of Google Workspace, including export formats, permissions, cutover and rollback."
layout: feature
category: guides
date: 2026-01-26
updated: 2026-09-15
tags: [migration, google workspace, cutover, planning]
keywords: "migrate from google workspace, google docs migration, document migration plan"
faq:
  - question: "What has to be true before starting a Google Workspace migration?"
    answer: "Four things. You have a destination that is running and restore-tested, because you should not migrate onto an unproven system. Identity is connected, with group-to-role mapping live before users are onboarded. You know what counts as in scope, because all documents is not a scope. And a named person owns the end date, not a committee."
  - question: "Why do document migrations fail?"
    answer: "Most failures are organisational rather than technical. The export works and the import works, and then the project stalls because two systems are running in parallel and nobody agreed when the old one stops."
  - question: "Where does fidelity risk actually sit?"
    answer: "Not where people expect. Spreadsheets and Sites carry the highest risk, because a file that opens can still be wrong — formulas, named ranges and behaviour are what get lost. Documents, slides and forms lose comments, layout or response data rather than the content itself. Drive folder structure transfers easily, but the permissions attached to it do not."
  - question: "Do Google permissions transfer to the target platform?"
    answer: "No. Google permissions are per-file, per-user or per-group and inherited from the drive structure, while most target systems organise by workspace or space with group-based roles. It is a translation exercise with a written mapping table rather than a copy. Decide the default for anything that cannot be mapped, and failing closed is the safer choice."
  - question: "Should dormant archives be migrated first?"
    answer: "No. The active-versus-dormant split usually surprises people, and a common result is that under a third of documents have been touched this year. Migrating dormant archives is a separate, lower-priority problem, and doing it first is a good way to burn the momentum of the project."
  - question: "In what order should document classes be migrated?"
    answer: "Pick an order that builds confidence. Internal policies and procedures come first, because they are low controversy and high visibility. Meeting notes and decisions come next, which exercises search. Then project and team workspaces, which exercise permissions and collaboration. The regulated tier goes last, once the tooling is understood."
---

Most document migrations fail for organisational reasons rather than technical ones. The export works, the import works, and then the project stalls because two systems are running in parallel and nobody agreed when the old one stops.

This is a staged plan that keeps both systems working during cutover and ends on a date.

## Before you start

Four things need to be true.

**You have somewhere to land.** If you are moving to a self-hosted suite, the deployment should be running and restore-tested. Do not migrate onto an unproven system.

**Identity is connected.** Group-to-role mapping should be live before onboarding users, not after. Retrofitting permissions is the single most expensive mistake in this kind of project. The [self-hosted collaboration guide](/blog/self-hosted-collaboration-guide) covers what that involves.

**You know what counts as in scope.** "All documents" is not a scope. Pick document classes.

**Someone owns the end date.** A named person, not a committee.

## Step 1: Inventory the real estate

Google Workspace grows sideways. Before exporting anything, get a count of what exists.

Use the Admin console and Drive audit to answer:

- How many shared drives, and how many are actively used?
- What is the file-type distribution?
- Which files are externally shared?
- Which have been modified in the last 90 days?
- What are the ten largest folders?

The active-versus-dormant split usually surprises people. A common result is that under a third of documents have been touched this year. Migrating dormant archives is a separate, lower-priority problem, and doing it first is a good way to burn the project's momentum.

```figure
type: bars
title: Fidelity risk by content type
items: Google Docs to document | Google Sheets to spreadsheet | Google Slides to presentation | Google Forms to form | Google Sites to wiki
value: 45 | 88 | 52 | 40 | 90
caption: Figure 1. Indicative risk of losing behaviour rather than content. Spreadsheets and Sites are where schedules slip, because a file that opens can still be wrong.
```

## Step 2: Decide the destination format for each type

| Source | Target | Fidelity risk |
| --- | --- | --- |
| Google Docs | Document (.docx or native) | Medium — comments and suggestions |
| Google Sheets | Spreadsheet (.xlsx or native) | High — formulas and named ranges |
| Google Slides | Presentation | Medium — layout and fonts |
| Forms | Form | Medium — response data is separate |
| Sites | Static export or wiki | High — usually rebuilt |
| Drive folders | Workspace structure | Low — but permissions are not |

Test each row with five real files from your organisation. Not samples from a help article. The ugliest files you have.

## Step 3: Plan permissions as a mapping, not a copy

Google permissions are per-file, per-user or per-group, inherited from drive structure. Most target systems are organised by workspace or space with group-based roles.

That means you are translating, not transferring. Write the mapping explicitly:

| Google pattern | Target pattern |
| --- | --- |
| Shared drive members | Space membership with a role |
| Folder-level group access | Group mapped to space role |
| Individual file shares | Usually dropped; re-granted on request |
| Anyone-with-link | Explicitly disabled by default |
| External collaborators | Guest accounts, time-limited |

Decide the default for anything you cannot map. Failing closed is safer and creates a manageable queue of access requests. Failing open is how you end up with over-permissioned content in a system that was supposed to be more controlled.

## Step 4: Migrate in waves, by document class

Pick an order that builds confidence:

1. **Internal policies and procedures.** Low controversy, high visibility, proves the platform.
2. **Meeting notes and decisions.** High volume, low sensitivity, exercises search.
3. **Project and team workspaces.** Exercises permissions and collaboration.
4. **The regulated tier.** Last, once the tooling is understood.

Each wave: export, import, verify, announce, then move on. Keep a checklist per wave and record the verification evidence — you will want it for audit.

### Verifying an import

Do not accept "the file opened". Check:

- Heading structure survived.
- Comments and suggestions are present or deliberately dropped.
- Tables render correctly.
- Embedded images exist.
- Links to other documents resolve or have been rewritten.
- Permissions on the new object match the mapping.

A simple per-wave sample of ten files, checked properly, catches most systemic problems.

```figure
type: timeline
title: The parallel-running window
items: Announce the end date | Migrate the first wave | Source becomes read-only | Access is revoked | Archive retained cold
detail: On day one, not when you feel ready | Policies and meeting notes, verified properly | Read-only removes ambiguity before revocation removes access | The step that actually retires the old system | A cold export, not a live read-only tenant
caption: Figure 2. Most stalled migrations are stuck between steps three and four, because a live read-only tenant keeps the decision reversible.
```

## Step 5: Run in parallel, with a deadline

Parallel running is necessary and dangerous. It doubles the places a document can be edited, and ambiguity about which copy is authoritative causes real incidents.

Make it bounded:

- **Announce the end date on day one**, not when you feel ready.
- **Set the old system read-only before you revoke access.** Read-only removes ambiguity; revocation removes access.
- **Post a "where do I find…" guide** in the new system, and keep it short.
- **Nominate a triage owner** for the first two weeks after cutover.

One quarter of parallel running is usually enough for a mid-size organisation. Longer than that and people assume both systems are permanent.

## Step 6: Archive rather than delete

Keep the source export for a defined retention period. You will need it for the access request that arrives three months later, and for the person who insists a document had a paragraph that is no longer there.

Archive as a cold export, not as a live system. A live read-only tenant maintains two permission models and keeps the migration looking reversible, which is exactly what stalls projects.

## Common failure modes

**Migrating everything at once.** Verification becomes impossible and the team loses confidence.

**Copying permissions file by file.** Produces a mess and takes longer than remapping.

**No end date.** Parallel running becomes permanent and both systems rot.

**Skipping the fidelity test.** The quarterly model breaks in week three and the project is blamed for it.

**Ignoring external shares.** They are the ones with compliance consequences, and they are usually discovered late.

**Migrating dormant archives first.** Burns time on content nobody needs.

## After the cutover

Two things determine whether the migration sticks.

**Search quality.** If people cannot find what they need in the new system, they will ask a colleague to send the old file. Invest in structure and naming before the cutover, not after.

**AI availability.** A self-hosted suite with a configurable AI endpoint gives you something the old system could not — an assistant that reads your documents without sending them anywhere. Announce it early; it is the strongest argument for the change. See [AI agents in documents](/blog/ai-agents-in-documents-security).

The same staged order applies when the source is Confluence rather than Drive. There is still no connector; [migrating from Confluence without one](/blog/migrating-without-confluence-connector) is the rebuild list.

If you are still choosing a destination, start with [what private cloud document collaboration is](/blog/what-is-private-cloud-document-collaboration) and the [Google Docs alternative](/blog/google-docs-alternative-private-cloud) breakdown.

Once the destination is settled, the [migration hub](/migration) covers what imports, what has to be rebuilt rather than transferred, and how to verify the move before the old system is retired.

## Frequently asked questions

### What has to be true before starting a Google Workspace migration?

Four things. You have a destination that is running and restore-tested, because you should not migrate onto an unproven system. Identity is connected, with group-to-role mapping live before users are onboarded. You know what counts as in scope, because all documents is not a scope. And a named person owns the end date, not a committee.

### Why do document migrations fail?

Most failures are organisational rather than technical. The export works and the import works, and then the project stalls because two systems are running in parallel and nobody agreed when the old one stops.

### Where does fidelity risk actually sit?

Not where people expect. Spreadsheets and Sites carry the highest risk, because a file that opens can still be wrong — formulas, named ranges and behaviour are what get lost. Documents, slides and forms lose comments, layout or response data rather than the content itself. Drive folder structure transfers easily, but the permissions attached to it do not.

### Do Google permissions transfer to the target platform?

No. Google permissions are per-file, per-user or per-group and inherited from the drive structure, while most target systems organise by workspace or space with group-based roles. It is a translation exercise with a written mapping table rather than a copy. Decide the default for anything that cannot be mapped, and failing closed is the safer choice.

### Should dormant archives be migrated first?

No. The active-versus-dormant split usually surprises people, and a common result is that under a third of documents have been touched this year. Migrating dormant archives is a separate, lower-priority problem, and doing it first is a good way to burn the momentum of the project.

### In what order should document classes be migrated?

Pick an order that builds confidence. Internal policies and procedures come first, because they are low controversy and high visibility. Meeting notes and decisions come next, which exercises search. Then project and team workspaces, which exercise permissions and collaboration. The regulated tier goes last, once the tooling is understood.
