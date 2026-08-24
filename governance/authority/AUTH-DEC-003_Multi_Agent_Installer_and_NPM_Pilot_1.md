---
record_type: AUTHORITY_DECISION_PROPOSAL
decision_id: AUTH-DEC-003
decision_status: PROPOSED_PENDING_AUTHORITY_CONFIRMATION
decision_scope: vibe-product-os-0.1.0-pilot.1-multi-agent-installer-and-npm-pilot
authority_actor: M.M.Eyada
authority_ref: PENDING_EXPLICIT_VERSION_SPECIFIC_CONFIRMATION
proposed_at: 2026-08-25T04:50:43+08:00
depends_on: AUTH-DEC-001, AUTH-DEC-002
supersedes_for_current_release_if_approved: AUTH-DEC-002
---

# Proposed Multi-Agent Installer and npm `pilot.1` Decision

## Proposed decision

Approve `vibe-product-os@0.1.0-pilot.1` as the next bounded public pilot
release with this exact scope:

- the expanded operating guide centered on project use, collaboration,
  commands, workflow steps, and expected outputs;
- guided and non-interactive Skill installation for Codex, Claude Code,
  Gemini CLI, GitHub Copilot, Cursor, Windsurf, OpenCode, Cline, Zed, and
  explicitly supplied custom Skill roots;
- project or user scope, shared or native placement, and copy or managed-link
  installation with dry-run, consent, overwrite protection, receipts, atomic
  staging, rollback, and path-overlap controls;
- public source review through `https://github.com/Shiro7/vibe-product-os`;
- public npm publication with access `public` and dist-tag `pilot` only after
  the exact release candidate satisfies the evidence below;
- public installation, testing, and feedback as a bounded pilot.

The npm `latest` tag would not be moved. `AUTH-DEC-002` remains the immutable
decision for `0.1.0-pilot.0`; this proposal applies only to
`0.1.0-pilot.1` and has no publication authority until explicitly approved by
the Product OS Authority.

## Required release evidence

- source merged through the repository review path and candidate built from
  one clean, exact Git commit;
- unit, runtime, package, installer, composition, and release-verification
  checks pass;
- official Skill locations recorded for every named host are current, with a
  visible warning and conservative copy option where symlink discovery is not
  explicitly documented;
- the package tarball passes prohibited-path, private-key, clean-recipient,
  setup-doctor, and installation checks;
- Skill ZIP, Codex Plugin ZIP, npm tarball, SPDX SBOM, build report, and
  checksums plus the configured manifest pass detached Minisign verification
  with pinned Authority key `EAB95C319319813D`;
- npm returns `vibe-product-os@0.1.0-pilot.1`, and dist-tag `pilot` resolves to
  that exact version after publication;
- additive publication evidence records source commit, registry integrity,
  signed-manifest result, publication time, tag state, and clean public install.

## Package and attestation model

The published npm tarball cannot contain a final signature over itself without
changing the bytes being signed. The package therefore reports the Authority
decision state and requirement for an external signed release manifest; its
embedded metadata alone does not prove publisher identity. Publisher identity
and exact release authorization exist only when detached signatures and the
signed manifest verify against the pinned Authority public key.

## Claim boundary

If approved, this release permits public pilot use, testing, integration
trials, and feedback. It does not claim production readiness, certification,
compliance, universal host compatibility, a paid SLA, or scaled adoption.
Directory compatibility follows each host's public guidance; runtime behavior
remains subject to that host and the selected installation method.
`AUTH-COND-002` remains open until the governed Ahd P2 real-project Pilot is
executed and accepted.

## Security and support

General feedback belongs in GitHub Issues. Suspected vulnerabilities use
GitHub private vulnerability reporting. Private signing keys must never be
handled by an AI agent, committed, bundled, uploaded, or copied into release
evidence.

## Reopen triggers

Reopen after approval if version, package name, license, repository, access,
dist-tag, signing key, release subjects, target directory model, support or
security channel, ownership, or claim boundary changes; if an official host
path materially changes; or if signing, verification, publication, or public
installation returns an ambiguous result.
