---
title: "Document Encryption and Key Custody"
seoTitle: "Document Encryption and Key Custody | ShimoDocs"
description: "What encryption at rest actually protects, when a customer-managed key is a real control, and why key custody decides the answer."
layout: magazine
category: security
date: 2026-03-20
updated: 2026-09-15
tags: [encryption, key management, byok, security]
keywords: "byok document encryption, customer managed keys, encryption key custody documents"
---

Encryption is the most frequently cited and least frequently examined security control in document procurement. Every serious platform encrypts at rest and in transit. The interesting question is not whether, but who holds the key — because that determines whether the encryption is a control or a compliance checkbox.

This is what key custody actually means, and how to tell a real control from a reassuring diagram.

## The baseline, and what it protects against

Encryption at rest and in transit are table stakes and should be assumed present.

What they protect against is narrower than people expect:

| Threat | Covered by default encryption |
| --- | --- |
| Physical theft of a disk | Yes |
| Interception on the network | Yes, with in-transit encryption |
| A misconfigured storage bucket exposed publicly | Partly — blobs are unreadable without keys, but metadata may leak |
| The operator reading your documents | **No** |
| A lawful access request to the operator | **No** |
| A vendor employee with production access | **No** |

The bottom three rows are the reason key custody matters. A running system holds the keys it needs to serve requests, which means the operator can decrypt whatever it can serve. Encryption at rest does not change that.

## How envelope encryption works

Every serious platform uses envelope encryption rather than encrypting data directly with a master key.

```figure
type: layers
title: Envelope encryption, and where custody can sit
items: Document content | Data key (DEK) | Key encryption key (KEK) | Root key or HSM
detail: Encrypted with a per-document or per-chunk data key. Rotating this is cheap and frequent. | Encrypted by the KEK and stored alongside the content. Compromise of one DEK exposes one document. | The layer that matters. Wrapped by the root key, held in a KMS. If the customer owns this, they own the boundary. | Held in a hardware security module. Non-exportable. The actual root of trust.
caption: Figure 1. "Encrypted at rest" describes the top two rows. Custody is decided at the bottom two, and that is the only place a customer-managed key has any effect.
```

When a vendor offers a customer-managed key, it is almost always at the KEK layer: the key material lives in your KMS, and the vendor's platform calls it to unwrap data keys. That is a genuine control over some threats and no control over others.

## The test that decides whether it is real

One question separates a real key control from a marketing one:

> Can the service operate normally while your key is unavailable?

If the answer is yes — the service continues to serve documents, or falls back to a vendor-held key — then you hold a key-shaped object rather than a control. Encryption with a fallback is encryption the operator can always bypass.

If the answer is no, and the platform genuinely fails closed, then the key is a control. It also means losing the key means losing the data, which is the same fact stated from the other side.

Ask this directly, and ask what happens during a key outage: does the platform fail closed, fail open, or degrade? The answer tells you which of the two you have.

## Comparing the custody models

| Model | Who can read plaintext | Availability risk | Operational cost |
| --- | --- | --- | --- |
| Vendor-managed keys | The vendor, and anyone who can compel them | Lowest | Lowest |
| Customer-managed key (BYOK) | The vendor, while the key is available | Medium — your KMS is now in the request path | KMS integration, rotation, outage planning |
| Hold-your-own-key (HYOK) | Only you, if implemented without fallback | High | Substantial engineering |
| Self-hosted | Only you, by construction | Yours | You operate the platform |

```figure
type: compare
title: Two ways to hold the only key
left: Customer-managed key on a hosted platform
right: Self-hosted with your own keys
leftItems: Key material sits in your KMS | The vendor still runs the software that decrypts | Requires vendor cooperation and a working integration | Key outage degrades the vendor's service, not yours
rightItems: The software runs inside your boundary | No vendor process participates in decryption | No integration dependency on a third party | Key loss is entirely your disaster to manage
caption: Figure 2. BYOK narrows who can reach plaintext. Self-hosting removes the question. Neither removes the obligation to manage key lifecycles and plan for loss.
```

## What a key control does not protect against

Holding the key is a meaningful control and it is not a complete one. Being clear about the boundary avoids a false sense of security.

**It does not protect metadata.** Document titles, folder structures, permissions, access logs and timestamps are usually stored unencrypted or under vendor-managed keys, because the platform needs to query them. A key you control protects content, not the shape of your repository.

**It does not protect against a compromised endpoint.** If a user's laptop is compromised, the attacker reads documents through the legitimate session, with the key working exactly as designed. Endpoint security is a separate control.

**It does not stop a privileged insider at the application layer.** Someone who can query the running service sees plaintext regardless of where the key material lives, because the service holds unwrapped keys for the duration of a request.

**It does not cover copies outside the platform.** Exports, email attachments, downloaded files and screenshots all sit outside the key boundary. Sharing controls govern the routes; the key governs none of them.

**It does not survive a bad rotation.** Rotation done wrong is a data-loss event, and the failure is not discoverable until a restore is attempted. Test rotation on a non-production copy before running it in earnest.

**It does not make deletion automatic.** Destroying a key is the most complete deletion available, and it is indiscriminate — it takes every document the key covered, including anything under legal hold.

The honest summary is that key custody narrows who can reach plaintext, and it does that one thing well. Organisations sometimes adopt it expecting it to answer a broader set of questions about data protection, and the gap between expectation and effect is where disappointment lives.

## The trade-offs nobody mentions in the sales cycle

**Availability becomes your problem.** Once your KMS is in the request path, a KMS outage is a document outage. That needs to be in the availability model, not discovered during an incident.

**Rotation is real work.** Rotating a KEK means rewrapping every data key. Ask how the platform performs it, whether it is online, and how long it takes at your content volume.

**Escrow is a genuine dilemma.** An escrow copy protects against key loss and undermines the control, because the escrow holder can decrypt. There is no clever resolution; there is only a decision about which risk you prefer, made explicitly and recorded.

**Deletion and keys interact.** Destroying the key is the most complete form of deletion available — crypto-shredding — and it is irreversible. That is excellent for disposal and dangerous if a legal hold applies to the same content. Our [legal hold article](/blog/legal-hold-document-management) covers the interaction.

**Backups may not be covered.** A very common gap: content is encrypted with customer-managed keys, backups are encrypted with vendor-managed keys. Verify which keys protect which copies.

## What to require

1. **Envelope encryption with a stated key hierarchy.** Ask which layer customer custody applies to.
2. **A documented failure mode.** Fail closed, fail open, or degrade — in writing.
3. **Online rotation** with a stated duration at your volume.
4. **An incident and access model for the operator.** Who can reach keys, under what logging and approval.
5. **A deletion story that reaches every copy**, including backups and derived indexes.
6. **Clarity on escrow.** Whether any copy of the key exists outside your control.
7. **Evidence of enforcement**, not configuration screenshots. Test that a disabled key actually stops access.

## Where this lands

Key custody is one of the few areas where the difference between models is structural rather than configurational. If an operator can decrypt, regulatory and contractual questions about access remain open, and no amount of key management in a shared system changes that. Our [data sovereignty article](/blog/data-sovereignty-document-collaboration) covers why that distinction is the one procurement conversations keep blurring.

For organisations whose requirement is that no third party can reach plaintext, self-hosting is the only model that answers it without depending on a vendor's implementation details. The evaluation criteria are in our [self-hosted office suite comparison](/blog/self-hosted-office-suite-comparison), and the operational implications are in the [self-hosted collaboration guide](/blog/self-hosted-collaboration-guide).
