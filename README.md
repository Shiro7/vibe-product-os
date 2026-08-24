# Vibe Product OS

Vibe Product OS is the Codex-first Skill, plugin, installer, and runtime adapter for the approved Product OS 1.0.0 framework.

## Current status

This repository is an **internal alpha setup**. It is not published to npm and is not authorized for external distribution. Product OS remains `ACTIVE_WITH_CONDITIONS`; digital-signature condition `AUTH-COND-001` blocks public distribution, and real-project Pilot condition `AUTH-COND-002` blocks production-proven or scaled-adoption claims.

The alpha deliberately separates:

- **Product OS 1.0.0:** canonical methodology, governance, contracts, schemas, and authority.
- **Vibe Product OS 0.1.0-alpha.0:** installable Skill and runtime distribution layer.
- **Project instance:** project-specific facts, decisions, artifacts, evidence, and tool identities.

## Local setup

```bash
npm test
npm run test:runtime
npm run dist
npm run audit
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

- `dist/vibe-product-os-skill-0.1.0-alpha.0.zip`
- `dist/vibe-product-os-codex-plugin-0.1.0-alpha.0.zip`
- `dist/release-build-report.json`
- after `npm run pack:alpha`: `dist/vibe-product-os-0.1.0-alpha.0.tgz`, `dist/npm-pack-report.json`, and `dist/release-verification-manifest.json`

No public `npm publish` action is part of the alpha setup. The manifest can pass byte verification while signatures and both Authority conditions remain open; that is expected and does not authorize distribution.
