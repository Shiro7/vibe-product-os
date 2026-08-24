# Update Command Contract — W3

Status: **VERIFIED WORKING BASELINE**  
Command: `vibe-product-os update`

## Purpose

`update` reconciles an initialized Product OS 1.0.0 project with the exact catalogs and rc.2 source identity bundled in Vibe Product OS. It is a governed maintenance operation, not an approval or an open-ended migration engine.

## Planning and applicability

Dry-run is the default. The plan validates the project controls, compares all four catalog snapshots byte-for-byte, and compares the framework lock semantically against the bundled framework release, source digest, catalog versions, catalog digests, and catalog asset records.

If the project’s Product OS release differs from the bundled release, the command fails closed and requires a separate approved migration plan. A semantically current lock is not rewritten merely to change a timestamp or version; repeated execution is idempotent and reports `UP_TO_DATE`.

## Apply contract

An update with changes requires both `--authority-ref` and `--change-ref`. These references record human authorization provenance; the automation still returns `authority_claim: NONE` and never approves itself.

Before mutation, exact prior bytes are copied to a unique update backup with recorded before/after SHA-256 digests. Replacements are root-bounded, reject symlink escape, use atomic renames, verify post-write digests, and restore already-written files if an apply step fails.

## Rollback contract

Rollback accepts an exact generated update ID, not an arbitrary path. It defaults to dry-run, requires authority and change references for apply, verifies every backup and current post-update digest, and refuses automatic restoration when a file changed after the update. A successful rollback restores the exact pre-update bytes and writes an additive receipt.

## CLI

```text
vibe-product-os update --project <absolute-path> [--dry-run]
vibe-product-os update --project <absolute-path> --authority-ref <ref> --change-ref <ref> --apply
vibe-product-os update --project <absolute-path> --rollback <UPDATE-ID> [--dry-run]
vibe-product-os update --project <absolute-path> --rollback <UPDATE-ID> --authority-ref <ref> --change-ref <ref> --apply
```
