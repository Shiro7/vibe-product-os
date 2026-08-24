# W3 Closure Review — Operational Commands

Decision: **PASS — VERIFIED WORKING BASELINE**

## Closure evidence

- `status` validates the five canonical controls and reconciles project, profile, phase, gate, module, artifact, package, applicability, path, and anchor state without mutation.
- `update` detects catalog and rc.2 framework-lock drift, requires authority and change references for mutation, takes digest-bound backups, applies atomically, is idempotent when current, and refuses unsafe rollback after concurrent edits.
- `verify-release` rejects path escape and unsafe files, verifies exact size and SHA-256 identity, supports fail-closed detached Minisign verification, and never promotes checksum evidence into publisher or release authority.
- The three commands have 18 focused tests covering success, tampering, missing anchors and paths, exact rc.2/catalog identity, strict status, authorization boundaries, backup, rollback, idempotence, symlink escape, incomplete signatures, missing verifier, and traversal rejection.
- The generated release manifest binds the Skill ZIP, Codex Plugin ZIP, and npm tarball from one local internal-alpha build.

## Authority and release boundary

W3 does not publish npm content, sign release subjects, handle private keys, close a gate, approve a migration, or authorize distribution. `AUTH-COND-001` remains open until the Authority-controlled signing and key-custody procedure is executed and evidenced. `AUTH-COND-002` remains open until the real-project P2-or-higher Pilot closes. The next work is Pilot execution, then Authority signing and final public-release verification.
