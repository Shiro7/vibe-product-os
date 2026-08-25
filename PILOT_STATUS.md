# Vibe Product OS Pilot Release Status

| Item | State |
|---|---|
| Public identity | `Vibe Product OS`; official short name `VPOS` |
| npm / CLI / Skill / Plugin name | `vibe-product-os` |
| Package version | `0.1.0-pilot.1` published; `0.1.0-pilot.2` approved candidate |
| Embedded framework | Product OS `1.0.0` from immutable `rc.2` |
| Supported hosts | Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, Windsurf, OpenCode, Cline, and Zed |
| Package publication | `pilot.1 PUBLISHED`; `pilot.2 APPROVED — SIGNATURES PENDING` |
| GitHub source repository | `PUBLIC ACTIVE — HISTORY REVIEW COMPLETE` |
| Public pilot use and testing | `pilot.1 ACTIVE`; `pilot.2` will replace both `pilot` and `latest` after verification |
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

The current public source pilot and `0.1.0-pilot.1` npm package may be used,
tested, and reviewed now. `0.1.0-pilot.2` is the approved next candidate for
the VPOS website deployment and npm homepage locator. It may replace the
`pilot` and `latest` tags only after exact build, signature, and clean-recipient verification.

`0.1.0-pilot.1` was published under the `pilot` tag
after its six exact release subjects and release manifest were signed and
verified against the pinned Product OS Authority key. A clean install from the
public registry passed package identity, setup-doctor, zero-vulnerability npm
audit, and nine-agent managed-link installation checks. Its additive evidence
is recorded in
`governance/authority/NPM_PUBLICATION_EVIDENCE_0.1.0-pilot.1_2026-08-25.json`.

The historical `0.1.0-pilot.0` publication remains immutable and is recorded in
`governance/authority/NPM_PUBLICATION_EVIDENCE_2026-08-25.json`. The `pilot`
dist-tag now resolves to `0.1.0-pilot.1`; `latest` remains at
`0.1.0-pilot.0` and was not moved by `AUTH-DEC-003`.

Repository visibility and both approved channels are active and recorded in
`governance/authority/PUBLIC_CHANNEL_ACTIVATION_EVIDENCE_2026-08-25.json`.
The bounded pilot-use, feedback, and npm-channel decision is recorded in
`governance/authority/AUTH-DEC-002_Public_Pilot_Use_Test_Feedback_and_NPM.md`.
The next-release decision is recorded in
`governance/authority/AUTH-DEC-005_VPOS_Website_and_NPM_Homepage_Pilot_2.md`.

`AUTH-COND-002` does not prevent a bounded pilot distribution. It continues to
prohibit production-proven, certification, compliance, universal-fitness, and
scaled-adoption claims until the governed Ahd P2 Pilot closes.
