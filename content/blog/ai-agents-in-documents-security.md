---
title: "AI Agents Inside Your Documents: What to Secure"
seoTitle: "AI Agents in Documents: Security Checklist | ShimoDocs"
description: "Where document AI leaks data, what to configure before enabling agents, and how to keep an auditable trail of every AI edit."
layout: feature
category: ai
date: 2026-01-28
tags: [ai agents, security, data flow, governance]
keywords: "ai agents documents, document ai security, enterprise ai data control, ai edit audit trail"
featured: true
---

An AI assistant that reads your documents is a data pipeline. It has an input, a processing step and an output, and every one of those stages is a place where content leaves a boundary or a permission is quietly widened.

Most organisations enable the feature and audit the pipeline later, if at all. This is the checklist to run before enabling it.

```figure
type: flow
title: The four egress points
items: Retrieval | Prompt payload | Provider retention | The output
detail: Does the search respect document permissions, or the service account's? | Document text packaged and sent to a model endpoint | Requests kept for abuse monitoring, evaluation or training | Generated text cached, logged or written back with new access rules
caption: Figure 1. If you cannot draw all four arrows on a diagram, you do not yet know where your content goes.
```

## The four places document AI actually leaks

**1. The retrieval step.** To answer a question, the assistant fetches relevant content. If retrieval ignores document permissions, the assistant becomes a confused deputy that reads files on behalf of a user who could not open them.

**2. The prompt payload.** Text is packaged and sent to a model endpoint. This is the clearest egress point and usually the least documented.

**3. The inference provider's retention.** Requests may be retained for abuse monitoring, evaluation or training. Retention windows are often shorter than storage retention, which makes them easy to overlook and still non-zero.

**4. The output.** Generated text can be cached, logged or written back into the document, creating a new copy with its own access rules — or none.

If you cannot draw all four arrows on a diagram, you do not yet know where your content goes.

## Configuration decisions before rollout

### Choose the inference target deliberately

The meaningful distinction is not which model is smartest. It is whether document plaintext leaves your network at query time.

Options in ascending order of control:

| Target | Egress | Suits |
| --- | --- | --- |
| Vendor's model API | Document text leaves | Low-sensitivity workspaces |
| Your cloud account, vendor-hosted model | Leaves your network, stays in your cloud tenancy | Partial control |
| Self-hosted open model on your hardware | No external egress | Regulated content |
| No AI | None | Until the above is decided |

A suite with a configurable endpoint lets you move along this table without changing products. That is worth more than any single model's benchmark score.

The [AI configuration guide](/docs/deployment/operations-platform/suite/ai-configuration) is the first-party reference for the endpoint and feature settings that determine this egress path.

### Make permission checks part of retrieval

The assistant's search must run with the requesting user's permissions, not the service account's. Ask the vendor directly: does retrieval filter by document ACL, or does it search everything and rely on the model to be discreet?

The second answer means your permission model is decorative once AI is enabled.

### Decide who can enable what

Three separate switches are worth having:

- **Tenant-level:** is external AI permitted at all?
- **Workspace-level:** which workspaces may use it?
- **Per-user:** can any user invoke an agent, or only approved roles?

Without the first, your data-flow diagram describes an intention rather than a control.

### Settle the logging question

Logging prompts is useful for debugging and dangerous for confidentiality. Logging completions has the same tension. Decide explicitly:

- Are prompts logged? Where, and for how long?
- Are they visible to administrators? To workspace owners?
- Are they included in eDiscovery or retention holds?
- Can a user see the context that was sent on their behalf?

A defensible default is to log metadata always — who invoked what, on which document, when — and to log content only in a debugging mode that is off by default and time-limited.

The deployment boundary and its supported resources are documented in the [system requirements guide](/docs/deployment/system-requirements); use it before treating a local model endpoint as an operationally complete control.

## The audit trail is the product

The feature that makes agents safe to enable is not a guardrail, it is a record.

Every AI action should carry:

- **An identity.** A named agent, not "the system". "Researcher · AI" is reviewable; an anonymous edit is not.
- **A location.** Which document, which section, which paragraph.
- **A change.** What it added, replaced or removed, visible in history alongside human edits.
- **A reviewer.** Who accepted, changed or reverted it, and when.

If AI edits do not appear in version history, your audit cannot distinguish machine changes from human ones. That is an uncomfortable position to explain to an auditor.

```figure
type: matrix
title: Controls in order of effectiveness
items: Limit capability | Require acceptance | Treat content as data | Filter instructions
detail: An agent that can only draft cannot be tricked into deleting records. This is the control that actually works. | Draft rather than apply, so every write passes a human. Cheap and effective. | A vendor-side property. Ask how retrieved content is delimited from instructions. | Text filtering is incomplete by construction. Treat it as defence in depth, never as the control.
xAxis: WEAKER CONTROL
xAxisEnd: STRONGER CONTROL
caption: Figure 2. No prompt-level defence is complete. What works is limiting what the agent is allowed to do.
```

## Prompt injection is a document problem

Instruction-following models read content as input. If a document contains text shaped like an instruction, a naive agent may act on it.

The practical mitigations, in order of effectiveness:

1. **Limit what the agent can do.** An agent that can only draft into a scratch area cannot be tricked into deleting records.
2. **Require human acceptance for writes.** Draft, don't apply.
3. **Treat retrieved content as data, not instructions.** Vendor-side, but ask how it is handled.
4. **Keep the blast radius small.** Scope an agent to one document or one workspace rather than the whole tenant.

The uncomfortable truth is that no prompt-level defence is complete. The control that works is limiting capability, not filtering text.

## A pre-rollout checklist

**Data flow**
- Where does inference happen, and what is the egress path?
- What is retained by the inference provider, for how long, and can it be disabled?
- Is document content used for training? Get this in writing.

**Access**
- Does retrieval respect document permissions?
- Can a user retrieve content they could not open directly?
- Are agents scoped per workspace or per tenant?

**Governance**
- Who can enable AI, at which levels?
- Are prompts logged, and if so who can read them?
- Do AI edits appear in version history with an identity?

**Resilience**
- What happens to agent actions when the model endpoint is unavailable?
- Can AI be disabled quickly without breaking documents?
- Is there a documented way to review and revert a batch of AI changes?

If more than a handful of these are unanswered, the honest position is that AI is in a pilot, not in production.

## Sequencing the rollout

1. **Pick one workspace with low-sensitivity content.** Prove the workflow before the policy.
2. **Answer the data-flow questions with evidence**, not vendor assurance.
3. **Enable with write access disabled.** Draft-only first, so mistakes are cheap.
4. **Review the edit history with the team.** Confirm the trail is usable before relying on it.
5. **Expand by workspace, not by user count.** Scope is easier to reason about.
6. **Re-answer the questions at each renewal.** Model endpoints and retention policies change.

## Where ShimoDocs sits

The AI workspace in ShimoDocs is built so that agents have an identity, a cursor and an entry in the edit history, and the model endpoint is configurable. That combination is what makes the pipeline auditable and the egress controllable.

If the reason you are reading this is a [data sovereignty](/blog/data-sovereignty-document-collaboration) requirement rather than an AI interest, that article covers the wider argument, and [what private cloud collaboration involves](/blog/what-is-private-cloud-document-collaboration) covers the architecture.
