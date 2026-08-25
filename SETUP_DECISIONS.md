# Setup Decisions

| Decision | State | Current value | Release effect |
|---|---|---|---|
| Public product identity | DECIDED | Vibe Product OS; official short name `VPOS` | Binding under `AUTH-DEC-004` |
| npm / CLI / Skill / Plugin name | DECIDED | `vibe-product-os` | Recheck npm immediately before publication |
| Version model | PUBLISHED_CURRENT_PILOT | Package `0.1.0-pilot.2`; framework `1.0.0` | Pilot.0 and pilot.1 remain immutable historical publications |
| Skill host targets | CANDIDATE_VERIFIED | Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, Windsurf, OpenCode, Cline, Zed, custom roots | Directory contracts tested; host-runtime behavior remains pilot feedback scope |
| Pilot license | APPROVED | `Apache-2.0`; `AUTH-DEC-001` | License blocker closed |
| GitHub repository | ACTIVE_PUBLIC_VERIFIED | [`Shiro7/vibe-product-os`](https://github.com/Shiro7/vibe-product-os) | Public source use and testing approved by `AUTH-DEC-002` |
| Public support | ACTIVE_VERIFIED | [GitHub Issues](https://github.com/Shiro7/vibe-product-os/issues) | Five-business-day best-effort initial response target |
| Confidential security reporting | ACTIVE_VERIFIED | [GitHub private vulnerability reporting](https://github.com/Shiro7/vibe-product-os/security/advisories/new) | Private advisory form verified |
| GitHub Pages | ACTIVE_VERIFIED | [`shiro7.github.io/vibe-product-os/`](https://shiro7.github.io/vibe-product-os/) | `AUTH-DEC-004`; workflow and public byte-identity evidence recorded |
| Real-project Pilot | DEFERRED_AFTER_UPLOAD | Ahd selected as P2; execution deferred until after source upload | Blocks `AUTH-COND-002` closure until executed and accepted |
| Framework digital signature | CLOSED | `AUTH-COND-001`; key `EAB95C319319813D` | Does not sign new package bytes automatically |
| Key continuity | CLOSED | `AUTH-COND-004`; two offline copies and 2/2 recovery tests | Ongoing custody controls apply |
| Public pilot use and feedback | APPROVED_ACTIVE | `AUTH-DEC-002`; use/test now, feedback through GitHub Issues | Does not create production-proven claims |
| Pilot.1 Authority decision | APPROVED_EXECUTED | `AUTH-DEC-003` for exact `0.1.0-pilot.1` scope | Exact signed publication verified |
| Pilot.2 Authority decision | APPROVED_EXECUTED | `AUTH-DEC-005` for exact `0.1.0-pilot.2` website and npm homepage scope | Exact signed publication and public verification recorded |
| Package signatures | VERIFIED_FOR_PILOT_2 | Six exact pilot.2 subjects plus signed manifest verified against the pinned Authority key | Applies only to the published pilot.2 bytes |
| Channel order | EXECUTED_FOR_PILOT_2 | GitHub review and Pages first; npm `public` with `pilot`, then `latest` moved through web authentication | Both tags resolve to pilot.2 |
| W1 capability/source coverage | VERIFIED_WORKING_BASELINE | 17/17 release components and 12/12 modes | Required package invariant |
| Physical Composer | VERIFIED_WORKING_BASELINE | 281-row map; P1/P2/P3 dry-run/apply; golden fixtures | Pilot must validate real-project use |
| Operational commands | VERIFIED_WORKING_BASELINE | W3 `status`, `update`, `verify-release`; 20 focused tests | Pilot exercises project commands; signing remains an Authority action |

`AUTH-DEC-001` closes the license decision and approves the support/security channel policy. Public repository, support, and confidential security-reporting activation are verified in `PUBLIC_CHANNEL_ACTIVATION_EVIDENCE_2026-08-25.json`. `AUTH-DEC-002` and `AUTH-DEC-003` remain immutable approvals for published `0.1.0-pilot.0` and `0.1.0-pilot.1`. `AUTH-DEC-005` was executed for the exact `0.1.0-pilot.2` release after detached-signature, Pages, registry, dist-tag, and clean-public-install verification. The additive record is `governance/authority/NPM_PUBLICATION_EVIDENCE_0.1.0-pilot.2_2026-08-25.json`. `AUTH-COND-002` remains open and continues to limit production-proven and scaled-adoption claims.
