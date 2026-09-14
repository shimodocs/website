---
title: "Building a Document Retention Policy That Holds"
seoTitle: "Document Retention Policy Guide | ShimoDocs"
description: "How to build a document retention policy a platform can actually enforce, including the copies that deletion usually misses."
layout: briefing
category: security
date: 2026-03-11
tags: [retention, compliance, deletion, records]
keywords: "document retention policy, records retention schedule, defensible deletion"
---

Most retention policies are written as intent and enforced as habit. The document says seven years; the shared drive has files from 2011; nothing has ever been deleted because nobody was sure it was safe to.

The gap matters more than it used to, because retaining personal data indefinitely is itself a compliance problem. A retention policy that is not enforced is not a neutral omission — it is a growing liability.

> This article is a practical framework, not legal advice. Retention periods depend on jurisdiction, sector and record type.

## Retention is three different things

Teams conflate them, and the conflation is why policies stall.

**Retention** is a minimum: keep this for at least this long. Driven by statute, regulation or contract.

**Disposal** is a maximum: do not keep this longer than this. Driven by data protection principles and, increasingly, by litigation risk.

**Legal hold** is a suspension: keep this regardless of the other two, because it is relevant to a matter. Covered in our [legal hold guide](/blog/legal-hold-document-management).

A single number in a policy table cannot express all three. Records with a statutory retention period usually also need a disposal rule after that period expires, and both are overridden by a hold.

## Start with a schedule, not a platform

The schedule is the substantive work. A workable one has four columns.

| Record class | Retention | Trigger | Disposition |
| --- | --- | --- | --- |
| Contracts and agreements | Period of the relationship plus a defined tail | Termination | Destroy |
| Financial records | Statutory period | End of financial year | Destroy |
| Personnel records | Employment plus a defined tail | End of employment | Destroy |
| Operational correspondence | Short, defined period | Creation | Destroy |
| Policies and procedures | Until superseded plus a defined tail | Supersession | Archive then destroy |
| Content under legal hold | Indefinite | Hold release | Revert to class rule |

The **trigger** column is the one most often missing, and it is what makes the rule enforceable. "Seven years" is ambiguous; "seven years from the end of the financial year in which the record was created" is a rule a system can apply.

## Where retention fails in a document platform

This is the part that separates a policy from an outcome.

```figure
type: matrix
title: Where a copy of the document lives, and whether deletion reaches it
items: Primary storage | Search index | Caches and previews | Backups | AI retrieval copies
detail: Deletion works here. This is the layer every policy assumes it is talking about. | A full-text copy that often outlives the source unless the platform rebuilds or purges it. | Derived artefacts with their own expiry, frequently longer than anyone intended. | Deliberately retained, which is correct — but the policy has to say how long, and the restore process has to respect deletions. | Chunks stored for retrieval, with a retention window that is usually separate and less documented.
xAxis: DELETION REACHES IT
xAxisEnd: DELETION USUALLY MISSES IT
caption: Figure 1. Answering a deletion request by removing the document from the library addresses one of five rows. The remaining four are where findings come from.
```

Three practical requirements follow:

**Deletion has to be a platform capability, not a manual task.** If disposing of a record class means someone remembers to do it, it will not happen at scale.

**The backup question needs an explicit answer.** Backups exist to be restored, so deleting from them is usually undesirable. The common position is that backups are excluded from routine deletion but must respect holds and are aged out on their own schedule. Whatever you choose, write it down — an unstated position is indistinguishable from an oversight during a review.

**The AI retrieval layer needs its own retention rule.** If content is chunked and stored for retrieval, that store has a retention period, and it is often documented less carefully than the source.

## Automatic against manual retention

Manual retention works at small scale and fails predictably as volume grows. Automatic retention is what makes the policy real.

What to look for in a platform:

- **Rules applied by workspace or record class**, not per file.
- **A trigger that is a date the system knows** — creation, last modification, a metadata field.
- **Disposition actions** that are concrete: destroy, archive, or move to cold storage.
- **A preview or dry-run mode**, so a misconfigured rule does not destroy a repository on its first run.
- **An audit trail of disposition**, recording what was destroyed, when and under which rule.
- **Hold precedence**, so a record under legal hold is excluded from automatic destruction without manual intervention.

That last one is where manual processes fail most often, because the person applying the retention rule does not know about the hold.

## Where the schedule meets reality

A schedule is a design artefact. Making it operate is a different exercise, and the friction is predictable.

**Nobody knows the class of a document.** Users filing content are focused on the task, not on the retention table. If classifying a document is a required field, people will pick whatever is fastest. If it is derived from the repository, it is accurate by construction. Prefer derived classifications over user-selected ones.

**Rules collide across repositories.** A document copied from a working repository into a project repository now has two candidate classes. Decide the precedence rule explicitly — the more restrictive class usually wins — and document it, because otherwise the outcome depends on which rule ran last.

**The schedule ages faster than the review cycle.** Regulations change, business relationships end, and litigation alters what should be kept. A schedule reviewed annually is probably adequate; one written once and filed is a liability.

**Exceptions multiply.** Someone always needs a document kept longer. Exceptions are fine when they are recorded, justified and time-limited, and dangerous when granted verbally. If your platform cannot record an exception with an expiry, the exception is permanent.

**Disposal has an audience.** Deleting records is visible and occasionally unpopular. Expect to explain a disposal run, and make the explanation easy by logging what was destroyed and under which rule.

The pattern across all five is the same: the schedule has to be expressible as rules a system enforces, not as a table a person consults. That is the difference between a policy and a control.

```figure
type: compare
title: Two retention postures
left: Policy as intent
right: Policy as control
leftItems: A table in a document nobody references | Classification chosen per file, inconsistently | Disposal that happens when someone remembers | Holds tracked in a spreadsheet beside the platform | Deletion that reaches the library only
rightItems: Rules configured per repository class | Classification derived from where the document lives | Disposal scheduled, logged and reviewable | Holds enforced by the platform, taking precedence | Deletion that reaches indexes, caches and retrieval stores
caption: Figure 2. The bottom row of the right column is the one that turns a compliant-looking policy into a defensible one.
```

## Defensible deletion

The phrase means being able to explain and evidence why a record was destroyed, if challenged.

It requires:

1. **A documented schedule** with authority cited for each period.
2. **A repeatable process**, applied consistently rather than case by case.
3. **A record of disposition** — what, when, under which rule.
4. **A hold process** that demonstrably suspends destruction.
5. **A litigation response** that stops routine destruction when a matter is anticipated, not after.

Point five is the one with real consequences. Destroying records after a duty to preserve has attached is spoliation, and in US federal civil practice it carries explicit sanctions exposure under the rules governing electronically stored information. The platform has to make "stop deleting" a single action that is actually effective.

## Implementing it

1. **Write the schedule** with counsel or your records function. Do not start with the tool.
2. **Classify repositories** into record classes. A rough mapping beats a perfect one that never ships.
3. **Configure rules per class**, with a dry run before enabling destruction.
4. **Test hold precedence.** Place a hold, confirm the record survives its retention date, release the hold, confirm it does not.
5. **Document the backup position** explicitly, and how a restore respects deletions and holds.
6. **Set a review cadence.** Schedules drift as regulations change.
7. **Log disposition** and keep the log at least as long as the longest retention period, or the evidence expires before the obligation does.

## Where a platform helps

Retention is one area where the difference between platforms is concrete rather than theoretical. The questions are whether retention is a first-class feature or a report, whether holds take precedence automatically, and whether deletion evidence is producible.

Our [ISO 27001 article](/blog/iso27001-document-management) covers the control framework this maps onto, and [access control best practices](/blog/access-control-best-practices-documents) covers who should be able to change a retention rule in the first place.
