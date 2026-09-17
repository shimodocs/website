---
title: "How Self-Hosted Document Software Is Priced"
seoTitle: "Self-Hosted Document Platform Pricing Models"
description: "The pricing models behind self-hostable document software, what counts as a user in each, and how to compare two quotes without being surprised."
layout: briefing
category: comparisons
date: 2026-09-17
updated: 2026-09-17
tags: [pricing, licensing, self-hosted, procurement]
keywords: "self-hosted document platform pricing, document software licensing models, per seat vs per instance licence, document collaboration total cost"
---

Two quotes for self-hostable document software can differ by a factor of five and both can be honest. What differs is not usually the product. It is the pricing model, and the model decides how the invoice behaves when your headcount changes.

This is about the models rather than the vendors, and the questions to ask before you sign either quote.

## The four models you will be quoted

**Per-seat subscription.** A price per named user per month or per year. The arithmetic is visible, and it grows with the population: four hundred people cost about four times what a hundred cost. It makes small teams cheap and large ones expensive.

**Per-instance or per-deployment subscription.** The licence covers a deployment rather than a population — a number of servers, a node count, or a capacity band. The invoice is close to flat while the team grows inside the band, which suits a document-heavy organisation with a settled staff count. The trap is the boundary: the year you cross the band, the cost steps rather than slopes.

**Perpetual licence plus maintenance.** You pay once for a version, then pay an annual maintenance percentage for updates and support. Budgeting is simpler because most of the spend is capital and lands in year one. The question to resolve before signing is what the software does if you stop paying maintenance, and whether the version you own keeps running.

**Open source plus support.** No licence fee, or a support contract you could decline. Nothing about the cost disappears — it moves, into staff time, into upgrade work you now own, and into the vendor knowledge you did not buy.

```figure
type: bars
title: How annual cost moves when the team doubles
items: Per-seat subscription | Open source plus support | Perpetual plus maintenance | Per-instance subscription | Support declined entirely
value: 100 | 60 | 30 | 10 | 0
detail: proportional by definition | support scope, renegotiated | tracks the licensed value | flat until you cross a band | the cost moves to your staff
caption: Figure 1. Illustrative shapes, not quotes: each value indexes how that model's annual cost moves when a team of a given size doubles, with per-seat set to 100. No vendor's price is represented here, and a per-seat product can still be the cheaper one in absolute terms at your size.
```

Our own shape mixes two of these. ShimoDocs is free for teams of up to five people, and the Team plan is $5 per user per month, 20% off billed annually. A self-hosted licence is written per deployment: it names a maximum number of seats and a maximum number of tenants, the machine codes of the servers it is bound to, and an after-sales service period tracked separately from the product usage period. A seat ceiling inside a machine-bound licence is why the next section decides more than the model label does.

## What counts as a user

Four definitions are in circulation, and the gap between them is wide enough to change the decision.

**Named account.** Every account that exists, whether or not it was opened this month. Simple to administer and simple to audit, and the definition most likely to charge you for people who have left, for test accounts nobody deleted, and for integrations that log in as a user.

**Concurrent user.** The count of sessions at the same moment. Cheap on paper for shift-based, part-time or occasional populations, where four hundred people share sixty simultaneous seats. The bill is small and the peak is the risk: the day everyone opens the same document is the day the licence is short.

**Active member.** An enabled account counted as a member of the workspace. Our documentation defines seat usage this way — the number of active company members in a tenant, with each active member occupying one seat — so a seat is consumed by a person who is a member, not by an editor session. Two hundred concurrent editors and two hundred members are different numbers, and only one of them is on the licence.

**Occasional and external.** Clients, reviewers, suppliers, auditors, anyone outside the organisation who opens a document to comment on it. This definition decides a document platform bill more often than any other, because documents are the artefact organisations share outward.

Service accounts are the category nobody asks about until the true-up: API credentials, automation, scheduled jobs, migration scripts. Ask whether an integration that reads documents needs a seat, and get the answer into the contract rather than an email.

Four hundred employees and nine hundred external collaborators is a different invoice when guests are free than when every guest is a named user — same software, same headcount.

```pullquote
The count of named users, not the size of the server, is the number you will actually pay for.
```

So do not verify the word "user". Verify the sentence: what counts as one, what happens when someone leaves, whether disabled accounts are charged, whether guests and service accounts are charged, and whether the count is measured on the day you sign or the day the vendor looks.

## What happens at renewal

There are three clocks, not one, and quotes rarely separate them.

Our own documentation is explicit about the first two: the product usage period and the after-sales service period each carry their own start and expiry date. Support can lapse while the software keeps running, and the reverse is possible too. When a quote gives you a date, ask which clock it belongs to.

The third clock is the hardware binding. A per-instance licence is bound to the machine codes of the servers it runs on. Adding, removing or replacing a node changes those codes, and the documented instruction is to reapply with all current machine codes. If the codes do not match, the licence page shows a countdown and asks you to complete verification or replacement within the indicated time to keep authorisation continuous; the documentation also asks you to confirm the node set is stable before applying at all. Capacity changes are licensing events, not just hardware events.

Renewal itself is an operation rather than an email. The documented sequence is write, temporary save, read the verification result for each item — passed, changed or mismatch — confirm any change, then publish. A licence that has been written but not published is not in effect. Put a person and a window against that sequence, because a renewal that slips has no automatic fallback.

Adding seats mid-term has the same shape. The licence carries a seat ceiling; seats are assigned to tenants in the management plane, and a tenant cannot be assigned fewer seats than it has already used, so the ceiling is raised before the people arrive rather than after. Seat usage, total seats and the usage ratio are visible per tenant.

What a vendor charges for a mid-term uplift is a commercial term, not a documented behaviour. Ask for the uplift rule in writing. A time-bounded licence makes every renewal a new agreement, so the terms worth demanding are the notice period, a cap on the increase, and what the vendor does if you decline it. If the quote does not cap the increase, your renewal price is whatever the vendor decides it is.

And expiry: do not infer a grace period from a system whose documentation does not promise one. Ours describes how to keep authorisation continuous and stops there. Ask every vendor what a lapsed licence does to a running system, in writing, before you need to know.

## The licence is not the running cost

The licence is one line, and the smaller one.

**Hardware and storage.** Object storage grows with the library and its version history; compute is sized against how many people edit at once, not against seat count. Licence capacity and system capacity are different axes. The [on-premises page](/on-premises) lists what has to run on your side.

**People.** Upgrades, restore testing, monitoring, identity mapping and the on-call rota. Most of this is process rather than product, so it never appears in a feature comparison; the [self-hosted collaboration guide](/blog/self-hosted-collaboration-guide) walks through what has to be staffed.

**Where the three land.** The licence is a software line, the nodes are an infrastructure line, storage is often a cloud line, and the people are a salary line. Those budgets usually sit in different meetings. A hosted quote folds all of them into one number, which is why it looks larger than a self-hosted licence and is often compared against a figure that is not the whole cost.

There is a case where the arithmetic does not work at all. If your team is small and stable, you have no residency or air-gap requirement, and you are not already paying for hardware you could reuse, self-hosting loses on total cost and no licence model rescues it. Revisit the deployment decision before you negotiate the licence.

## Comparing two quotes honestly

Which model you are shopping for depends on the organisation, not on the price list. Settle that shape first, then do the arithmetic.

```figure
type: matrix
title: Which model fits which organisation
items: Per-instance subscription | Per-seat subscription | Perpetual licence plus maintenance | Open source plus support
detail: Headcount is stable and known, so you can size the deployment once and stay inside the band. | The population grows or moves, and you would rather pay in step with it than commit to a band. | Capital budget, a fixed ceiling of named users, and a version you are not allowed to drift from. | A large population and a platform team that will own upgrades, because support alone will not cover them.
xAxis: Stable, small, well-known headcount
xAxisEnd: Growing, volatile or very large headcount
caption: Figure 2. Read left to right: the model that fits a settled organisation is rarely the one that fits a moving one. The seat ceiling matters in every quadrant.
```

Then normalise the two quotes you have.

1. **Convert both to cost per active user per year.** Licence, support, infrastructure and operations added together, divided by the people who open a document in a typical month — the active population, not the account list.
2. **Model the growth you expect, not the growth you hope for.** Run the arithmetic at year one, year two and year three headcount, including any band step and any uplift rule you failed to get in writing. A quote that is cheaper today and dearer next year is a different decision.
3. **Put the definition of a user in the contract.** Guests, service accounts, disabled accounts, contractors, and the point at which the count is measured. If a vendor will not commit the definition to paper, treat the guest population as chargeable.
4. **Ask what a seat audit looks like.** Which evidence, which period, what happens if you exceed the ceiling, whether overage is billed retroactively, and what window you get to correct it. Ours is visible in the management plane as seats used, total seats and the ratio between them, per tenant.
5. **Ask what a hardware change costs.** If the licence is machine-bound, every node addition, replacement and refresh is a licensing event with a lead time. Put it in the plan, not in the incident.
6. **Ask what expiry does.** Not what the salesperson assumes, but what the system is documented to do and how the next licence is issued before that.

What no article can tell you is what is in another vendor's contract. Those terms live in their paper, they change between versions, and the person answering your question may be reading a different version than the one you will sign. Send the six questions above as an email before you sign and keep the reply. A written answer to each of them is worth more than any comparison table, including this one.

For the record, ours are published: free for teams of up to five people, $5 per user per month on the Team plan, and 20% off billed annually, with the infrastructure and the operations on your side. The [pricing page](/pricing) states the whole of it, and the [self-hosted comparison](/blog/best-self-hosted-document-collaboration-tools) covers what a self-hosted licence does and does not include. Run the same six questions against it.
