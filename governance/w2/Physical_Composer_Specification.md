# Physical Composer Specification — W2

Status: **VERIFIED WORKING BASELINE**  
Composer ID: `vibe-product-os-physical-composer`  
Framework: Product OS `1.0.0` from `Product-OS-v1.0-rc.2`.

## 1. Purpose

The Physical Composer converts Product OS logical artifact selection into an exact project repository representation without changing the 281 canonical artifact identities. It updates GOV-002 and the profile composition control, creates operational authoring scaffolds only for applicable artifacts, and emits a generated physical map.

## 2. Inputs

The composer requires an initialized project with:

- `product-os.yaml`;
- `.product-os/profile-composition.yaml`;
- `.product-os/artifact-register.yaml`;
- the bundled 281-entry artifact catalog and P1/P2/P3 packaging codes;
- an exact phase scope (`active` by default, `00..11`, or explicit `all`);
- approved active module records or exact authority/evidence references for any conditional/event activation.

The requested profile must equal both governed project profile values. The composer never changes a project’s profile implicitly.

## 3. Deterministic representation rules

| Code | Physical treatment |
|---|---|
| `C`, `C*` | One phase-family composite file with stable member anchors |
| `M`, `M*` | Phase modules grouped by data class, with stable member anchors |
| `I`, `I*`, `I+` | One independent artifact file per applicable artifact |
| `R`, `R+` | Governance register representation; GOV-002 remains `.product-os/artifact-register.yaml` |
| `D`, `D+` | Registered derived locator, not an authorable semantic file |

`*` means conditional and absent until activated. `+` adds enhanced assurance expectations but does not create a new logical identity. `INIT-000`, `REQ-000`, and `EXP-000` remain physical aliases only and never enter the 281 count.

Directories and filenames follow the canonical repository standard: lowercase kebab-case, phase directories, `artifact-id--slug.md` for independent files, and `phase-NN--pack.md` style package names. GOV-001 and GOV-009 use their exact project-manifest locators.

## 4. Selection and applicability

Cross-phase GOV artifacts are always selected with the requested phase set. `CORE` and `RECUR` artifacts become `APPLICABLE`. `COND` and `EVENT` remain `PENDING` unless an approved module activates them or the command receives an exact artifact ID plus authority and evidence references. `DRVD` remains unmaterialized until a deterministic generator has canonical inputs.

The composer never infers `NOT_APPLICABLE`. An authority-approved complete N/A record is a separate governance action and produces no empty canonical file.

## 5. Profile and domain overrides

The default treatment comes from the project’s P1/P2/P3 profile. An active domain override applies only when an active module links the override by exact `domain_id` and lists the affected artifact IDs. Multiple applicable overrides resolve to the strongest profile. A downgrade or an unscoped active override blocks apply.

## 6. Outputs

An apply operation creates:

1. authorable Markdown package files for applicable non-derived artifacts;
2. one GOV-002 entry per selected applicable or pending logical artifact;
3. profile-composition packages with unique, addressable membership;
4. `.product-os/state/composition/artifact-physical-map.json` as a generated, do-not-edit view.

Every scaffold includes operational sections for purpose/scope, sources/evidence, questions/decisions, requirements/risks/dependencies, verification, handoff, exit, reopen, and history. Unknowns are explicit; the composer invents no project fact or approval.

## 7. Mutation safety

`compose` is dry-run by default. Apply requires `--apply`. Before writing, it validates both updated controls against the bundled schemas and checks every file, package, and register identity for conflict. It refuses existing artifact files or memberships rather than overwriting user work.

Writes are bounded to the resolved project root, reject symlink escape, use temporary-file replacement for controls, and roll back files and controls if an apply step fails. A repeated apply over the same phase fails closed and leaves the project byte-for-byte unchanged.

## 8. Authority boundary

Composition is a deterministic physical operation, not a gate, baseline, applicability, risk, compliance, or release approval. Output status starts at `NOT_STARTED`, approval at `PENDING`, verification at `NOT_STARTED`, and `authority_claim` is always `NONE`.

## 9. CLI contract

```text
vibe-product-os compose \
  --project <absolute-project-path> \
  [--profile P1|P2|P3] \
  [--phase active|all|00..11] \
  [--activate ARTIFACT-ID] \
  [--activation-authority-ref REF] \
  [--activation-evidence-ref REF] \
  [--dry-run|--apply]
```

Start with dry-run, review selected logical counts, pending artifacts, packages, paths, blockers, conflicts, and schema validation, then repeat with `--apply` only when the plan is authorized.
