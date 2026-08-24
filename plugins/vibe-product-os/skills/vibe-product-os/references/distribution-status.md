# Distribution Status

Read this reference for npm, plugins, ZIPs, signatures, release claims, or package updates.

## Current identity

| Item | Value |
|---|---|
| Public product identity | Vibe Product OS |
| npm / CLI / Skill / Plugin | `vibe-product-os` |
| Package version | `0.1.0-pilot.1` release candidate |
| Embedded framework | Product OS `1.0.0` |
| Source release | `Product-OS-v1.0-rc.2` |
| Package status | Pilot.1 proposed; pilot.0 remains published and install-verified |
| License | Apache-2.0 approved by `AUTH-DEC-001` |
| W1 source coverage | 17/17 release components verified |
| Physical Composer | W2 verified working baseline; 281/281 mapped |
| Operational commands | W3 verified working baseline: `status`, `update`, `verify-release` |

## Binding restrictions

- `AUTH-COND-001` is closed for the Product OS framework Authority package; `AUTH-COND-004` is closed with two verified offline recovery copies.
- `AUTH-COND-002`: production-proven or scaled-adoption claims are blocked until the real-project P2-or-higher Pilot closes.
- New package bytes require their own detached signatures and clean-recipient verification; framework signatures never transfer publisher identity to a later package automatically.
- `0.1.0-pilot.0` was published after exact signatures, clean-recipient verification, and `AUTH-DEC-002`.
- `0.1.0-pilot.1` adds the multi-agent installer and expanded operating guide. `AUTH-DEC-003` is proposed and must be explicitly approved before those bytes can be signed or published.
- Private signing keys may never be handled by AI, stored in Git, bundled into an archive, or uploaded to npm.
- SHA-256 proves byte identity, not publisher identity.

The pilot build writes `dist/release-verification-manifest.json` for the Skill ZIP, Plugin ZIP, npm tarball, SBOM, build report, and checksums. Run `vibe-product-os verify-release --manifest <path>` for byte identity and add `--require-signatures` only after the Authority has signed every exact subject and the manifest. The command verifies signatures but never handles the private key or authorizes publication.

The package metadata is publish-capable under Apache-2.0 with the npm `pilot` tag. Do not run `npm publish`, create a GitHub Release, or upload public ZIPs for a later build unless the user explicitly requests that exact release action and the required evidence is verified current.

## Planned release line

```text
0.1.0-alpha.0  historical local/internal setup
0.1.0-pilot.0  bounded pilot distribution after exact signatures and channel approval
0.1.0-pilot.1  multi-agent installer candidate pending AUTH-DEC-003 and signatures
1.0.0-rc.1     npm tag next after package audits
1.0.0          npm tag latest after Authority GA decision
```

Every release must build the npm tarball, Skill ZIP, Plugin ZIP, checksums, signatures, SBOM, and build report from one immutable source revision, then verify the exact public bytes from a clean recipient location.
