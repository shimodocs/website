---
title: "Matter Files: How Legal Teams Run Document Collaboration"
seoTitle: "Document Collaboration for Legal Teams | ShimoDocs"
description: "Matter files, privilege as access control, hold against retention, redlining with outside counsel, and what an eDiscovery request really asks for."
layout: feature
category: industry
date: 2026-09-17
tags: [legal, privilege, matter files, ediscovery]
keywords: "legal document collaboration, law firm document management, privileged documents access control"
---

A legal team's documents are not organised by topic. They are organised by matter: one client, one dispute, one transaction, one investigation, with an opening date and eventually a closing date. The folder tree, the naming convention and every access decision follow from that.

That shape decides what the platform has to do. A general workspace assumes documents accumulate and stay useful. Legal work assumes the opposite: a file is opened for a purpose, filled under pressure, shared outside the organisation, and eventually closed in a way that can be defended years later.

This article covers how legal document collaboration actually works and what that demands of the tools. The mechanics of preservation are covered separately in [Legal Hold in Document Platforms](/blog/legal-hold-document-management).

```callout
tone: note
What follows describes how legal teams work and what it demands of a platform. It is not legal advice. Privilege, hold and retention determinations belong to your counsel and your records team.
```

## The matter is the organising unit, not the folder

A folder is a place to put things. A matter is a boundary: it decides who is on the team, which documents are privileged, what may be shared outside the firm, and when the content is destroyed.

Every matter file carries four properties whether or not the platform knows about them.

**A membership list.** Two partners, one associate, a paralegal, an expert, and outside counsel at another firm. Membership changes when the matter moves, not when somebody changes department. That is the first thing a general workspace gets wrong.

**A confidentiality class.** A routine commercial contract and a pending investigation should not be handled the same way just because both are filed under legal.

**An external edge.** Clients, co-counsel, experts and review platforms all need access. Sharing outward is routine here, and every share has to be reversible.

**A lifecycle.** Open, active, dormant, closed, occasionally held. Access should narrow as a matter ages; it usually widens instead.

Most law firm document management systems model this as workspace, then folder, then file, with permissions per item. That can work if the matter is the top-level container — and you accept that each new matter means rebuilding an access list by hand. If that step is unacceptable, decide before you buy: restructuring a decade of loose folders into matter files is a project nobody enjoys.

## Privilege is an access-control problem

Privilege is usually described as a doctrine. In a platform it is an access-control problem: privileged documents access control comes down to people — who can open this file, in what role, and what happened when the answer changed.

Three failures cause most of the damage.

**Access granted by department instead of by matter.** If everyone in legal can search everything legal holds, inadvertent disclosure stops being bad luck and becomes a property of the system. [Access control best practices for documents](/blog/access-control-best-practices-documents) covers the general model; the operative rule here is narrower: membership by matter.

**Shares that outlive the matter.** An expert gets access, the engagement ends, the access stays. Revocation has to be a step performed at matter close, not a favour someone has to remember to ask for.

**Privilege labels nobody applies.** If marking a document privileged is a manual step, it gets skipped on the busiest day of the matter. The label should be inherited from the matter, with an exception path for the documents that genuinely differ.

Test the accidental-share question directly. Can a matter member send a document outside the matter without a second person approving? And can you establish afterwards that it happened, with a date and a name? You want yes and yes. A platform that cannot answer the second question leaves you reconstructing intent from memory, in front of the other side.

```pullquote
A matter file is not a folder with a different name. It is the list of people who may read what is inside it, and the record of when that list changed.
```

One honest limitation: administrators of a self-hosted deployment can see more than members of a matter can. That is unavoidable, and it should be documented rather than pretended away. Tenant user management in the operations platform lists accounts by tenant with role and status and can enable or disable them in bulk. It is not a matter-level access model, so matter membership has to be built in the workspace structure and reviewed separately.

## Legal hold and retention policy pull in opposite directions

Retention says destroy on schedule. A hold says do not, for this scope, starting now. A platform that treats them as two independent settings will eventually destroy something it was obliged to keep, and nobody notices until the request arrives.

For a legal team the conflict is not an edge case. Firms run holds continuously, for years, across matters that overlap in custodians and date ranges. Two industry consequences follow.

**Retention in legal work is set by matter type, not by document age.** Engagement letters, pleadings, executed agreements and internal advice carry different obligations. A single rule applied to a folder named "Legal" will be wrong for most of what is inside it.

**Hold scope has to be re-runnable.** Custodians change, matters expand, and a scope agreed in month one is usually too narrow by month three. The question to ask a vendor is not whether a hold exists but whether expanding one is a configuration change or a project.

The [retention policy guide](/blog/document-retention-policy-guide) covers how that schedule is built; the [legal hold article](/blog/legal-hold-document-management) covers what the platform must enforce once a hold is placed.

## Review and redlining are not engineering documentation

Engineering documentation converges: many people edit one page toward a single agreed text. Legal review diverges and then converges on purpose. A draft goes out, comments and tracked changes come back from several parties, and the wording is negotiated clause by clause with people who do not work for you.

That produces requirements a wiki-shaped tool handles badly.

**Suggestions separated from comments.** Reviewers need to propose edits without applying them, and the accepting party needs to see exactly what it is accepting. A suggestion and a comment are different acts.

**Version history that carries who and when.** In a dispute the question is usually what the other side had on a particular date, which means authorship and timestamps, not just a stack of diffs.

**Approval as a recorded event.** Sign-off should be a person, a timestamp and a version, not an email saying "looks good" that lives in somebody's mailbox.

**External review without account sprawl.** Counterparties and outside counsel should be scoped to the matter, see only the versions you chose to share, and lose access when it ends. Guest access that survives the matter is how a confidentiality problem becomes a conflicts problem.

The deepest difference is the search boundary. A wiki works because everything is findable; a matter file works because it is not. A platform that indexes every document for the whole organisation is working against the second model.

## What a request actually asks you to produce

A subpoena, a regulator's notice or an eDiscovery demand is not a request for a folder. It is a request for content matching a description — these custodians, this date range, this subject — in a form that can be reviewed and later produced with enough context to be understood.

```figure
type: timeline
title: An eDiscovery production request, and where the money goes
items: Request, subpoena or regulator notice arrives | Custodians and date range are identified | Search, collect and de-duplicate | Review for relevance and privilege | Produce with metadata intact | Privilege log exchanged and defended
detail: Scope is set by the request, not by what happens to be easy to find. | Former names, shared mailboxes and personal workspaces all belong on the list. | Manual collection is where the timeline slips first. | The expensive stage, billed by the hour and reviewable line by line. | Load files, threading, authorship and version history, not a zip of PDFs. | Every withheld document listed with a reason; weak labels surface here.
caption: Figure 1. The first two steps are cheap and set the cost of everything after them. A platform that cannot export with metadata turns step five into a project.
```

Four things decide whether that takes days or months.

**Custodian mapping.** Which account belongs to which person, including former names and shared mailboxes. If that list lives in a hand-maintained spreadsheet, the spreadsheet is the risk.

**Complete repositories.** The personal workspace, the chat thread where the decision was actually made, the version that never made it into the matter folder. Under-collection is discovered late and reported expensively.

**Metadata preservation.** A production carries author, timestamps, recipients, threading and version relationships. A zip of PDFs loses them, and the other side will ask.

**Privilege screening.** Every withheld document needs a reason and a log entry. This is where weak labelling upstream turns into billable hours, because a reviewer had to determine privilege from scratch.

The asymmetry is the argument. Answering well is expensive and bounded. Answering badly invites sanctions, re-production and a second review of everything you already reviewed.

The platform's side of this is narrow and testable: export that carries metadata and version history rather than just files, retention suspended for the scope of the request, and logs recording what was collected and who opened it. In a self-hosted deployment those logs are your own. The operations platform keeps read-only operation logs with event source, operation type, operating user, object and time, notes that records cannot be edited or deleted through the interface, and warns that they may be affected by environment retention policy. A log that expires on your default schedule is not evidence.

If the export path has never been tested on synthetic content, test it once before a matter exists and write down what the output contains.

## Keeping privileged material out of the general workspace

The reasonable case for separation is not that general workspaces are insecure. It is that they are designed for the opposite goal.

```figure
type: compare
title: Where privileged material lives
left: The matter file
right: The general workspace
leftItems: Access by matter membership | Privilege marked at matter level | External shares expire at close | Retention set per matter type
rightItems: Searchable by the whole company | Access by department or team | Links that stay live for years | One retention rule for everything
caption: Figure 2. The left column is a configuration decision someone has to make. The right column is the default, which is how privileged material ends up in a general workspace by accident rather than intent.
```

A general workspace optimises for retrieval: index everything, let people share freely, keep history forever. Those choices are right for company knowledge and wrong for privileged material. Joiners can find a matter they should never have seen; a link shared in 2023 still resolves in 2026; the rule that keeps marketing decks forever also keeps privileged advice.

Privileged and client-confidential material stays in matter files with their own membership, external sharing and retention; general knowledge, templates, precedents and internal policy stay in the open workspace where people can actually find them.

Two caveats.

**Some firms should not bother.** If legal work means reviewing a handful of supplier contracts a month, a separate matter structure is more administration than the risk deserves. Use the general workspace, keep access tight, and revisit when the stakes change.

**Self-hosting does not settle the privilege question.** It moves it. Running the suite in your own Kubernetes cluster removes the vendor from the access path and gives you the logs, the export process and the upgrade control that regulated environments ask about. It also makes your administrators the people who can see everything. The resource planning assumptions — application nodes and middleware calculated separately, high availability for core middleware, roughly double the standard specification on domestic CPU architecture — apply to legal workloads like any other.

A working split: matter files as the default container for client work, a documented exception process for documents that must move between workspaces, and matter close as a real event that revokes external access, applies retention and hands anything under hold to the process in the [legal hold article](/blog/legal-hold-document-management).

The [migration hub](/migration) sets out the sequence for moving from file shares or an existing suite, including the part usually skipped: deciding which content is a matter file and which is general knowledge, before anything is copied.
