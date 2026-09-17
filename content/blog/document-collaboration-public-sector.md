---
title: "Document Collaboration in the Public Sector"
seoTitle: "Public Sector Document Collaboration Guide | ShimoDocs"
description: "How government teams evaluate document collaboration: residency, records retention, audit evidence, restricted networks and what a tender should ask."
layout: standard
category: industry
date: 2026-09-17
tags: [public sector, government, data residency, on-premises]
keywords: "public sector document collaboration, government document collaboration, data residency government, on-premises document collaboration"
---

Agency document work is not exotic. Briefs, budgets, procurement records, case files, contracts, funding spreadsheets. The editing looks like editing anywhere else.

What differs is what the organisation has to prove afterwards, and how slowly it can change its mind about the tool that holds the work. A commercial team can adopt a new app on a Friday. An agency runs a security assessment, signs for a term of years, and lives with the choice long after the evaluation team has moved on.

That is why public sector document collaboration is a procurement question before it is a software question.

## Why the procurement question is different

**You cannot switch quickly.** A commercial team migrates in a quarter. An agency re-runs the assessment, re-publishes the notice and re-signs, and the people who chose the first platform have usually left before the problem is felt.

**Residency is a legal position, not a preference.** It arrives as a clause the data protection officer has to sign. A platform that cannot satisfy the clause is not a candidate, however well it edits.

**Auditability is standing, not periodic.** An audit asks what happened to a named record between two dates. The answer has to come from records the agency can read on its own terms, in its own environment, not from a vendor's support queue.

**Retention outlives the platform.** The retention schedule applies to the record whatever software happens to hold it. If a platform cannot produce a record in a usable form at the end of the contract, the obligation does not disappear; it becomes one person's spreadsheet.

**The network is often restricted.** For part of the work, the network cannot reach the public internet at all. A browser-based service on somebody else's infrastructure is not reachable and, for those record classes, not acceptable.

Government document collaboration questions therefore have to be answerable in writing before the award and verifiable afterwards. A demo settles neither.

```keypoints
title: What decides most public-sector evaluations
- **Residency is a set of paths, not a place.** Storage, backups, processing, support access, logs, subprocessors and AI inference each have a separate answer.
- **Operating infrastructure is a different claim from hosting in the country.** The first changes who can be compelled to produce the data. The second often does not.
- **Retention and legal hold are agency obligations.** Ask what the platform can preserve and evidence, not whether it "supports compliance".
- **The evaluation is the cheap part.** Tracing one record end to end before signing costs far less than discovering the answer in year three.
- **Not every document class needs the controlled environment.** The low-sensitivity tier belongs wherever it is cheapest to run.
```

## What a data residency requirement actually asks for

Most residency clauses name one thing: where the data is stored. That names one of six paths.

| Path | The question to put in the tender |
| --- | --- |
| Storage at rest | Which region holds the primary data, and which region holds the backups and snapshots? |
| Processing | Where do indexing, search, preview rendering and export actually run? |
| Staff access | Can support or engineering reach this tenant from another country, and is that access logged? |
| Logs and telemetry | Where do access logs, error reports and usage analytics go? |
| Subprocessors | Who else receives content, and does that list change without notice? |
| AI inference | What content leaves the boundary when a model is called, and to which endpoint? |

A clause that names a country is satisfied by almost anything, including a service whose support engineers sit elsewhere and whose error tracker stores fragments of user content. Our [data residency requirements guide](/blog/data-residency-requirements-guide) walks through all six paths. Data residency in government procurement is usually one sentence; the tender version should be this table with a jurisdiction in every row.

Keep residency and sovereignty apart, too. Residency answers where the data is; sovereignty answers whose courts can compel it. A vendor can pass the first and fail the second.

Which is why in-country hosting is not the same as infrastructure the agency operates. A regional instance of a vendor-operated service keeps the vendor inside the trust boundary: their staff can reach the tenant, their subprocessors process the content, and their jurisdiction applies wherever the disks sit. Infrastructure the agency runs moves that boundary onto its own network, and moves the pager with it. [On-premises document collaboration](/on-premises) is the version of the claim an assessor can verify.

Say the other half out loud as well. If a record class is destined for publication, or holds no personal data and carries no retention obligation, a hosted service is the right answer and building a cluster for it is an expensive way to avoid a problem the agency does not have.

## Air-gapped and restricted-network rollouts

The deployment model is chosen at installation time and is not a setting you flip later. Online installation pulls from the internet; offline installation takes the base image package and the product image package, both matching the product version and CPU architecture, through a private registry the agency runs. The deployment guide suggests reserving more than 100 GB on the data disk for those packages and their temporary extraction.

Two things fail first in these environments, and neither is dramatic.

**Time.** The pre-installation checklist requires synchronised system time, and distributed clusters depend on it for authentication and log ordering. An internal time source has to be agreed with whoever owns the network before the installation window, not during it.

**The transfer chain.** Every artefact needs an owner, a checksum and a record. Our guide to [document collaboration on an air-gapped network](/blog/air-gapped-document-collaboration) covers assembling and re-verifying that set; the point here is that it is a recurring process, not a one-off for go-live.

The rollout follows from the sizing decision.

- **Size for the steady state, not the pilot.** The documented baseline is a 16-core, 32 GB node with a separate data disk of 300 GB or more. A single node is documented for small teams; three or more servers is the recommended shape for long-term operation and high availability.
- **Pilot on synthetic or already-public content.** Non-production records do not belong in a pilot, and they are never needed to prove that multi-user editing works.
- **Stage by team, not by feature.** Start with the group whose work is least sensitive and most document-heavy, because they will find the import and export problems.
- **Name the operator before you name the platform.** Someone has to own upgrades, certificates and restores. If no such person exists, the honest answer is a hosted service.

```figure
type: flow
title: From the clause to the deployment decision
items: Name the records | Trace the paths | Ask who operates it | Choose the boundary | Prove it later
detail: Which classes, what sensitivity, how long kept | Storage, backups, logs, support access, inference | A regional instance is not infrastructure you run | Hosted tier, controlled environment, or both | Evidence you can produce on request in year three
caption: Figure 1. Most tenders stop at step two with a storage region. Steps three and five decide whether the clause can still be satisfied three years after the award.
```

## Records retention, legal hold and audit evidence

Retention is three obligations wearing one name. A minimum: keep this for at least this long. A maximum: do not keep it longer. A suspension: keep it regardless, because it is relevant to a matter.

The platform owns none of them. What it can do is preserve records and produce evidence, and those are the capacities to test.

The operations backend keeps an operation log for administrative and system events. It records an event source such as the control panel, the application configuration centre, the updater, Kubernetes resource management or user management; an operation type such as a configuration update, a version upgrade, a service restart or a user management action; the operating user; the object touched; and the time. The page is read-only and does not support modifying or deleting log records, and details carry the event metadata, including whether a release triggered an automatic restart and which workloads restarted. The documentation also states that logs cover the operations the system audits and may be affected by the environment's own retention policy.

Now the part vendors usually leave out. That log records administrative and system operations, not the edit history of every document. If the requirement is to reconstruct who changed a clause, and when, the evidence is the document's own version history, which carries a different retention question. Neither is a records management system: there is no disposition schedule and no destruction workflow in the platform. A hold is a procedure the agency runs, with copies held somewhere the everyday user cannot delete.

Two operational controls help at the edges. Accounts can be disabled in bulk per tenant, which is what offboarding and fixed-term contracts need, and the tenant view shows seat usage and expiry, so an abandoned tenant is visible rather than forgotten.

## Evaluating when there is no free trial

Real records cannot go into a vendor trial, and on a restricted network there is often no trial session to open at all. That changes the shape of the evaluation rather than preventing it.

1. **Classify first.** Five record classes, their sensitivity, their retention period. Without that table the evaluation has no criteria and turns into a feature argument.
2. **Run the proof on infrastructure you control**, with synthetic content or documents that are already public. Test what fails in production: multi-user editing at realistic concurrency, import and export fidelity against the Office files the agency actually receives, and search across years of documents.
3. **Make the deployment documentation part of the evidence.** Supported operating system and architecture, resource baselines, required ports, the offline package chain, the upgrade path. Answers that do not match the shipped guide are the finding.
4. **Witness the acceptance run.** The deployment guide checks node and pod status first, then business functions: creating and editing documents, spreadsheets and presentations, multi-user collaborative editing, import and export, search, team spaces and contacts. That checklist is a better evaluation script than any demonstration.
5. **Watch a restore.** Do not sign for a platform whose restore has never been performed by the people who will have to perform it.
6. **Time an upgrade.** A version upgrade validates the package and can require a license update, and it should run in a maintenance window with the previous version to hand. For a [security](/security) assessment, that is where change control meets reality.

## Doing both

Most agencies end up with two tiers, and that is a legitimate destination rather than a failure of standardisation.

- **A hosted tier for low-sensitivity work.** Published material, training content, internal communications, anything with no personal data and no retention obligation. The hosted service is free for teams of up to five people, and $5 per user per month on the Team plan, which is small enough to run a working group without a procurement.
- **A controlled environment for everything else.** Case files, contracts, personnel material, anything under a hold, anything named in the residency clause.
- **A written rule for which system is authoritative for which class.** Without it, teams keep copies in both places and trust neither.
- **Separate tenants rather than a second deployment.** The operations platform manages multiple tenants with their own seat usage, administrators and enable or disable state, so one controlled environment can serve several teams without sharing a workspace.

```figure
type: bars
title: Where the effort sits when the environment is yours
items: Residency and security | Records and retention | Infrastructure build | Identity and access | Rollout and training
value: 68 | 92 | 57 | 44 | 63
detail: High | Highest | Medium | Medium | High
caption: Figure 2. Relative effort across an agency rollout, not measured time. Records mapping is the bar teams underestimate, because the work belongs to the records office rather than to IT.
```

The failure mode is choosing both tiers and staffing neither. Two platforms mean two sets of habits, two places to look and two upgrade calendars. If nobody will own the boundary between them, standardise on one: either the controlled environment and the cost that comes with it, or the hosted tier and the requirement it cannot satisfy. Buy for the full term, too. Procurement cycles are long enough that the feature you need in year four matters more than the one that demoed best.
