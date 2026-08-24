# Vibe Product OS

Vibe Product OS is the Codex-first Skill, plugin, installer, and runtime adapter for the approved Product OS 1.0.0 framework.

## Current status

This repository is a **prepublication pilot candidate**. Product OS framework signing and continuity conditions `AUTH-COND-001` and `AUTH-COND-004` are closed. `AUTH-DEC-001` approved Apache-2.0 plus public GitHub support and confidential vulnerability-reporting channels; the repository and both channels are now active and verified. The exact package candidate is not yet authorized for npm distribution: its own release subjects still require signatures and clean verification, and the Authority must approve the exact release and channel. `AUTH-COND-002` continues to block production-proven and scaled-adoption claims until the Ahd P2 Pilot closes.

The candidate deliberately separates:

- **Product OS 1.0.0:** canonical methodology, governance, contracts, schemas, and authority.
- **Vibe Product OS 0.1.0-pilot.0:** Apache-2.0-licensed installable Skill and runtime distribution layer.
- **Project instance:** project-specific facts, decisions, artifacts, evidence, and tool identities.

## Local setup

```bash
npm test
npm run test:runtime
npm run dist
npm run audit
npm run candidate
```

Preview a repository-local Codex Skill installation:

```bash
node bin/vibe-product-os.js install . --scope project --yes --dry-run
```

Install it after reviewing the exact destination:

```bash
node bin/vibe-product-os.js install . --scope project --yes
```

Codex loads repository and user Skills from `.agents/skills`; see the official [OpenAI build-skills documentation](https://developers.openai.com/codex/skills).

Inspect the package and framework identity:

```bash
node bin/vibe-product-os.js version --json
node bin/vibe-product-os.js setup-doctor --json
```

Run an existing Product OS command through the adapter:

```bash
node bin/vibe-product-os.js init \
  --project /absolute/project/path \
  --project-id EXAMPLE-PRODUCT \
  --project-name "Example Product" \
  --profile P2
```

`init` remains dry-run unless `--apply` is supplied and creates only the governed control plane. After initialization, preview the profile-aware physical plan:

```bash
node bin/vibe-product-os.js compose \
  --project /absolute/project/path \
  --phase active \
  --dry-run
```

Repeat with `--apply` only after reviewing the exact artifact, package, path, blocker, conflict, and validation output. The composer preserves all 281 logical IDs, implements P1 composite / P2 modular / P3 independent treatment, leaves conditional and derived content absent until governed activation, validates control updates, and refuses overwrites.

Inspect an initialized project, preview a same-release framework update, or verify release bytes:

```bash
node bin/vibe-product-os.js status --project /absolute/project/path --strict --json
node bin/vibe-product-os.js update --project /absolute/project/path --dry-run --json
node bin/vibe-product-os.js verify-release --manifest /absolute/release-verification-manifest.json --json
```

An update apply requires `--authority-ref`, `--change-ref`, and `--apply`; it creates a verified rollback backup and does not approve itself. Release verification separates SHA-256 byte identity, detached Minisign publisher identity, and human release authority.

## Package outputs

`npm run dist` produces:

- `dist/vibe-product-os-skill-0.1.0-pilot.0.zip`
- `dist/vibe-product-os-codex-plugin-0.1.0-pilot.0.zip`
- `dist/release-build-report.json`
- after `npm run pack:pilot`: `dist/vibe-product-os-0.1.0-pilot.0.tgz`, `dist/npm-pack-report.json`, `dist/vibe-product-os-0.1.0-pilot.0.spdx.json`, `dist/SHA256SUMS`, and `dist/release-verification-manifest.json`
- after `npm run verify:candidate`: `dist/clean-recipient-verification.json`

No `npm publish` or GitHub Release action is part of candidate construction. Byte verification is expected to pass before signing; publisher identity remains pending until the Authority signs every exact subject and the manifest. `AUTH-DEC-001` closes the license decision, and the approved support/security locators are active. Publication still requires exact package signatures and an exact-release Authority decision.
