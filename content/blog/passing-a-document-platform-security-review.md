---
title: "Answering a Security Review of a Self-Hosted Platform"
seoTitle: "Self-Hosted Security Review: What to Prove | ShimoDocs"
description: "A self-hosted security review asks who can reach the data, who can prove it and what changes. What to prepare, and when not to self-host at all."
layout: standard
category: security
date: 2026-09-17
tags: [security review, self-hosting, vendor assessment, operations]
keywords: "self-hosted security review, vendor security questionnaire, on-premises security assessment"
---

A hosted vendor answers a security questionnaire about its own operations. When you self-host, the questionnaire comes back and the answer to roughly half the rows is now "that is us".

A self-hosted security review is not a certificate count. The reviewer is trying to establish four things: who can reach the content, who can prove what happened to it, who holds the keys and the backups, and what happens when something changes. The vendor security questionnaire, the architecture diagram and the evidence pack are how those four questions get answered — they are not the questions.

## What the reviewer is actually establishing

The reviewer's job is to decide whether the residual risk of this deployment is acceptable. For a hosted product that work is mostly reading someone else's report; for a self-hosted platform the reviewer has to reason about your environment, and the questions stop being about the product.

Two audiences use this review. If you are the customer, it is your security team approving the deployment. If you sell into a regulated industry, the same conversation returns at procurement, when a customer's team performs an on-premises security assessment of the platform you run. The questions are the same either way.

```figure
type: matrix
title: Four questions under every review question
items: Reach — who can get to the content | Proof — who can show what happened | Custody — who holds keys and backups | Change — what happens at the next upgrade
detail: Which networks, browsers and storage endpoints can open a document. The answer is a diagram, not a policy. | Whether anyone can show who changed a setting, when, and what changed — after the fact. | Who can decrypt, where the keys live, who holds the backups, and what a lost key costs. | Who patches, who approves the release, and how a failed upgrade is rolled back without losing a day of work.
xAxis: SET BY THE ARCHITECTURE
xAxisEnd: SET BY YOUR OPERATIONS
caption: Figure 1. The left column is decided when you deploy. The right column is decided every month afterwards, which is why it is the one that fails.
```

```figure
type: timeline
title: How a security review actually runs
items: The questionnaire arrives | The architecture call | Evidence sampling | Findings and owners | Remediation and re-review
detail: Nothing in it is specific to your deployment yet. It is a template with 150 rows. | Engineers, one diagram, and the question of what talks to the storage layer. | Pick a leaver, an upgrade and a restore. Can the record be produced the same day? | Named gaps with a date attached. Most reviews end here rather than in a refusal. | The second pass checks the items that were open, not the whole list again.
caption: Figure 2. The middle two stages decide the outcome. Both are cheap if the records already exist and expensive if they have to be assembled during the review.
```

## Why "it runs in your network" raises the next three questions

It is the strongest answer to the network question: content never crosses a boundary you do not control, and no vendor employee can read it. Reviewers accept it quickly, then move on to what self-hosting implies.

**Patching.** The suite requires Ubuntu 22.04 or 24.04 on x86, and the installation account is root or has equivalent privileges. The documentation drops CentOS because its base components cannot receive long-term security patches — the argument a reviewer turns back on you if your host is outside the supported list. The middleware versions are pinned — MySQL 8.0, Redis 6.2.x, MongoDB 4.4.x, Kafka 2.7 to 3.5, Elasticsearch 8.18.x — so patch cadence has to fit inside compatibility. "We patch monthly" is the wrong answer. "We track advisories for these six components and upgrade when the platform supports the release" is the right one, and it needs a record behind it.

**Hardening and exposure.** The reference architecture lists the ports each component needs: `18080` for the installer, `80` or `443` for user access, `22` on every node, plus the database, cache, document store, message queue and search ports. A reviewer will ask which of those are reachable from outside the cluster network. The answer is not a product setting; it is your firewall, security group and load balancer configuration, and it belongs on the diagram rather than in the reviewer's discovery.

**Identity.** The operations platform shows users per tenant with a role and an enabled or disabled status, and supports enabling or disabling accounts in bulk. That is a lifecycle tool, not a permission model. For a deployment that holds confidential documents, the reviewer will ask how a departing contractor loses access to one repository on their last afternoon — and disabling an account, which affects the person's normal use everywhere, is a blunt way to answer it. Group-derived roles give you a defensible answer; per-file grants do not. The [access control guide](/blog/access-control-best-practices-documents) covers what that structure looks like.

## The evidence a SaaS vendor would have produced for you

When you review a hosted vendor, you consume their artefacts: the report boundary, the subprocessor list, the vulnerability process, the incident history, the restore tests. Self-hosting removes that source and does not remove the questions. The evidence is now yours to manufacture.

| What a hosted vendor hands over | What your team has to produce |
| --- | --- |
| A report on their operations | Your own change, access and incident records |
| A subprocessor and data-flow description | Your network diagram, including storage endpoints |
| Their patching and vulnerability process | Your OS and middleware patch records, with dates |
| Their restore test results | Your restore test, with a date, a duration and a result |
| Their key management description | Your key custody and rotation procedure |
| Their breach notification terms | Your detection path, your on-call, your notification decision |

One part of this the platform does generate. The admin backend has an operation log that is read-only by design — records cannot be modified or deleted from the page — and it can be filtered by event source, operation type and operating user. Each entry carries the log ID, the event source and type, who performed it, the object it touched and the time; details include the event metadata, and for configuration changes, what was modified and which workloads restarted. If you need to answer "who changed this, and when", that is a query rather than an archaeology project.

Two limits are worth stating before the reviewer states them for you. The log records only operations the system audits, and retention follows the environment's own policy. "How long do you keep audit history" is your answer, not the product's, and it belongs in the pack as a configured number.

A self-hosted product cannot hand you a report about the deployment you operate. [What SOC 2 does and does not cover](/blog/soc2-document-collaboration-controls) is the long version of why, and it is worth knowing before someone waves a badge at the reviewer.

## A control that exists is not a control you can demonstrate

This distinction is where good deployments lose points they did not need to lose.

"The platform supports single sign-on" is a capability statement. "Every account in the platform derives from a directory group; here is the mapping, and here is the last access review" is a control. Reviewers test controls by sampling: pick one leaver and ask when access ended, pick one upgrade and ask who approved it, ask for the date of the last restore. A capability cannot answer any of those, and a screenshot without a date answers none of them convincingly.

```callout
tone: warning
title: Do not answer a control question with a feature
A capability answers what the product can do. The reviewer asked what your deployment does, and how you know. "It supports group-based permissions" invites a follow-up you may not have configured yet. Name the gap instead — it is a finding with an owner and a remediation date, which is a normal outcome. A gap the reviewer finds after you implied it was closed is a different conversation about trust.
```

## What to have ready before the call

Five artefacts turn the review from an interrogation into a walkthrough.

- **Architecture, on one page.** How many nodes you run — a single server is a supported configuration for a small team, and a cluster means three or more — which components sit on which host, where the operational interfaces live, and the version you are running today.
- **Data flow, including the paths that leave the application tier.** The reference architecture requires the object storage endpoint to be directly reachable from client browsers, because document reads and writes go between the browser and the storage layer rather than through the application. Draw that line. If the reviewer learns it by reading the documentation instead of your diagram, every other line on the diagram becomes a question.
- **Key custody.** Where the keys live, who can use them, how they rotate, and what a loss would cost. If you hold your own keys, the procedure matters more, not less — [key custody and bring-your-own-key](/blog/byo-key-encryption-documents) sets out the questions in order.
- **Upgrade path.** Who approves a release, how it is tested before it reaches production, and what the rollback is. "We apply upgrades when we have time" is an acceptable answer if it is the true one, provided you can say how far behind you are.
- **Backup and restore.** A restore test with a date, a duration and a result. The backup schedule proves nothing a reviewer cares about.

Then compress the whole thing into the shape the reviewer is already working from.

| The reviewer asks | What answers it |
| --- | --- |
| Which networks can reach the platform? | The ports that are actually open, per network, not the intended list |
| Who can administer it? | Named accounts, plus the root-equivalent account and who may use it |
| How does access end? | The disable action, the log entry showing who performed it, and the time |
| How do you know what changed? | The operation log by event source, plus your change records |
| How long is audit history kept? | Your retention configuration, quoted as a number |
| Who patches what, and how often? | Supported OS and middleware versions, with patch records |
| When was the last restore test? | A date, a duration and a result |
| What happens in an incident? | Detection, who is called, and who decides on notification |

## The questions that end a review early

Some answers close the conversation quickly, and they are short. "Here is the diagram, here are the accounts that can administer the platform, here is the last restore test, and the change records are in this folder." Naming a real gap with an owner and a date does the same thing. So does "I do not know, I will send you the record by Thursday" — followed by the record on Thursday.

Four answers reliably have the opposite effect. Answering a control question with a product capability. A diagram that omits a path the reviewer can find in the documentation. A screenshot with no date on it. And "the vendor handles that", which in a self-hosted deployment is not a sentence the reviewer can accept, because the vendor does not operate your cluster.

### When self-hosting is the wrong answer

If nobody owns the platform, the review will find out, and it will be right to fail it.

Self-hosting does not fail because a team is small. It fails when the answer to "who patches the hosts" turns out to be "we assumed the vendor would". Steady-state work is modest — reading advisories, watching the operation log, reviewing access at a cadence, testing a restore — but it is work with a name attached to it, and a single-node deployment is still a server you have promised to operate. Add a longer day at every upgrade, because an upgrade you cannot test or roll back is the change most likely to cost you the record the reviewer wanted.

If you cannot attach a name to that work, the honest answers are to hire for it or to buy the hosted version and let someone else's operations be the subject of the review. That is the difference between a deployment and an operating commitment, and the second one is what the reviewer is measuring.

The [security hub](/security) collects the rest of this thread: deployment models, access, encryption and the questions that come before procurement.
