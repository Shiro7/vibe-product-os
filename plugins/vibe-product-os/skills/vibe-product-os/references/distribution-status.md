# Distribution Status

Read this reference for npm, plugins, ZIPs, signatures, release claims, or package updates.

## Current identity

| Item | Value |
|---|---|
| Public product identity | Vibe Product OS |
| npm / CLI / Skill / Plugin | `vibe-product-os` |
| Package version | `0.1.0-alpha.0` |
| Embedded framework | Product OS `1.0.0` |
| Source release | `Product-OS-v1.0-rc.2` |
| Package status | Internal alpha |
| W1 source coverage | 17/17 release components verified |
| Physical Composer | W2 verified working baseline; 281/281 mapped |
| Operational commands | W3 verified working baseline: `status`, `update`, `verify-release` |

## Binding restrictions

- `AUTH-COND-001`: external or public distribution is blocked until the Authority-controlled digital signature and key-custody evidence passes.
- `AUTH-COND-002`: production-proven or scaled-adoption claims are blocked until the real-project P2-or-higher Pilot closes.
- Private signing keys may never be handled by AI, stored in Git, bundled into an archive, or uploaded to npm.
- SHA-256 proves byte identity, not publisher identity.

The local alpha build writes `dist/release-verification-manifest.json` for the Skill ZIP, Plugin ZIP, and npm tarball. Run `vibe-product-os verify-release --manifest <path>` for byte identity and add `--require-signatures` only after the Authority has signed every exact subject. The command verifies signatures but never handles the private key or authorizes publication.

Do not run `npm publish`, create a public release, upload public ZIPs, or change `private: true` unless the user explicitly requests that release action and the blocking evidence is verified current.

## Planned release line

```text
0.1.0-alpha.0  local/internal only
0.1.0-pilot.0  npm tag pilot after Pilot and signing closure
1.0.0-rc.1     npm tag next after package audits
1.0.0          npm tag latest after Authority GA decision
```

Every release must build the npm tarball, Skill ZIP, Plugin ZIP, checksums, signatures, SBOM, and build report from one immutable source revision, then verify the exact public bytes from a clean recipient location.
