# Security Policy

## Supported versions

Only the latest version published under the npm `pilot` tag receives security
updates during the `0.1.x-pilot` line. No version is production-proven while
`AUTH-COND-002` remains open.

## Report a vulnerability privately

Use [GitHub private vulnerability reporting](https://github.com/Shiro7/vibe-product-os/security/advisories/new).
Do not disclose suspected vulnerabilities in public issues, discussions, pull
requests, or social channels.

Include the affected version, impact, attack preconditions, reproduction or
proof-of-concept details, and any suggested remediation. Do not submit real
credentials, private signing keys, regulated data, or confidential project
evidence; use synthetic examples.

## Response targets

- Receipt acknowledgment: three business days.
- Initial triage: seven business days.
- Remediation and disclosure timing: risk-based and coordinated with the
  reporter; these targets are not a paid SLA during the pilot.

Checksums establish byte identity only. Product OS framework publisher
identity and key continuity are verified under `AUTH-COND-001` and
`AUTH-COND-004`; every package release still requires detached signatures for
its own exact bytes. Private signing keys must never enter Git, npm, release
archives, issues, or vulnerability reports.
