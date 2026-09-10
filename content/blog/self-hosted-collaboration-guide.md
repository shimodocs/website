---
title: "A Practical Guide to Self-Hosted Collaboration"
seoTitle: "Self-Hosted Collaboration: A Practical Guide | ShimoDocs"
description: "What self-hosted collaboration actually involves, the five questions IT teams should answer first, and where the real costs sit."
category: self-hosting
date: 2026-01-14
tags: [self-hosted, operations, kubernetes, infrastructure]
keywords: "self-hosted collaboration, self-hosted document collaboration guide, run collaboration software yourself"
featured: true
---

Self-hosting a collaboration suite is not a heroic act and it is not a checkbox. It is an operations decision with a cost curve, and the interesting question is whether that curve sits below the alternative for your organisation.

This guide covers what the work actually involves and where teams usually underestimate it.

## What self-hosting actually means

There is a spectrum, and vendors are loose with the term.

**Fully managed in your cloud account.** The vendor operates the service; the data sits in a bucket you own. This is a data-residency answer, not a control answer — the vendor can still read plaintext.

**Vendor-operated in your VPC.** A middle ground with the same caveat.

**You operate the application.** You run the containers, the database, object storage and the upgrade process. The vendor ships images. This is what most people mean by self-hosted, and it is what [private cloud document collaboration](/blog/what-is-private-cloud-document-collaboration) usually refers to.

**You operate everything including the model.** The AI endpoint is also yours. Rare, expensive, and occasionally the only defensible position.

Decide which one you are actually buying before you compare prices, because they answer different questions.

## The five questions to answer first

### 1. Who is on call for it?

Not "who will set it up". Setting up is a week. Running it is years.

If the answer is "the platform team, alongside everything else they run", confirm they have capacity. A collaboration suite that documents the company's decisions is not a good candidate for best-effort support.

### 2. What is your identity story?

Self-hosted collaboration almost always lands inside an existing directory. If you have SAML or OIDC with group sync, provisioning and deprovisioning can be automatic. If you do not, you are about to be responsible for offboarding access manually, which is exactly the process that fails audits.

Check group-to-role mapping specifically. Directory sync that only provisions users but not permissions leaves you with manual work on every join and departure.

### 3. How will you restore a backup you have never tested?

A backup exists when you have restored from it, not when a cron job wrote a file.

For a document suite, a complete restore means the relational database, the object storage and the configuration. Restoring the database against a different object storage state gives you documents with missing bodies — a failure mode that is easy to discover months later.

### 4. What breaks when the collaboration service is down?

Rank the dependency. If the suite holds the company's operating procedures and the on-call runbooks, an outage is an incident-response outage. Size the availability target accordingly.

### 5. Which integrations are load-bearing?

Pull the list of what the current suite is wired into — chat, issue trackers, CI, calendar, e-signature — and mark which ones people would notice within a day. Then verify the replacement supports them. Integrations are the most common reason a technically successful migration gets rolled back.

## A reference architecture

A typical mid-size deployment looks like this:

| Component | Role | Notes |
| --- | --- | --- |
| Application nodes | Editor, API, collaboration services | Stateless, scale horizontally |
| Kubernetes | Scheduling and rolling upgrades | Single node is fine to start |
| MySQL 8 | Metadata, permissions, comments | Needs a real backup plan |
| Redis | Sessions and coordination | Usually not the source of truth |
| Object storage | Document bodies and attachments | S3-compatible is standard |
| Ingress with TLS | External access | Certificate management matters |
| AI endpoint | Model inference | Internal or vendor, your choice |

The [Kubernetes deployment walkthrough](/blog/self-hosted-collaboration-kubernetes-deployment) covers sizing and the high-availability variant.

## Where teams underestimate the cost

**Object storage grows monotonically.** Version history on a busy document set is surprising. Plan for retention policy decisions before the bill forces them.

**Upgrades are a change-management event.** If you run a validated environment, every upgrade needs a window, a rollback plan and evidence. Budget that process, not just the technical work.

**Search is a service.** Full-text search across documents is a workload with its own tuning, and users judge the whole product by it.

**AI adds a capacity dimension.** A configured AI endpoint introduces GPU or token-cost variability that has nothing to do with user count. Watch this if you enable agents broadly.

## Migration is the part people plan last

The technical install is usually the easy half. Getting content out of the incumbent suite with comments, permissions and folder structure intact is where schedules slip.

Most suites export documents without the surrounding context. Budget time for a permissions rebuild and accept that some history will not survive. The [migration walkthrough](/blog/how-to-migrate-from-google-workspace) covers a staged approach that keeps both systems running during cutover.

## A sane rollout order

1. **Pilot with one team that already wants it.** Pick a team with a real pain point, not the most compliant team.
2. **Enable identity sync before onboarding anyone.** Retrofitting permissions is worse than starting with them.
3. **Prove a restore in the pilot.** Before the pilot holds anything you would miss.
4. **Move one document class at a time.** Policies, then meeting notes, then project plans.
5. **Set an upgrade cadence and publish it.** Predictability reduces complaints more than frequency does.
6. **Retire the old system on a date.** Parallel running forever is how migrations stall.

## Deciding

Self-hosting is the right call when you have regulatory or contractual constraints a vendor cannot satisfy, existing infrastructure to absorb the workload, and an operations function that can own it. It is the wrong call when the driver is cost alone at small scale, or when nobody will own the pager.

If you want the category-level picture first, start with [what private cloud document collaboration is](/blog/what-is-private-cloud-document-collaboration), then look at [how it compares with Google Docs](/blog/shimodocs-vs-google-docs) if you are weighing a specific replacement.
