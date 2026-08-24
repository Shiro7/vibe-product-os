# Status Command Contract — W3

Status: **VERIFIED WORKING BASELINE**  
Command: `vibe-product-os status`

## Purpose

`status` reconciles an initialized project’s governed control plane into one current-state report. It answers what profile and phases are active, which gates are referenced, which modules are active, how many artifacts are registered and materialized, and which records need attention.

## Inputs and validation

The command requires the five canonical project controls: `product-os.yaml`, framework lock, repository index, profile composition, and artifact register. Each control is parsed with the bundled restricted parser and validated against its pinned Product OS schema before the report is built. It also compares the four project catalog snapshots and rc.2 source lock against the exact bundled identities.

Status verifies framework identities, duplicate register entries and memberships, artifact paths and anchors, applicability consistency, unassigned owners, lifecycle attention states, and package membership. A composite or modular locator is materialized only when both its file and its exact member anchor exist.

## Outputs

The report contains project and framework identities; active phases, gate references, and modules; artifact counts by status, applicability, approval, verification, and materialization; package summaries; structured findings; and a final `HEALTHY` or `NEEDS_ATTENTION` result.

`--strict` returns exit code `1` when attention findings exist. It does not turn a finding into an authority decision.

## Authority and mutation boundary

The command is read-only and returns `authority_claim: NONE` and `no_files_changed: true`. It does not infer decisions from GOV-003, decide applicability, approve gates, accept risk, declare compliance, or change project state.

## CLI

```text
vibe-product-os status --project <absolute-path> [--strict] [--json]
```
