---
decision_id: AUTH-DEC-004
status: APPROVED
authority: M.M.Eyada
decision_scope: vpos-official-short-name-and-public-website
approved_at: 2026-08-25
supersedes: null
---

# VPOS Official Short Name and Website Decision

## Decision

The Product OS Authority approves `VPOS` as the official short name for
`Vibe Product OS`.

This decision also approves the design and repository preparation of the public
package website at `https://shiro7.github.io/vibe-product-os/`.

## Binding identity rules

- The public product name remains `Vibe Product OS`.
- The official short name is `VPOS`.
- The npm package and Skill identity remain `vibe-product-os`.
- The published CLI names remain `vpo` and `vibe-product-os`.
- This decision does not claim or publish a new `vpos` executable alias.
- The short name must not create a second methodology, package, Skill, runtime,
  authority model, or repository identity.

## Website boundary

The website may explain installation, profiles, supported agents, lifecycle,
governance, traceability, evidence, and public-pilot use. It must preserve the
current claim boundary: the package is available for use, testing, and feedback,
but is not yet production-proven or validated at scale while `AUTH-COND-002`
remains open.

Preparing code and deployment configuration is approved. Activating or changing
the public GitHub Pages channel must produce observable deployment evidence.

## Release boundary

This decision does not authorize a new npm version, move an npm dist-tag, or
replace the exact release authority already consumed by `AUTH-DEC-003`. Any
future npm publication requires its own version-specific decision, exact build,
signatures, verification, and publication evidence.
