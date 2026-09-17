---
title: "Document Collaboration on an Air-Gapped Network"
seoTitle: "Collaboration Without Internet Access | ShimoDocs"
description: "Running document collaboration with no internet access: offline installation, dependency handling, updates, identity and the tradeoffs involved."
layout: briefing
category: self-hosting
date: 2026-04-06
updated: 2026-09-17
tags: [air-gapped, offline, security, deployment]
keywords: "air gapped document collaboration, offline document platform, disconnected network collaboration software"
---

An air-gapped deployment is the strictest form of self-hosting and the least forgiving. There is no package repository to reach, no certificate authority to validate against, no time server to trust by default, and no vendor telemetry to tell you something is wrong.

It is also the deployment where a document platform earns its place most clearly, because in a disconnected environment collaboration is hardest and most valuable.

## What changes when there is no internet

Five things that a connected deployment takes for granted.

| Dependency | Connected | Air-gapped |
| --- | --- | --- |
| Installation | Package manager pulls dependencies | Every artefact transferred on removable media |
| Updates | Downloaded and applied | Transferred through a controlled process, often weeks behind |
| Time | Network time protocol | Local time source, and it must be reliable |
| Certificates | Public certificate authority | Internal authority, and its root must be distributed |
| Container images | Registry pull | Pre-loaded into an internal registry or side-loaded |
| Telemetry and support | Streaming | None, unless explicitly engineered |

The practical consequence is that installation becomes a supply chain exercise. Every artefact needs to be obtained, verified, transferred and recorded, and the record is what makes the next installation possible.

## Building an offline installation set

An installation set is not just the application package. It is everything needed to reach a running system, assembled while you still have the access to do it.

What belongs in it:

- **The application artefacts for the target version**, plus the previous version in case a rollback is needed.
- **Every container image**, exported rather than referenced, including base images.
- **Database and coordination service packages**, at the exact versions the release requires.
- **Any dependencies the installer would otherwise fetch**, which is the item most often missed and the one that stops an installation half way.
- **Certificates and the internal authority's root**, generated before transfer.
- **Configuration templates and the deployment runbook**, because you cannot consult documentation online while installing.
- **Checksums for everything**, so the receiving side can verify that nothing was altered in transit.

The verification step is not bureaucratic. Removable media is a real attack vector, and a set that cannot be verified cannot safely be used in the environments where such deployments live.

```figure
type: flow
title: The offline installation set, and where it comes from
items: Assemble connected | Verify and record | Transfer on media | Verify again inside | Install offline
detail: On a host with internet access, matching the target version exactly | Checksums generated and recorded, with the manifest archived | Through whatever the site's procedure specifies, logged | Independently verified against the recorded checksums before use | No package fetches; every dependency must already be present
caption: Figure 1. Step four is the one that matters. A manifest that is not re-verified inside the boundary provides assurance about the wrong moment in the process.
```

```figure
type: matrix
title: What changes, and how visible the failure is
items: Installation | Updates | Time synchronisation | Certificate trust
detail: Becomes a supply chain exercise: assemble, verify, transfer, verify again, install. Visible immediately if something is missing. | Slower and scheduled rather than opportunistic. Falls behind, which is visible only as accumulated risk. | Assertion validity windows measured in minutes. Fails intermittently, which is the hardest failure to diagnose. | Internal authority replaces the public one, and renewal is manual with a real outage risk.
xAxis: FAILS LOUDLY
xAxisEnd: FAILS QUIETLY
caption: Figure 2. The right-hand column is where air-gapped deployments accumulate problems, because nothing announces them and there is no vendor telemetry to notice on your behalf.
```

## Time and certificates

Two dependencies that are invisible until they break, and broken in an air-gapped environment they are painful to diagnose.

**Time.** Authentication assertions have validity windows measured in minutes. If the platform's clock drifts from the identity provider's, sign-in fails intermittently — the worst kind of failure to investigate. A reliable local time source, and monitoring that alerts on drift rather than on absolute time, is worth configuring before the first user signs in.

**Certificates.** With no public authority, the internal authority's root has to be trusted by every client. This is straightforward in a managed fleet and awkward with a mix of devices. It also means certificate renewal is a manual process with a real outage risk, so expiry dates belong in a monitored calendar rather than in someone's memory. Our [monitoring article](/blog/monitoring-self-hosted-document-platform) covers the alerting pattern.

## Updates in a disconnected environment

The update process is the operational burden that surprises teams. It is not difficult, and it is slow, and it needs to be scheduled rather than fitted in.

A workable process:

1. **Track releases on the connected side.** Subscribing to release notifications is possible even when the deployment cannot reach the internet.
2. **Assemble and verify the update set** the same way as the installation set, with the same manifest discipline.
3. **Test inside the boundary on a staging deployment.** This matters more here than anywhere else, because you cannot revert to a vendor's support channel mid-upgrade.
4. **Schedule the production upgrade** with a longer window than a connected deployment would need, because every artefact is already local and nothing can be fetched if something is missing.
5. **Keep the previous version's artefacts** inside the boundary. Rollback in an air-gapped environment is a restore or a redeploy, and it depends entirely on having the previous set available.

The cadence will be slower than a connected deployment. Being deliberate about it — quarterly, say, rather than whenever someone has time — is what keeps an air-gapped deployment from falling years behind.

## Identity

Most air-gapped sites have a directory on the internal network, and the platform integrates with it normally. Where that is not available, the identity implications are covered in our [identity and SSO article](/blog/sso-self-hosted-document-platform): the short version is that local accounts require a documented joiner and leaver process and a periodic access review, because no directory will catch mistakes on your behalf.

## What you give up

Being clear about this is more useful than pretending the tradeoffs away.

**Vendor support is limited to what you can describe.** No remote session, no telemetry, no logs uploaded. Diagnostics happen over the phone or through exported bundles, and the quality of support depends on the quality of your own instrumentation.

**Diagnosis is slower.** In a connected deployment, an engineer can reproduce a problem against the same version. In an air-gapped one, they cannot see your environment at all.

**Security patching is delayed.** The gap between a vulnerability being published and a patch reaching a disconnected network is measured in weeks, and it is the strongest argument for maintaining a strict internal change process to compensate.

**AI features need local infrastructure.** An assistant that calls an external model endpoint will not work. Inference has to run inside the boundary, which means GPU capacity, a locally hosted model, and the operational responsibility for it. Our [AI agents article](/blog/ai-agents-in-documents-security) covers what to configure; in this environment, the inference target is not a choice between vendors but a decision about local capacity.

## Working inside the boundary

Beyond installation, three operational realities shape day-to-day running.

**Diagnostics need local instrumentation.** With no telemetry leaving the network, the only view of platform health is what you collect yourself. That makes the monitoring setup more important than in a connected deployment rather than less, because there is no vendor-side view to fall back on. Logs, metrics and synthetic checks all have to be local, retained locally, and reviewed by someone.

**Support bundles become the primary support channel.** Most vendors provide a diagnostic export precisely for this case. Knowing how to produce one, what it contains, and how to review it for sensitive content before it leaves the boundary is a procedure worth writing before it is needed. That last step matters: a support bundle frequently contains configuration, identifiers and sometimes content fragments.

**Change windows are longer because nothing can be fetched.** A connected deployment can recover from a missing artefact by downloading it. An air-gapped one cannot, so a missing dependency at the wrong moment means abandoning the window and waiting for the next media transfer. Over-provisioning the installation set slightly is cheaper than the alternative.

## Validating that the gap holds

An air-gapped network is a claim about network behaviour, and claims about networks are worth testing.

Two checks that catch the common failures:

**Attempt outbound connections from the platform hosts** and confirm they fail. A host with an unexpected route, a proxy configuration inherited from an image, or a dual-homed interface can quietly have the access everyone believes it does not.

**Inspect the application's own configuration** for endpoints it may call: update checks, telemetry, certificate revocation lookups, and any AI inference target. These are frequently left at defaults and fail silently when unreachable, which is usually harmless and occasionally a surprise during an incident.

Both checks are worth repeating after any upgrade, since a new version may add an outbound call that the previous one did not make.

## Where it makes sense

An air-gapped deployment is justified when the content genuinely cannot leave the boundary — classified material, regulated research, or environments where the network isolation is the primary control.

It is badly suited to organisations that want the isolation without the operational commitment. The burden is real, permanent, and concentrated in a small number of people. Where the requirement is data residency or sovereignty rather than isolation, a conventional self-hosted deployment is usually the better fit, as covered in our [data residency guide](/blog/data-residency-requirements-guide).

```pullquote
An air gap is justified by content that cannot leave the boundary, not by a preference for stronger security.
```

For what running the platform involves day to day, see [backup and restore](/blog/backup-and-restore-document-platform) and [upgrading safely](/blog/upgrade-and-rollback-document-platform).

The deployment shape itself — what has to cross the gap, and how AI inference runs with no outbound access — is set out on the [air-gapped deployment page](/airgap).
