# Setup Decisions

| Decision | State | Current value | Release effect |
|---|---|---|---|
| Public product identity | DECIDED | Vibe Product OS | Binding |
| npm / CLI / Skill / Plugin name | DECIDED | `vibe-product-os` | Recheck npm immediately before publication |
| Version model | DECIDED | Package `0.1.0-pilot.0`; framework `1.0.0` | Tracked separately |
| First supported host | PROVISIONAL_FOR_PILOT | Codex | Other hosts deferred until explicitly approved and tested |
| Pilot license | APPROVED | `Apache-2.0`; `AUTH-DEC-001` | License blocker closed; exact release approval still required |
| GitHub repository | ACTIVE_PUBLIC_VERIFIED | [`Shiro7/vibe-product-os`](https://github.com/Shiro7/vibe-product-os) | Activated after tracked-history review; does not authorize npm |
| Public support | ACTIVE_VERIFIED | [GitHub Issues](https://github.com/Shiro7/vibe-product-os/issues) | Five-business-day best-effort initial response target |
| Confidential security reporting | ACTIVE_VERIFIED | [GitHub private vulnerability reporting](https://github.com/Shiro7/vibe-product-os/security/advisories/new) | Private advisory form verified |
| GitHub Pages | PLANNED_NOT_CREATED | `shiro7.github.io/vibe-product-os/` | No external mutation performed |
| Real-project Pilot | DEFERRED_AFTER_UPLOAD | Ahd selected as P2; execution deferred until after source upload | Blocks `AUTH-COND-002` closure until executed and accepted |
| Framework digital signature | CLOSED | `AUTH-COND-001`; key `EAB95C319319813D` | Does not sign new package bytes automatically |
| Key continuity | CLOSED | `AUTH-COND-004`; two offline copies and 2/2 recovery tests | Ongoing custody controls apply |
| Package signatures | PENDING_BUILD | Sign every exact pilot release subject and manifest | Blocks package publisher identity |
| Channel order | AUTHORITY_DIRECTED | GitHub first, then npm | Preparation allowed; publication requires exact-channel decision |
| W1 capability/source coverage | VERIFIED_WORKING_BASELINE | 17/17 release components and 12/12 modes | Required package invariant |
| Physical Composer | VERIFIED_WORKING_BASELINE | 281-row map; P1/P2/P3 dry-run/apply; golden fixtures | Pilot must validate real-project use |
| Operational commands | VERIFIED_WORKING_BASELINE | W3 `status`, `update`, `verify-release`; 20 focused tests | Pilot exercises project commands; signing remains an Authority action |

`AUTH-DEC-001` closes the license decision and approves the support/security channel policy. Public repository, support, and confidential security-reporting activation are verified in `PUBLIC_CHANNEL_ACTIVATION_EVIDENCE_2026-08-25.json`. Exact package signatures and a separate exact-channel release decision remain required before npm publication.
