# Skill Trigger and Non-Trigger Specification — W1

## Trigger

Select this Skill when the user explicitly asks to initialize, operate, review, validate, compose, trace, gate, hand off, package, or distribute a Product OS project; names P1/P2/P3, Phases 00–11, G0–G8, GOV-009, Product OS artifacts, source/evidence, traceability, or the `vibe-product-os` CLI; or asks to turn a project methodology into a governed physical repository.

Examples:

- “Start Product OS Phase 00 for this project.” → `INIT`.
- “Continue Phase 04 and show the next gate.” → `RESUME` + `GATE`.
- “Compose the P2 files for Phase 03.” → `PROFILE` + `ARTIFACT`.
- “What breaks if REQ-004 changes?” → `IMPACT` + `TRACE`.
- “Map this Figma component and GitHub issue to the requirement.” → `TOOL_MAPPING` + `TRACE`.
- “Build the npm release for vibe-product-os.” → `DISTRIBUTE`.

## Do not trigger

Do not select this Skill for ordinary implementation, design, debugging, document writing, product advice, or project planning that does not request Product OS governance or use an existing Product OS control plane.

Examples:

- “Fix this React component.” → ordinary coding.
- “Design a pricing page.” → frontend/design workflow.
- “Explain OAuth.” → technical explanation.
- “Write a generic PRD.” → generic document task unless Product OS is explicitly requested or already governs the project.

## Ambiguous requests

If a project contains `product-os.yaml` but the request is an ordinary scoped implementation, inspect only the minimum controls needed to preserve active Product OS obligations; do not expand the task into a lifecycle ceremony. If the user says “our methodology” without naming Product OS and no control plane exists, ask or infer from direct workspace evidence before initializing anything.

## Trigger safety

Selection never grants authority. A triggered Skill can inspect, propose, scaffold, validate, and execute already-authorized reversible actions. It cannot approve a gate, accept risk, approve `NOT_APPLICABLE`, declare compliance, decide `NO_IMPACT`, or authorize release.
