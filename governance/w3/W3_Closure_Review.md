# W3 Closure Review — Operational Commands

Decision: **PASS — VERIFIED WORKING BASELINE**

## Closure evidence

- `status` validates the five canonical controls and reconciles project, profile, phase, gate, module, artifact, package, applicability, path, and anchor state without mutation.
- `update` detects catalog and rc.2 framework-lock drift, requires authority and change references for mutation, takes digest-bound backups, applies atomically, is idempotent when current, and refuses unsafe rollback after concurrent edits.
- `verify-release` rejects path escape and unsafe files, verifies exact size and SHA-256 identity, supports fail-closed detached Minisign verification, and never promotes checksum evidence into publisher or release authority.
- The three commands have 20 focused tests covering success, tampering, missing anchors and paths, exact rc.2/catalog identity, strict status, authorization boundaries, backup, rollback, idempotence, symlink escape, subject and manifest signatures, missing verifier, and traversal rejection.
- The pilot release manifest binds the Skill ZIP, Codex Plugin ZIP, npm tarball, SBOM, build report, and checksums from one candidate build.

## Authority and release boundary

W3 does not publish npm content, sign release subjects, handle private keys, close a gate, approve a migration, or authorize distribution. Framework conditions `AUTH-COND-001` and `AUTH-COND-004` are closed by additive Authority evidence. `AUTH-COND-002` remains open until the real-project P2-or-higher Pilot closes. `AUTH-DEC-001` approves Apache-2.0 and the public support/security channel policy; the approved channels are active and verified. `AUTH-DEC-002` approves public pilot use and the exact npm `pilot` channel for `0.1.0-pilot.0`. The package candidate still requires its own exact signatures and regenerated clean-recipient verification.
