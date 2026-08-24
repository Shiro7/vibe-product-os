# Setup Decisions

| Decision | State | Current value | Release effect |
|---|---|---|---|
| Public product identity | DECIDED | Vibe Product OS | Binding |
| npm / CLI / Skill / Plugin name | DECIDED | `vibe-product-os` | Recheck npm immediately before publication |
| Version model | DECIDED | Package `0.1.0-alpha.0`; framework `1.0.0` | Tracked separately |
| First supported host | PROVISIONAL_FOR_ALPHA | Codex | Other hosts deferred until explicitly approved and tested |
| Alpha license | PROVISIONAL_FOR_ALPHA | `UNLICENSED`, internal-only, all rights reserved | Public publication blocked pending final license |
| GitHub repository | ACTIVE_PRIVATE | [`Shiro7/vibe-product-os`](https://github.com/Shiro7/vibe-product-os) | Internal source control only; public distribution remains blocked |
| GitHub Pages | PLANNED_NOT_CREATED | `shiro7.github.io/vibe-product-os/` | No external mutation performed |
| Real-project Pilot | DEFERRED_AFTER_UPLOAD | Ahd selected as P2; execution deferred until after source upload | Blocks `AUTH-COND-002` closure until executed and accepted |
| Digital signature | OPEN | Authority-controlled Minisign procedure | Blocks `AUTH-COND-001` and public distribution |
| W1 capability/source coverage | VERIFIED_WORKING_BASELINE | 17/17 release components and 12/12 modes | Required package invariant |
| Physical Composer | VERIFIED_WORKING_BASELINE | 281-row map; P1/P2/P3 dry-run/apply; golden fixtures | Pilot must validate real-project use |
| Operational commands | VERIFIED_WORKING_BASELINE | W3 `status`, `update`, `verify-release`; 18 focused tests | Pilot exercises project commands; signing remains an Authority action |

Provisional alpha decisions allow local engineering and verification only. They do not substitute for the Authority decisions required before public release.
