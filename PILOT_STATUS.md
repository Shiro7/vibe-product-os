# Vibe Product OS Pilot Release Status

| Item | State |
|---|---|
| Public identity | `Vibe Product OS`; official short name `VPOS` |
| npm / CLI / Skill / Plugin name | `vibe-product-os` |
| Package version | `0.1.0-pilot.2` published and verified |
| Embedded framework | Product OS `1.0.0` from immutable `rc.2` |
| Supported hosts | Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, Windsurf, OpenCode, Cline, and Zed |
| Package publication | `pilot.2 PUBLISHED — SIGNATURES, REGISTRY, TAGS, AND CLEAN INSTALL VERIFIED` |
| GitHub source repository | `PUBLIC ACTIVE — HISTORY REVIEW COMPLETE` |
| Public pilot use and testing | `pilot.2 ACTIVE`; feedback open |
| Public feedback | `GitHub Issues — OPEN` |
| Framework signature | `AUTH-COND-001 CLOSED` |
| Key continuity | `AUTH-COND-004 CLOSED` |
| Real-project Pilot | `AUTH-COND-002 OPEN — Ahd P2 after upload` |
| W1 capability/source coverage | `PASS — 17/17 COMPONENTS` |
| Physical Composer | `W2 PASS — 281/281 MAPPED; P1/P2/P3 GOLDEN FIXTURES` |
| Operational commands | `W3 PASS — STATUS / UPDATE / VERIFY-RELEASE` |
| License | `Apache-2.0 — AUTH-DEC-001 APPROVED` |
| npm channel | `public / pilot + latest — AUTH-DEC-005 APPROVED FOR pilot.2` |
| Public support | `GitHub Issues — ACTIVE VERIFIED` |
| Confidential security reporting | `GitHub private vulnerability reporting — ACTIVE VERIFIED` |

## Current pilot boundary

The current public source pilot and `0.1.0-pilot.2` npm package may be used,
tested, and reviewed now. Both npm dist-tags `pilot` and `latest` resolve to
the exact approved release. The npm primary page renders the current operating
guide and its homepage opens the public VPOS website.

`0.1.0-pilot.2` was built from clean commit
`54545402ebfc72e799d88162d45b0942ebd0183e`, its six exact release subjects and
manifest were signed and verified against the pinned Product OS Authority key,
and a clean install from the public `latest` tag passed package identity,
setup-doctor, README, and zero-vulnerability npm audit checks. Its additive
evidence is recorded in
`governance/authority/NPM_PUBLICATION_EVIDENCE_0.1.0-pilot.2_2026-08-25.json`.

`0.1.0-pilot.1` was published under the `pilot` tag
after its six exact release subjects and release manifest were signed and
verified against the pinned Product OS Authority key. A clean install from the
public registry passed package identity, setup-doctor, zero-vulnerability npm
audit, and nine-agent managed-link installation checks. Its additive evidence
is recorded in
`governance/authority/NPM_PUBLICATION_EVIDENCE_0.1.0-pilot.1_2026-08-25.json`.

The historical `0.1.0-pilot.0` publication remains immutable and is recorded in
`governance/authority/NPM_PUBLICATION_EVIDENCE_2026-08-25.json`. The `pilot`
and `latest` dist-tags now both resolve to `0.1.0-pilot.2` under `AUTH-DEC-005`.

Repository visibility and both approved channels are active and recorded in
`governance/authority/PUBLIC_CHANNEL_ACTIVATION_EVIDENCE_2026-08-25.json`.
The bounded pilot-use, feedback, and npm-channel decision is recorded in
`governance/authority/AUTH-DEC-002_Public_Pilot_Use_Test_Feedback_and_NPM.md`.
The next-release decision is recorded in
`governance/authority/AUTH-DEC-005_VPOS_Website_and_NPM_Homepage_Pilot_2.md`.

`AUTH-COND-002` does not prevent a bounded pilot distribution. It continues to
prohibit production-proven, certification, compliance, universal-fitness, and
scaled-adoption claims until the governed Ahd P2 Pilot closes.
