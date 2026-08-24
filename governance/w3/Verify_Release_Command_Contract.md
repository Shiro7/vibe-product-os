# Verify Release Command Contract — W3

Status: **VERIFIED WORKING BASELINE**  
Command: `vibe-product-os verify-release`

## Purpose

`verify-release` verifies the immutable release subjects named by one generated manifest. It keeps three questions separate:

1. **Byte identity:** does each regular file have the exact recorded size and SHA-256 digest?
2. **Publisher identity:** does the configured detached Minisign signature verify against the configured public key?
3. **Release authority:** have the Product OS Authority conditions been closed and has publication been authorized?

Passing one layer never implies the next.

## Manifest boundary

The JSON manifest must use version `1.0.0`, `release_root: "."`, unique subject IDs and paths, lowercase SHA-256 digests, and safe integer sizes. Subjects, signatures, and public keys must be regular non-symlink files represented by single filenames in the manifest directory. Absolute paths, traversal, subdirectories, duplicates, missing files, and malformed records fail closed.

The pilot-candidate manifest covers exactly the Skill ZIP, Codex Plugin ZIP, npm tarball, SBOM, build report, and checksums produced from the same build.

## Signature verification

When a subject provides both a signature and public-key path, the command invokes the official `minisign` verifier without a shell using `-Vm`, `-x`, and `-p`. Invalid signatures, missing files, incomplete configuration, or an unavailable verifier fail the run. `--require-signatures` requires all subjects to verify.

The command never accepts or handles a private key, never creates signatures, and never converts a successful checksum into publisher identity.

## Authority boundary

Every unsigned candidate report returns `external_distribution_authorized: false` and `authority_claim: NONE`. `AUTH-DEC-001` closes the Apache-2.0 license decision and the public support/security channels are active. `AUTH-DEC-002` remains the exact decision for published `0.1.0-pilot.0`; `AUTH-DEC-003` is proposed for `0.1.0-pilot.1`. Before explicit approval, the current candidate reports both the exact-channel decision and package signatures as blockers. After approval, only exact signature verification can clear the release controls. `AUTH-COND-002` remains a production-claim boundary. The command is read-only and supplies evidence to the release workflow; it does not issue Authority decisions.

## CLI

```text
vibe-product-os verify-release --manifest <absolute-path> [--require-signatures] [--json]
```
