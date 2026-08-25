---
record_type: AUTHORITY_DECISION
decision_id: AUTH-DEC-005
decision_status: APPROVED
decision_scope: vibe-product-os-0.1.0-pilot.2-website-and-npm-homepage
authority_actor: M.M.Eyada
authority_ref: USER-DIRECTIVE-2026-08-25-DEPLOY-SITE-AND-NPM-HOMEPAGE
proposed_at: 2026-08-25T14:08:27+08:00
decided_at: 2026-08-25T14:08:27+08:00
amended_at: 2026-08-25T14:29:37+08:00
amendment_ref: USER-DIRECTIVE-2026-08-25-NPM-PRIMARY-PAGE-CURRENT-VERSION
depends_on: AUTH-DEC-001, AUTH-DEC-003, AUTH-DEC-004
supersedes_for_current_release: AUTH-DEC-003
---

# VPOS Website and npm Homepage `pilot.2` Decision

## Decision

The Product OS Authority approves `vibe-product-os@0.1.0-pilot.2` as a bounded
public pilot release for the redesigned VPOS website and the npm homepage
locator change to `https://shiro7.github.io/vibe-product-os/`.

The release scope is limited to:

- publishing the independently prepared VPOS website through the existing
  GitHub Pages workflow;
- changing npm package metadata so the package homepage opens the public VPOS
  website instead of the repository README;
- retaining the public source, feedback, support, security, license, installer,
  runtime, profiles, artifact model, and claim boundary already approved;
- publishing npm access `public` under dist-tag `pilot` only after the exact
  release evidence below passes.

The Product OS Authority additionally directs that npm dist-tags `pilot` and
`latest` both resolve to `0.1.0-pilot.2` after publication and verification.
This is required so the primary npm package page renders the current VPOS
version, README, and homepage instead of the historical `0.1.0-pilot.0`
metadata. `AUTH-DEC-002` and `AUTH-DEC-003` remain immutable evidence for their
published versions. This decision applies only to `0.1.0-pilot.2`.

## Required release evidence

- the source is merged through the repository review path and built from one
  clean, exact Git commit;
- the website check, package tests, runtime tests, distribution build, package
  audit, and clean-recipient checks pass;
- the deployed website returns HTTP 200 and preserves the public-pilot claim
  boundary;
- Skill ZIP, Codex Plugin ZIP, npm tarball, SPDX SBOM, build report, checksums,
  and configured release manifest pass detached Minisign verification against
  Authority key `EAB95C319319813D`;
- npm returns `vibe-product-os@0.1.0-pilot.2`, its homepage resolves to the
  VPOS website, and dist-tags `pilot` and `latest` resolve to the exact
  published version;
- additive evidence records source commit, Pages deployment, registry
  integrity, signature verification, tag state, and clean public install.

## Claim boundary

The release remains a public pilot for use, testing, and feedback. It does not
claim production readiness, certification, compliance, universal host
compatibility, a paid SLA, or scaled adoption. `AUTH-COND-002` remains open
until the governed Ahd P2 real-project Pilot is executed and accepted.

## Security and custody

General feedback remains in GitHub Issues and suspected vulnerabilities remain
in GitHub private vulnerability reporting. Private signing keys must not be
committed, bundled, uploaded, copied into evidence, or exposed to an agent.

## Reopen triggers

Reopen this decision if the version, package name, license, public repository,
homepage, access, approved dist-tags, signing key, release subjects, support/security
channel, ownership, or claim boundary changes; or if deployment, signature
verification, publication, or clean installation returns an ambiguous result.
