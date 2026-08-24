# Profiles, Gates, and Authority

Read this reference for profile selection, domain overrides, governance, applicability, or gate preparation.

## Delivery profiles

| Profile | Intended treatment |
|---|---|
| `P1 Lean` | Composite artifacts and bounded evidence for low-risk, reversible scope; no waiver of identity, obligations, evidence, verification, or authority |
| `P2 Standard` | Default for serious production work; separate artifacts when ownership, approval, reuse, lifecycle, or evidence benefits from independent control |
| `P3 Comprehensive` | Detailed artifacts, specialist review, stronger independence, formal evidence, exercises, retention, and lifecycle governance for complex or high-risk scope |

Do not select P1 because a team is small, the schedule is short, or the user wants fewer files. Missing evidence cannot lower risk. Apply P3 to affected domains when mandatory high-assurance triggers exist; the whole project need not become P3 unless the trigger is systemic.

## Governance sequence

```text
GOV-001 Product Constitution
GOV-002 Artifact Register
GOV-003 Decision Log
GOV-004 Risk Register
GOV-005 Assumption Register
GOV-006 Open Question Register
GOV-007 Change Register
GOV-008 Traceability Graph
GOV-009 Standards & Compliance Applicability Matrix
```

`GOV-001` governs non-negotiables. `GOV-002` governs artifact identity and lifecycle. `GOV-009` activates project-specific standards and profiles, explains why, propagates obligations to downstream phases, and defines reopen triggers. Phases update one canonical register by reference; they do not create competing copies.

## Gates

Automation may prepare and validate a gate decision packet. It may not decide the gate.

Before presenting a gate to authority, identify:

- the exact gate and accountable authority;
- required entry and exit criteria;
- baselined input versions and trace coverage;
- unresolved risks, assumptions, questions, conflicts, and standards obligations;
- verification and evidence identities;
- exceptions, accepted-risk proposals, and downstream conditions;
- decision options and the effect of each option.

Keep the gate outcome `PENDING_AUTHORITY` until the accountable human records the decision.

## Authority boundary

AI and automation can recommend, prepare, validate, and report. They cannot approve gates, accept risk, approve N/A, declare compliance, authorize public distribution, or certify project outcomes. Record the human actor, scope, authority reference, decision, time, and evidence for every consequential approval.
