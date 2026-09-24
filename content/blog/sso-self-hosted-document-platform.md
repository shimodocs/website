---
title: "Identity and SSO for a Self-Hosted Document Platform"
seoTitle: "SSO for a Self-Hosted Document Platform | ShimoDocs"
description: "LDAP, SAML and OIDC for a self-hosted document platform: what to integrate, how group mapping drives permissions, and what fails in practice."
layout: feature
category: self-hosting
date: 2026-04-03
updated: 2026-09-15
tags: [sso, identity, ldap, saml, oidc]
keywords: "sso self hosted documents, ldap saml oidc document platform, group mapping document permissions"
---

Identity is the control plane for a document platform. Every permission question reduces to who the user is and which groups they belong to, which makes the identity integration the single most consequential configuration decision in a self-hosted deployment.

It is also the integration most often done partially, and a partial identity integration degrades quietly: everything works until someone leaves and their access does not.

## Three protocols, different jobs

The three protocols people refer to as "SSO" solve different problems, and a deployment often needs more than one.

| Protocol | What it does | Where it fits |
| --- | --- | --- |
| LDAP | Directory lookup and bind authentication | Legacy directories, on-premises estates, group lookup |
| SAML | Browser-based federated authentication | Enterprise SSO, most identity providers, mature tooling |
| OIDC | Modern federated authentication over OAuth 2 | Newer providers, simpler configuration, token-based APIs |
| SCIM | Provisioning and deprovisioning via API | Automating account lifecycle, not authentication |

The practical combination in most self-hosted deployments is SAML or OIDC for authentication, plus LDAP or SCIM for group and lifecycle information.

```figure
type: compare
title: Authentication is not provisioning
left: Authentication (SAML, OIDC) | right: Provisioning (LDAP, SCIM)
leftItems: Proves who the user is | Happens at sign-in time | Creates no accounts by itself | Says nothing about group membership unless configured to | Fails visibly: users cannot sign in
rightItems: Creates, updates and disables accounts | Runs continuously or on a schedule | Carries group membership, which drives permissions | Determines what happens on departure | Fails quietly: access persists after someone leaves
caption: Figure 1. Most deployments configure the left column thoroughly and the right column partially. The right column is where audit findings come from.
```

That asymmetry is the central point of this article. Authentication failures are loud. Provisioning failures are silent, and silence is worse.

## What the platform needs from the directory

Four pieces of information, in rough order of importance.

The [Suite User Management guide](/docs/deployment/operations-platform/suite/user-management) is the first-party reference for the account state that the identity flow has to keep current.

**A stable unique identifier.** Not an email address, which changes, and not a display name, which is not unique. A directory-assigned immutable identifier is what the platform should key on.

**Group membership**, including nested groups resolved. This is what drives repository permissions in the model described in our [access control article](/blog/access-control-best-practices-documents).

**Account status.** Disabled, suspended or deleted. The platform has to learn about this, and it has to act on it without a human step.

**Profile attributes** for display: name, email, and whatever the organisation uses for department or location, which is often useful for access review reporting.

For platform administrators, the [platform user management guide](/docs/deployment/operations-platform/system-services/system-management/user-management) covers the separate operator-side account and role surface; it should not be confused with directory provisioning.

The failure to avoid is a platform that resolves group membership only at sign-in. A user who signs in once and stays signed in keeps their group-derived permissions from the moment of that sign-in, and a transfer or a departure that happens afterwards is not reflected until the session ends.

Two mitigations: short session lifetimes with re-evaluation, or provisioning that pushes membership changes to the platform independently of authentication. The second is better; the first is a reasonable fallback.

```figure
type: flow
title: What has to happen on the day someone leaves
items: Directory disables the account | Platform learns of it | Sessions are terminated | Group-derived access is revoked | Personal shares are reviewed
detail: The authoritative event, and the only one that should matter | Via provisioning, or at the next sign-in at the latest. The gap is the exposure window. | Not just blocked from signing in again: existing sessions have to end | Automatic, if access was ever group-derived | The step that catches what the directory cannot see
caption: Figure 2. The fourth step is automatic in a correctly configured deployment and the fifth is not. Every personal grant is a departure that the directory mechanism cannot complete on its own.
```

## Group mapping is where the work is

Mapping directory groups to platform roles is a small piece of configuration with a large organisational consequence, because it decides who owns access.

A model that holds up:

**Directory groups represent organisational reality** — teams, departments, functions. They are owned by whoever owns the team.

**Platform roles represent capability** — reader, contributor, reviewer, administrator. They are owned by the platform team.

**A mapping table connects them**, and it is the only thing the platform team maintains. Adding a team means adding a row, not restructuring the directory or granting permissions individually.

The alternative — per-user grants inside the platform — works at small scale and becomes unreviewable as the organisation grows. More importantly, it breaks the departure case: a per-user grant is invisible to directory-driven deprovisioning.

## Deprovisioning is the test that matters

Every identity integration should be validated by a lifecycle test rather than a sign-in test.

The sequence: create a user in the directory, add them to a group, confirm they can access the correct repository, move them to a different group, confirm the old access has gone, then disable the account and confirm all access has gone and the session has ended.

Most integrations pass the first half and fail the second. The common causes:

- **Sessions outlive the account.** The account is disabled and the existing session continues until it expires. Session lifetime, not account state, governs.
- **Group membership is cached.** The platform holds a cached copy that is refreshed on a long interval, so a transfer takes days to take effect.
- **Personal shares survive.** A document explicitly shared with an individual is not removed by group change, because it was never group-derived.
- **Guest accounts are outside the directory.** External collaborators provisioned manually are not covered by any of this and need their own review process.

Running that lifecycle test against each integration, and repeating it after any upgrade, is a more useful exercise than reading the integration documentation.

## Multi-factor authentication and session policy

Where MFA is enforced, it is usually enforced at the identity provider, which is the right place: one policy, applied consistently, with the document platform inheriting the result.

Two interactions worth configuring deliberately:

**Session lifetime in the platform** should be shorter than or equal to the identity provider's session. A platform session that outlives the SSO session means a user who has been logged out centrally still has an active document session.

**Step-up authentication** for privileged actions — changing retention rules, granting administrator rights, exporting a repository — is a meaningful control and is usually achievable through the identity provider rather than the platform.

If the platform supports local accounts, restrict them to break-glass use: documented, credential-escrowed, alerted on use, and with no group-derived permissions. Every other local account is one that bypasses the entire model.

## Common failure modes

**Keying on email address.** Email changes on name change or domain migration, and the platform then sees a new user with no history and an orphaned account.

**Nested groups unresolved.** A user added to a sub-team does not inherit the parent team's repository, and the failure looks like a permissions bug rather than a directory one.

**Clock skew breaking SAML assertions.** A few minutes of drift between the identity provider and the platform causes intermittent authentication failures that are hard to diagnose because they are intermittent.

**Certificate rotation not planned.** A signing certificate expiry takes down authentication for everyone, and it is entirely predictable.

**Testing only with an administrator account.** Administrators often bypass permission checks, so the test passes and ordinary users are broken.

## Identity in a constrained environment

Not every deployment has a directory to integrate with. Air-gapped and classified environments frequently have an identity provider that is available only on a restricted network, or none at all beyond local accounts. Our [air-gapped deployment article](/blog/air-gapped-document-collaboration) covers the wider constraints; the identity aspects are specific enough to note here.

Three patterns appear:

**A directory inside the boundary.** The cleanest case. The platform integrates with the same directory as everything else, and group mapping works as described above. The only additional requirement is that time synchronisation is reliable, since assertion validity depends on it.

**A one-way synchronisation from an external directory.** Identity data is exported, reviewed and imported through a controlled process. This works, and the constraint is freshness: departures are reflected at the cadence of the synchronisation, not immediately. The synchronisation interval is therefore a security parameter, and should be chosen deliberately and documented rather than left at whatever the tool defaults to.

**Local accounts only.** The fallback, and the one that requires the most discipline. Every control that would have come from the directory has to be replaced by process: a documented joiner and leaver procedure, a periodic access review generated from the platform itself, and mandatory multi-factor authentication at the application layer where supported.

In all three cases, the lifecycle test matters more than in a conventional deployment, because there is no second system that will notice a mistake. The test in the deprovisioning section above is the minimum, and in an isolated environment it should be run manually on a schedule rather than assumed.

## Where to start

If the deployment currently uses local accounts, the sequence is: connect the directory for authentication first, then group mapping, then deprovisioning, then test the lifecycle end to end. Doing it in that order means each step is independently verifiable.

The reason this matters beyond convenience is that identity is what makes every other control scoped. Retention rules, access reviews and audit reporting all assume the platform knows who belongs where. Our [access control article](/blog/access-control-best-practices-documents) covers using that model, and [air-gapped deployments](/blog/air-gapped-document-collaboration) covers the constrained case where a conventional identity provider is not available.
