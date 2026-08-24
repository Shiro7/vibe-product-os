# Product OS Skill Architecture — W1

Status: **VERIFIED WORKING BASELINE**  
Scope: `vibe-product-os` Skill, plugin, npm package, CLI adapter, and bundled Product OS runtime.  
Framework identity: Product OS `1.0.0`, source release `Product-OS-v1.0-rc.2`.

## 1. Architectural decision

The Skill is a thin governed adapter. Product OS remains the methodology source of truth; the Skill supplies trigger selection, progressive source routing, deterministic command invocation, physical composition, validation, and handoff. It must not reproduce or reinterpret the full methodology inside `SKILL.md`.

The npm package contains four layers:

1. **Skill layer** — concise operating instructions and mode-specific references.
2. **Governance layer** — W1 capability/source contracts and W2 composition contracts.
3. **Runtime layer** — the exact approved rc.2 archive, verified by digest and extracted as the complete 503-source-file Product OS release.
4. **Execution layer** — installer, twelve canonical Product OS commands, and the Physical Composer.

## 2. Source precedence

For framework meaning, the bundled source entry point named in the coverage map is authoritative. The Skill reference is routing guidance, not a competing specification. Project-native records remain authoritative for project facts. Native Figma, GitHub, CI, test, cloud, and operational records remain authoritative for their own facts; Product OS stores identity, status, and trace links.

## 3. Operational modes

`INIT`, `RESUME`, `PROFILE`, `GOV009`, `ARTIFACT`, `COMPOSE`, `TRACE`, `IMPACT`, `GATE`, `HANDOFF`, `VALIDATE`, `DISTRIBUTE`, and `TOOL_MAPPING` are the formal Skill modes. Each must have at least one component source and Skill route. A request can use multiple modes, but each mode retains its own authority boundary.

## 4. Runtime integrity

The runtime build verifies the vendored archive SHA-256, release report, archive entry count, expected root, and path traversal safety before extraction. The generated runtime lock records every extracted file digest. Package generation must fail if this identity changes unexpectedly.

## 5. Progressive disclosure

`SKILL.md` contains only universal operating boundaries and route selection. Mode references carry concise working rules. The complete framework source is read only when the selected task needs it. W1 therefore provides full source coverage without loading 503 framework files into every agent context.

## 6. Completion invariant

No capability is called covered unless the exact source exists in the packaged runtime, its Skill route exists, every declared runtime command exists, and the human/agent authority boundary is explicit. The machine-readable coverage map and automated W1 tests enforce this invariant for all 17 release components.
