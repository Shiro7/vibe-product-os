---
record_type: AUTHORITY_DECISION
decision_id: AUTH-DEC-002
decision_status: APPROVED
decision_scope: vibe-product-os-0.1.0-pilot.0-public-source-and-npm-pilot
authority_actor: M.M.Eyada
authority_ref: USER-DIRECTIVE-2026-08-25-PUBLIC-PILOT-AND-NPM
decided_at: 2026-08-25T02:42:45+08:00
depends_on: AUTH-DEC-001
---

# Public Pilot Use, Testing, Feedback, and npm Decision

## Decision

The Product OS Authority approves `vibe-product-os@0.1.0-pilot.0` for:

- public source use and testing from `https://github.com/Shiro7/vibe-product-os`;
- public feedback, defect reports, and testing observations through
  `https://github.com/Shiro7/vibe-product-os/issues`;
- public npm publication with access `public` and dist-tag `pilot` after every
  exact release subject and the release manifest pass detached Minisign
  verification with Authority key `EAB95C319319813D`;
- public installation and evaluation as a bounded pilot.

The `latest` npm tag must not be created or moved by this decision. This
decision applies only to version `0.1.0-pilot.0`; later versions require their
own exact release evidence and Authority decision.

## Required publication evidence

- source worktree is clean and the build report identifies the exact commit;
- package, runtime, Skill, audit, and clean-recipient checks pass;
- the six release subjects and configured manifest verify against the pinned
  Authority public key;
- the registry returns `vibe-product-os@0.1.0-pilot.0` and `pilot` resolves to
  that version after publication;
- the publication evidence records registry identity, integrity, time, tag,
  source commit, and release verification result.

## Claim boundary

This is permission to use, test, and provide feedback on a public pilot. It is
not a production-readiness, certification, compliance, universal-fitness, SLA,
or scaled-adoption claim. `AUTH-COND-002` remains open until the governed Ahd
P2 real-project Pilot is executed and accepted.

## Security and support

General feedback belongs in GitHub Issues. Suspected vulnerabilities must use
GitHub private vulnerability reporting and must not be disclosed in public
issues.

## Reopen triggers

Reopen this decision if the version, npm package name, access level, dist-tag,
license, signing key, support/security locator, ownership, or release subjects
change, or if verification or publication returns an ambiguous result.
