# Vibe Product OS Alpha Status

| Item | State |
|---|---|
| Public identity | `Vibe Product OS` |
| npm / CLI / Skill / Plugin name | `vibe-product-os` |
| Package version | `0.1.0-alpha.0` |
| Embedded framework | Product OS `1.0.0` |
| Supported host | Codex first |
| npm publication | `NOT_AUTHORIZED` |
| GitHub source repository | `PRIVATE — Shiro7/vibe-product-os` |
| W1 capability/source coverage | `PASS — 17/17 COMPONENTS` |
| Physical Composer | `W2 PASS — 281/281 MAPPED; P1/P2/P3 GOLDEN FIXTURES` |
| Operational commands | `W3 PASS — STATUS / UPDATE / VERIFY-RELEASE` |
| Existing Product OS commands | Bundled through the governed runtime adapter |
| License | `UNLICENSED`, internal only |

## Alpha acceptance boundary

The setup is complete when the package can:

1. validate and install the Skill into a repository or user `.agents/skills` directory;
2. preserve existing installations unless `--force` is explicit;
3. preview all installation writes with `--dry-run`;
4. report package, framework, and distribution identities;
5. execute the existing Product OS runtime against bundled schemas;
6. produce validated Skill and Plugin ZIPs;
7. pass tests and a package-content audit;
8. compose P1/P2/P3 project artifacts through dry-run/apply with schema, authority, applicability, path, conflict, and rollback safeguards;
9. continue to refuse public-distribution and production-proven claims until their separate authority conditions close.
10. report current project state without mutation, update same-release catalogs and lock through governed backup/rollback, and verify exact local release bytes without claiming publisher or release authority.
