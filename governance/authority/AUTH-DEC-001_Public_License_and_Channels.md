---
record_type: AUTHORITY_DECISION
decision_id: AUTH-DEC-001
decision_status: APPROVED
decision_scope: vibe-product-os-0.1.0-pilot.0-license-support-security
authority_actor: M.M.Eyada
authority_ref: USER-DIRECTIVE-2026-08-25-ADOPT
decided_at: 2026-08-25T01:26:01+08:00
supersedes: PREPUBLICATION-UNLICENSED-PLACEHOLDER
---

# Public License and Channel Decision

## Decision

The Product OS Authority approves the following policy for Vibe Product OS:

- license the package and embedded Product OS distribution under Apache
  License 2.0 (`Apache-2.0`);
- publish general support through
  `https://github.com/Shiro7/vibe-product-os/issues`;
- receive confidential security reports through GitHub private vulnerability
  reporting at
  `https://github.com/Shiro7/vibe-product-os/security/advisories/new`;
- operate support on a best-effort pilot basis, with a five-business-day
  initial support target, three-business-day security acknowledgment target,
  and seven-business-day initial security triage target;
- allow public GitHub repository visibility after a complete tracked-history
  secret and restricted-material review.

## Authority boundary

Apache-2.0 grants the permissions stated in the license. It does not delegate
Product OS Authority, signing custody, gate approval, official release naming,
or the right to represent a derivative as an official Authority-signed build.

This decision approves the license and channel policy. It does not merge the
draft pull request, sign package subjects, publish an npm version, create a
GitHub Release, close `AUTH-COND-002`, or authorize production-proven claims.
Those actions keep their existing evidence and approval boundaries.

## Activation evidence required

- the repository is public and GitHub Issues are reachable without private
  repository access;
- GitHub private vulnerability reporting is enabled and its locator is
  reachable;
- the package contains `LICENSE`, `NOTICE`, `SUPPORT.md`, and `SECURITY.md`;
- the exact changed package bytes pass the full build, audit, clean-recipient,
  and signing workflow before npm publication.

## Reopen triggers

Reopen this decision if ownership changes, a different license is proposed,
support or security locators change, the repository becomes private, or a
commercial support SLA is introduced.
