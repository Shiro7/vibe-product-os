# Skill Authority Boundary — W1

## Allowed agent operations

- Resolve the exact project, profile, phase, framework, source, and artifact identities.
- Read and route to canonical Product OS sources.
- Prepare questions, options, draft decisions, artifacts, evidence registrations, trace links, impact candidates, gate packets, and handoffs.
- Run deterministic validation, linting, graph, impact, doctor, and dry-run operations.
- Apply authorized repository mutations only with explicit `--apply` or equivalent consent and after a complete preflight.
- Report observable results, uncertainty, gaps, failures, and required human decisions.

## Reserved human authority

The Product OS Authority alone may approve or reject gates and baselines, accept or waive risk, approve applicability or `NOT_APPLICABLE`, declare compliance, accept `NO_IMPACT`, authorize a release or external distribution, approve a production-readiness claim, or change the Product Constitution and delegated authority model.

## Fail-closed behavior

When authority, scope, identity, source precedence, applicability, or mutation target is unresolved, the Skill may continue read-only diagnosis and prepare a decision packet. It must not convert missing authority into an assumed approval. Automation results are evidence for a decision, never the decision itself.

## Distribution conditions

Framework conditions `AUTH-COND-001` and `AUTH-COND-004` are closed by additive Authority evidence. New Skill, Plugin, npm, and GitHub release bytes require their own signatures and an exact-channel Authority decision. `AUTH-DEC-002` supplies that decision only for published `vibe-product-os@0.1.0-pilot.0`; `AUTH-DEC-003` approves only `0.1.0-pilot.1` on npm `pilot` after exact signature verification. `AUTH-COND-002` blocks claims that the framework or Skill is production-proven until a real-project pilot supplies accepted evidence. W1 and W2 technical completion do not authorize distribution or close that claim boundary.
