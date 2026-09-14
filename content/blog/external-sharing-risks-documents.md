---
title: "External Document Sharing: Where Audits Find Problems"
seoTitle: "External Document Sharing Risks | ShimoDocs"
description: "Why external sharing is the control that fails most audits, and how to configure link sharing, guest access and expiry so it does not."
layout: briefing
category: security
date: 2026-03-18
tags: [external sharing, data leakage, guests, dlp]
keywords: "external document sharing risks, link sharing security, guest access document control"
---

Every document platform supports "anyone with the link". Every organisation has at least one folder where it is enabled and nobody remembers why. That combination is the single most reliable finding in a document platform audit.

The mechanism is worth understanding precisely, because the fix is configuration rather than technology, and the configuration is usually one default setting away.

## Three sharing mechanisms, three exposures

Teams talk about "external sharing" as one thing. It is three, with different risk profiles.

```figure
type: matrix
title: Sharing mechanisms and what each exposes
items: Named guest accounts | Organisation-wide link | Public link
detail: The safest external mechanism. Identity is known, access is scoped and revocable, and activity is attributable to a person. | Accessible to anyone with a corporate account, which in a large tenant is a much larger population than people assume. | Anyone with the URL. No authentication. Revocation depends on someone remembering, and the link may already be indexed or forwarded.
xAxis: LOWER EXPOSURE
xAxisEnd: HIGHEST EXPOSURE
caption: Figure 1. Most policies address the third column and forget the second, which is where a surprising share of findings originate.
```

**Named guests** are a controlled mechanism. The person is identified, the scope is a repository, and access can be revoked with an end date.

**Organisation-wide links** are widely treated as internal and are not. In a tenant with contractors, acquired companies and guest domains, the population that can follow such a link is larger than the team that created it understands.

**Public links** are the obvious risk, and the failure is rarely that someone enabled one deliberately. It is that a link created for a specific purpose was never revoked.

## Why it fails predictably

Four reasons, all structural.

**The default is permissive.** Many platforms enable link sharing tenant-wide or per workspace on creation. The path of least resistance is the risky one.

**The creator is not the owner of the risk.** The person sharing a file to unblock a partner is not the person accountable for a leak.

**Revocation is nobody's job.** Links have no natural expiry unless one is set, so they persist beyond the relationship that justified them.

**The audit is retrospective.** By the time a review finds the open folder, the exposure has existed for months.

## What actually works

Configuration that fails closed, plus a review that catches drift.

### Default deny at the tenant level

Link sharing disabled by default, enabled per workspace with justification. This inverts the path of least resistance: creating an external link becomes a deliberate act.

The cost is friction, and it is worth being honest that it is real. Teams will complain. The alternative is a control that depends on everyone remembering.

### Guests instead of links

For anything recurring, a named guest is strictly better: attributable, scoped, expirable, reviewable. Make guest access the documented route for external collaboration, and treat link sharing as the exception for one-off, low-sensitivity material.

### Expiry by default

Any external access should have an end date unless someone deliberately extends it. A guest without an end date becomes permanent by inattention.

### Revocation that actually revokes

Worth testing rather than assuming. Some platforms cache permissions, and a revoked link may continue to work for a period. Verify with a real link against a real document, then revoke and re-test.

### Evidence

You need to be able to answer: which documents are currently shared externally, with whom, and since when. A platform that cannot produce that list makes the review manual, and manual reviews do not happen on schedule.

## The three questions an auditor asks

External sharing reviews tend to converge on the same three questions, and the answers come from the platform rather than from policy.

**What is shared externally right now?** A list of documents with external access, the mechanism and the recipient. If producing this requires walking repositories, the organisation cannot answer the question, and that inability is itself the finding.

**Who authorised it?** For each external share, the person who granted it and when. Shared links with no owner are the ones that persist indefinitely, because nobody is positioned to revoke them.

**When was it last reviewed?** The date of the most recent examination of each share, and the outcome. A share reviewed and confirmed is a different thing from a share nobody has looked at since creation.

Answering these requires four platform properties:

- **External access distinguishable from internal.** The list has to be filterable, or it is a manual audit every quarter.
- **The granting user recorded** on the share, not just on the document.
- **Expiry as a field**, so age is queryable rather than approximated.
- **Audit of external access events**, so a review can see whether a share was ever actually used. An unused share from two years ago is the easiest revoke on the list.

The practical value of the third question is that it converts a review from "decide about everything" to "decide about the oldest and least used items", which is a much smaller task and one that actually gets done.

Where a platform cannot answer these, the control depends on user discipline. That works in small organisations and reliably fails past a few hundred people.

```figure
type: layers
title: What reduces external sharing exposure, in order of effect
items: Do not grant the access | Scope it narrowly | Give it an expiry | Make it attributable | Log and review it
detail: The only control that removes the risk rather than reducing it. Most exposures were never necessary. | One repository and one purpose rather than organisation-wide. The second most effective step. | Converts permanent exposure into temporary exposure, and shrinks every future review. | A named recipient, so the share has an owner who can be asked about it. | Makes drift visible. Necessary, and strictly retrospective.
caption: Figure 2. Most organisations invest heavily in the bottom row and leave the top two to user judgement. The ordering is the point.
```

## Controls worth having beyond access

Access control answers who can reach a document. These reduce the consequence when someone reaches it who should not.

| Control | Effect | Limitation |
| --- | --- | --- |
| Watermarking | Discourages screenshots and identifies the source | Visible only, defeated by re-typing |
| Download restriction | Keeps content in the browser | Does not stop screenshots |
| Copy protection | Reduces casual exfiltration | Not a security boundary |
| Audit of external access | Makes exposure visible | Retrospective |
| Classification labels | Lets users judge what may be shared | Depends on correct classification |

None of these is a substitute for not granting the access. They reduce the blast radius of the cases the access control missed.

## The AI dimension

An assistant that retrieves content on a user's behalf can surface documents the user could not have found, and the permission model determines whether it also surfaces documents they should not see.

The question to ask is whether retrieval filters by the requesting user's permissions or by a service account's. The second answer means external sharing controls are decorative once AI is enabled. Our [AI agents security checklist](/blog/ai-agents-in-documents-security) covers how to test this.

## A review that works

1. **Generate the list** of externally shared documents, guests and active links. If the platform cannot, that is the first finding.
2. **Sort by age**, oldest first. Anything older than the relationship it served is a candidate for revocation.
3. **Sort by sensitivity.** Cross-reference against your tiers — see the classification step in our [retention policy guide](/blog/document-retention-policy-guide).
4. **Revoke, then verify.** Test that revocation worked.
5. **Set expiry on everything that survives**, so the next review starts from a smaller list.
6. **Repeat quarterly**, and after any platform upgrade that touches sharing behaviour.

## Configuration before technology

Almost everything on this page is a settings decision. The reason external sharing keeps failing audits is not that the controls are missing, it is that the permissive default is the one nobody changed.

For a self-hosted deployment, those settings are yours to choose at installation rather than inheriting from a vendor's tenant defaults — which is a modest but genuine advantage, and one worth configuring on day one rather than after the first review. Our [access control article](/blog/access-control-best-practices-documents) covers the internal side of the same model, and [data residency requirements](/blog/data-residency-requirements-guide) covers where externally shared content is allowed to travel.
