# Runtime Commands

Read this reference before invoking or interpreting the Vibe Product OS CLI.

## Distribution commands

| Command | Behavior |
|---|---|
| `vibe-product-os install` | Guided or non-interactive multi-agent installation at project or user scope; supports shared/native paths and copy/link methods |
| `vibe-product-os targets` | Reports supported agents, official guides, detection evidence, and exact deduplicated destinations |
| `vibe-product-os version` | Reports package and framework identities separately |
| `vibe-product-os setup-doctor` | Checks the packaged Skill, runtime, schemas, catalogs, and runtime lock |
| `vibe-product-os compose` | Plans or applies governed P1/P2/P3 physical packaging for selected phases; dry-run by default |
| `vibe-product-os status` | Reconciles current project, profile, phase, gate, module, artifact, package, applicability, path, and anchor state; read-only |
| `vibe-product-os update` | Plans catalog/lock reconciliation; apply and rollback require authority plus change references |
| `vibe-product-os verify-release` | Verifies exact release bytes and configured detached Minisign signatures; read-only and cannot authorize release |

Use `--dry-run` before installation or composition. Non-interactive installation writes require `--yes`; existing installations are preserved unless `--force` is explicit. Link mode uses a persistent project or user managed store instead of the temporary npm cache. Existing project artifact files and memberships are never overwritten by compose.

## Status, update, and release verification

```bash
vibe-product-os status --project /absolute/project/path --strict --json
vibe-product-os update --project /absolute/project/path --dry-run --json
vibe-product-os verify-release --manifest /absolute/release-verification-manifest.json --json
```

`status` is observational and never fills unknown decisions. `update` is idempotent, limited to the same Product OS release, and creates a verified rollback backup before apply; mutation requires exact authority and change references. `verify-release --require-signatures` fails unless every subject has a valid detached signature, but even valid signatures remain evidence for Authority review rather than publication authority.

## Physical Composer

An initialized project can be previewed with:

```bash
vibe-product-os compose --project /absolute/project/path --phase active --dry-run
```

Review the profile, selected and pending logical artifacts, packages, exact paths, blockers, conflicts, and schema result. Apply the same scope only with explicit consent:

```bash
vibe-product-os compose --project /absolute/project/path --phase active --apply
```

Conditional or event activation requires exact artifact IDs. If it is not already backed by an approved active module, apply also requires `--activation-authority-ref` and `--activation-evidence-ref`. The composer never infers `NOT_APPLICABLE`, never materializes a derived artifact as canonical authoring content, and never issues an approval claim.

## Bundled Product OS commands

The adapter delegates these commands to the approved dependency-free runtime:

| Command | Purpose | Mutation behavior |
|---|---|---|
| `init` | Create the bounded project control plane | Dry-run unless `--apply`; never overwrites governed files |
| `validate` | Validate project, catalog, schema, and framework records | Read-only |
| `lint` | Inspect paths, content signals, secrets, and unfinished state | Read-only |
| `reconcile` | Detect identity and catalog drift | Read-only |
| `graph` | Validate trace graph structure and coverage | Read-only |
| `impact` | Traverse bounded impact candidates | Read-only; cannot decide materiality |
| `gate` | Validate a gate decision record | Read-only; cannot approve |
| `baseline` | Inspect reproducibility of pinned content | Read-only |
| `handoff` | Validate handoff membership and obligations | Read-only; cannot acknowledge for a human |
| `migrate` | Stage a digest-pinned migration | Dry-run unless `--apply`; no cutover |
| `archive` | Build a content-addressed additive archive | Dry-run unless `--apply`; preserves sources |
| `doctor` | Diagnose runtime, framework, project, filesystem, and Git readiness | Read-only |

Use absolute project paths for consequential runs. Prefer `--json` when evidence or downstream automation needs a machine-readable report.

## Initialization boundary

Current `init` creates nine files: project manifest, framework lock, repository index, profile composition, artifact register, and four catalog snapshots. It intentionally creates no lifecycle artifact files; `compose` is the separate profile-aware physical operation.
