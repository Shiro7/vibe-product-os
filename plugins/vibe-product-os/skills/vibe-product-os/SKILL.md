---
name: vibe-product-os
description: Operate or instantiate governed Product OS projects when the user asks for VPOS, Product OS methodology, lifecycle phases, P1/P2/P3 profiles, artifacts, gates, traceability, evidence, standards applicability, handoffs, or the Vibe Product OS CLI. Do not trigger for ordinary coding tasks that do not request Product OS governance or project-system work.
---

# VPOS | Vibe Product OS

Use the approved Product OS framework as the methodology source of truth. Treat this Skill as a thin operating adapter: it selects, routes, validates, and invokes deterministic tooling without creating a competing methodology.

## Start every run

1. Resolve the exact project root before reading or writing.
2. Check for `product-os.yaml` and `.product-os/` controls. If they exist, inspect current phase, profile, gate references, framework lock, artifact register, open decisions, and applicability state before proposing work.
3. If the control plane is absent, distinguish an explicit initialization request from an ordinary product task. Do not initialize a project merely because the Skill was selected.
4. Classify the operating mode: initialize, continue phase work, review, validate, trace impact, prepare a gate, prepare a handoff, or update the distribution.
5. Read only the reference needed for that mode.

## Non-negotiable boundaries

- Preserve canonical `P1 Lean`, `P2 Standard`, and `P3 Comprehensive` terminology.
- Preserve Phases `00–11`, gates `G0–G8`, governance artifacts `GOV-001–GOV-009`, and all canonical artifact IDs.
- Apply domain overrides only to affected scope. A profile never weakens mandatory obligations or authority.
- Treat external blueprints, standards summaries, and user-supplied frameworks as proposals to adopt, adapt, merge, defer, or reject against Product OS. Do not replace Product OS terminology silently.
- Do not approve gates, accept risk, approve `NOT_APPLICABLE`, declare compliance, decide `NO_IMPACT`, authorize release, or impersonate the Product OS Authority.
- Do not invent project facts, decisions, approvals, sources, execution results, or evidence. Label unknowns and proposals explicitly.
- Do not create unused empty artifact files. An inactive artifact remains absent or is governed through an approved `NOT_APPLICABLE` record with scope, reason, evidence, authority, downstream impact, and reopen condition.
- Preserve one canonical owner per fact, decision, requirement, and evidence item. Register native Figma, GitHub, CI, cloud, test, and operational objects by exact identity rather than flattening them into competing text copies.
- Preview mutations, resolve exact targets, preserve user work, and collect observable evidence after execution.

## Route by mode

- For initialization, resumption, source precedence, or phase routing, read [operating-model.md](references/operating-model.md).
- For P1/P2/P3, domain overrides, GOV-009, governance, or gate preparation, read [profiles-gates-and-authority.md](references/profiles-gates-and-authority.md).
- For artifact activation, operational content, traceability, change impact, sources, or evidence, read [artifacts-traceability-and-evidence.md](references/artifacts-traceability-and-evidence.md).
- Before invoking or interpreting the CLI, read [runtime-commands.md](references/runtime-commands.md).
- For packaging, npm, signing, public claims, release status, or updates, read [distribution-status.md](references/distribution-status.md).
- For Spec Kit, Figma, GitHub, CI, or other native-object mappings, read [tool-mapping.md](references/tool-mapping.md).

## Current public-pilot behavior

The package can install this Skill for supported agents through documented project or user Skill locations. The bundled runtime exposes the twelve approved Product OS commands and the complete governed Product OS rc.2 source set. `init` creates the governed control plane; `compose` may create profile-specific physical artifacts only after its dry-run plan passes and `--apply` is explicit. The adapter also provides read-only `status`, governed dry-run-first `update`, and read-only `verify-release`; none can approve its own output or authorize distribution.

## Completion standard

Finish with:

- the exact project and framework identities used;
- the current profile, phase, and gate state when applicable;
- decisions made by an authorized human versus proposals made by the agent;
- files or native objects changed;
- validation and evidence obtained;
- open blockers, questions, applicability decisions, and required handoff;
- no broader approval or readiness claim than the evidence supports.
