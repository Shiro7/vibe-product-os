# Artifacts, Traceability, and Evidence

Read this reference for artifact activation, operational content, traceability, change impact, sources, or evidence.

## Logical and physical separation

Product OS defines 281 stable logical artifact identities. P1/P2/P3 change physical packaging and assurance depth, not artifact semantics, ownership, status, authority, or evidence obligations.

A logical artifact may be represented as:

- an independent governed file;
- a named member of a composite package;
- a row in a canonical register;
- an exact native-tool object registered by identity;
- a generated view whose canonical owner is elsewhere;
- an authorized `NOT_APPLICABLE` record.

Do not create empty files merely to reach a catalog count.

## Operational artifact minimum

An activated artifact or composite member should expose:

- artifact ID, title, version, phase, owner, and status;
- exact scope and applicability;
- decisions, requirements, or questions it owns;
- source and evidence references;
- upstream dependencies and downstream consumers;
- validation and acceptance criteria;
- trace and change references;
- approval or authority state where required;
- handoff and reopen conditions.

## Information and evidence

Keep facts, assumptions, ideas, decisions, requirements, questions, and evidence distinct. A source supports a claim; an execution record shows an action; evidence shows what was observed or verified. Generated prose is not evidence of execution.

Preserve exact identity, version, location, retrieval or observation time, scope, integrity data when available, and the claim or control supported.

## Traceability

Maintain directed links across the critical chain:

```text
source / need / obligation
→ business requirement
→ product capability
→ system requirement
→ experience and design
→ architecture allocation
→ engineering work
→ implementation
→ verification evidence
→ release decision
→ operational observation and change
```

Report orphan, conflict, gap, stale, and broken-path findings. Do not infer `NO_IMPACT` from an empty traversal; accountable authority decides materiality after bounded analysis.

## NOT_APPLICABLE

Absence is not N/A. An authorized N/A record needs exact scope, reason, authority, evidence, downstream effect, review date or trigger, and reopen condition. Lack of time, knowledge, skill, budget, client request, or P1 selection is not a valid reason.
