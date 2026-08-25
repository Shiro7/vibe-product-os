# VPOS | Vibe Product OS

VPOS is the official short name for Vibe Product OS. It gives a product team and its AI agents one governed way to move from an initial idea to discovery, requirements, design, architecture, implementation, release, and ongoing operations.

[Visit the VPOS website](https://shiro7.github.io/vibe-product-os/) for the shortest installation-to-use path, or start immediately:

```bash
npx vibe-product-os@pilot install
```

Then ask your agent:

> Use `$vibe-product-os` for this project. Recommend P1, P2, or P3 and ask only for the next blocking decision.

This README is an operating guide: how to install the same Product OS capability for the agents you use, how people and agents collaborate, which commands to run, what each step expects, and what should exist when the step is complete.

> **Public pilot:** the `pilot` channel is open for use, project testing, and feedback. It is not a claim of production-proven, certified, compliant, or universally suitable behavior. Keep accountable human review in every authority-bearing decision.

## What you get

After installation and project initialization, the team gets:

- one canonical project identity and Product OS framework lock;
- a selected execution profile: `P1 Lean`, `P2 Standard`, or `P3 Comprehensive`;
- a governed artifact register rather than an uncontrolled folder of empty templates;
- separate phase outputs across Phases `00-11`;
- traceability between decisions, requirements, design, architecture, implementation, tests, releases, and operations;
- explicit standards applicability through `GOV-009`;
- dry-run-first automation for initialization, composition, updates, migrations, and archives;
- structural checks for gates, baselines, evidence, and handoffs without allowing an agent to approve itself;
- the same Skill instructions available to multiple supported agents.

Vibe Product OS does not replace your product owner, architects, engineers, designers, reviewers, or Product OS Authority. It makes their work explicit, connected, reviewable, and repeatable.

## Prerequisites

- Node.js 18 or newer.
- An exact project directory you are authorized to read and modify.
- At least one supported AI agent.
- A human who can make project-scope, applicability, risk, baseline, gate, and release decisions.
- Git is strongly recommended so project changes and handoffs can be reviewed.

No global npm installation is required for the guided setup.

`VPOS` is the product short name, not a replacement npm or Skill identity. The published `vpo` and `vibe-product-os` CLI names remain supported.

## Recommended installation: guided `npx` setup

Run the installer from the project that will use Product OS:

```bash
cd /absolute/path/to/your-project
npx vibe-product-os@pilot install
```

The wizard will:

1. confirm whether the Skill is for this project or the current user;
2. detect likely installed agents without changing them;
3. let you select any combination of popular and additional agents;
4. choose a shared or agent-native directory layout;
5. choose independent copies or links to one managed local store;
6. show every exact destination, existing conflict, and shared-path deduplication;
7. ask for confirmation before writing anything;
8. preserve existing Skill directories unless replacement is explicitly approved;
9. write an installation receipt containing the package and framework identity;
10. print the verification action for every selected agent.

The wizard currently supports:

- OpenAI Codex
- Claude Code
- Gemini CLI
- GitHub Copilot
- Cursor
- Windsurf
- OpenCode
- Cline
- Zed
- one or more custom Skill directories

### Preview first

For a machine-readable preview that writes nothing:

```bash
npx vibe-product-os@pilot install . \
  --scope project \
  --agents codex,claude,gemini,copilot,cursor,windsurf \
  --strategy shared \
  --method copy \
  --dry-run \
  --json
```

Review these fields before applying:

- `project`: the resolved project root;
- `scope`: `project` or `user`;
- `requested_agents`: the exact selected agents;
- `strategy`: `shared` or `native`;
- `method`: `copy` or `link`;
- `destination`: every exact Skill directory;
- `physical_destination`: where that path resolves when an existing parent or target is linked;
- `agents`: which agents will discover each destination;
- `action`: `WOULD_INSTALL`, `WOULD_REPLACE`, `SKIPPED`, or `ALREADY_LINKED`;
- `managed_store`: the persistent source used by link mode;
- `no_files_changed`: must be `true` for a dry-run.

### Apply non-interactively

Automation and CI should specify the complete decision and explicit consent:

```bash
npx vibe-product-os@pilot install . \
  --scope project \
  --agents codex,claude,gemini \
  --strategy shared \
  --method copy \
  --yes \
  --json
```

`--yes` is required for non-interactive writes. Existing destinations are still preserved unless `--force` is also present.

### Project scope or user scope?

| Scope | Use it when | Result |
|---|---|---|
| `project` | The Skill should travel with one repository and be consistent for collaborators | Installation is placed under that repository’s supported agent directories |
| `user` | You want the Skill available across your own projects | Installation is placed under supported directories in your home directory |

Project scope is the recommended default for governed team work because the reviewed Skill version can be kept close to the project using it.

### Shared or native layout?

| Strategy | Behavior | Best for |
|---|---|---|
| `shared` | Uses `.agents/skills` once for every selected agent whose official documentation supports it; native-only agents receive their own official path | Teams using several compatible agents and wanting fewer duplicate copies |
| `native` | Uses each selected agent’s documented native Skill directory | Teams that want agent-specific visibility and lifecycle control |

The shared strategy never assumes unsupported compatibility. Claude Code and Cline, for example, fall back to their documented native paths.

### Copy or link?

| Method | Behavior | Trade-off |
|---|---|---|
| `copy` | Writes a complete independent Skill folder to every unique target | Most portable and easiest to commit; repeated native targets contain separate copies |
| `link` | Copies the Skill once to a persistent managed store, then links selected agent targets to it | One local source to update; symlinks may be less suitable for archives, Windows policies, repositories that prohibit links, or hosts that do not explicitly document symlink discovery |

Link mode does not point to the temporary npm or `npx` cache. It uses:

- project scope: `<project>/.vibe-product-os/skill-store/vibe-product-os`
- user scope: `~/.vibe-product-os/skill-store/vibe-product-os`

Codex, Gemini CLI, and Zed explicitly document linked or symlinked Skills. The installer warns when a selected host documents the directory but not symlink discovery; choose `copy` when you need the most conservative cross-host behavior.

### Supported agents and official locations

The installer’s target registry follows each host’s published Skill guidance.

| Agent | Project-native directory | User-native directory | Shared `.agents/skills` | Official guide |
|---|---|---|---|---|
| OpenAI Codex | `.agents/skills` | `~/.agents/skills` | Yes | [Codex Skills](https://developers.openai.com/codex/skills) |
| Claude Code | `.claude/skills` | `~/.claude/skills` | No documented shared path | [Claude Code Skills](https://code.claude.com/docs/en/agent-sdk/skills) |
| Gemini CLI | `.gemini/skills` | `~/.gemini/skills` | Yes | [Gemini CLI Agent Skills](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/using-agent-skills.md) |
| GitHub Copilot | `.github/skills` | `~/.copilot/skills` | Yes | [About Agent Skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) |
| Cursor | `.cursor/skills` | `~/.cursor/skills` | Yes | [Cursor Skills](https://cursor.com/docs/context/skills) |
| Windsurf | `.windsurf/skills` | `~/.codeium/windsurf/skills` | Yes | [Windsurf Skills](https://docs.windsurf.com/windsurf/cascade/skills) |
| OpenCode | `.opencode/skills` | `~/.config/opencode/skills` | Yes | [OpenCode Skills](https://opencode.ai/docs/skills/) |
| Cline | `.cline/skills` | `~/.cline/skills` | No documented shared path | [Cline Skills](https://docs.cline.bot/customization/skills) |
| Zed | `.agents/skills` | `~/.agents/skills` | Native location | [Zed Agent Skills](https://zed.dev/docs/ai/skills) |

Cline enables discovered Skills by default and gives a same-named global Skill precedence over a project Skill. Zed requires a trusted worktree and discovers Skill folders only as direct children of a skills directory.

Inspect the live registry and resolved destinations at any time:

```bash
npx vibe-product-os@pilot targets /absolute/path/to/project
npx vibe-product-os@pilot targets /absolute/path/to/project \
  --scope project \
  --agents all \
  --strategy shared \
  --json
```

### Custom or unsupported agent directory

If another agent implements the same `SKILL.md` directory convention, add its documented skills root explicitly:

```bash
npx vibe-product-os@pilot install . \
  --scope project \
  --target .custom-agent/skills \
  --method copy \
  --dry-run \
  --json
```

Then repeat with `--yes` after checking the resolved path. A custom target is an explicit user decision; the installer does not claim that an undocumented host will discover it.

## Verify the installation

Check the package, embedded framework, packaged Skill, runtime, and detected hosts:

```bash
npx vibe-product-os@pilot version --json
npx vibe-product-os@pilot setup-doctor --json
```

Then verify from each selected agent:

- ask the agent to list or use `vibe-product-os` in the target project;
- for Gemini CLI, run `gemini skills list` and use `/skills reload` in an already-open session if needed;
- for Cline, open the Skills menu or invoke `/vibe-product-os`;
- for Zed, trust the worktree and invoke `/vibe-product-os` or mention it in Agent Panel;
- if an agent was already running, start a fresh chat or session before treating discovery failure as an installer defect.

## How people and agents collaborate

Vibe Product OS uses one shared project control plane. Installing the Skill for multiple agents does not create multiple Product OS projects, does not synchronize agent memories, and does not give one agent authority over another. Every agent reads and updates the same governed project state.

### Responsibilities

| Participant | Responsible for | Must not delegate silently |
|---|---|---|
| Product OS Authority | Constitution, delegated authority, profile exceptions, applicability approvals, risk acceptance, baselines, gates, releases | Final authority-bearing decisions |
| Product or project owner | Objectives, scope, priority, funding/time constraints, accountable owners, product trade-offs | Business accountability |
| Domain contributors | Evidence, requirements, designs, architecture, implementation, tests, operational facts | Accuracy in their domain |
| AI agent | Inspecting state, asking bounded questions, drafting artifacts, tracing impact, running deterministic checks, reporting evidence and blockers | Approval, risk acceptance, compliance declaration, invented facts, or human acknowledgement |

An agent may prepare a gate packet; it may not approve the gate. It may identify an applicability recommendation; it may not approve `NOT_APPLICABLE`. It may verify a signature; it may not turn that verification into release authority.

### The normal collaboration loop

1. **Human sets the objective and boundary.** State the project, requested outcome, relevant source material, and who can decide.
2. **Agent inspects current state.** It reads `product-os.yaml`, `.product-os/`, active phase, profile, gate references, artifact register, open decisions, and applicability state.
3. **Agent distinguishes facts from proposals.** Existing approved decisions remain authoritative; external material is compared as adopt, adapt, merge, defer, or reject.
4. **Agent proposes a bounded change.** The proposal identifies files, artifacts, dependencies, trace impact, validation, and authority needed.
5. **Human decides where authority is required.** The agent records the exact decision reference; it does not infer approval from silence.
6. **Agent previews and applies.** Mutating commands are reviewed in dry-run before `--apply`, `--yes`, or `--force` is used.
7. **Agent validates and records evidence.** It reports the exact command, inputs, output identity, changed files, findings, and unresolved blockers.
8. **The next participant receives a handoff.** Scope, versions, evidence, open obligations, and acknowledgement state remain explicit.

### What to tell an agent

A useful request includes:

- the exact project root;
- whether this is a new Product OS project or an existing one;
- the desired operating mode: initialize, continue a phase, review, validate, assess impact, prepare a gate, prepare a handoff, or update;
- the expected outcome and deadline or scope limit;
- source files, links, standards, decisions, and evidence already available;
- known authority: who can approve scope, applicability, risk, gates, baselines, and release;
- constraints such as market, platform, language, accessibility, security, data, regulation, integrations, and repository topology;
- the requested profile if already decided, or permission to prepare a profile recommendation.

Example:

```text
Use Vibe Product OS for /absolute/path/to/product.
The project is already initialized as P2. Continue Phase 04 only.
Review the current requirements and GOV-009, compare the attached accessibility
standard as a proposal, update only affected artifacts, run validation, and prepare
the handoff. Do not approve G3B; I am the authority for that decision.
```

## Choose the execution profile

The profile changes physical packaging and evidence depth. It does not remove mandatory obligations, change canonical artifact IDs, weaken authority, or redefine a gate.

| Profile | Typical use | Physical treatment | Expected discipline |
|---|---|---|---|
| `P1 Lean` | Small, early, low-complexity, or rapid work | Composite artifacts around the critical chain | Minimal but operational evidence and required controls |
| `P2 Standard` | Most real products and cross-functional teams | Modular artifacts with normal separation | Full routine traceability, reviews, and gate evidence |
| `P3 Comprehensive` | Regulated, high-risk, enterprise, safety/security-sensitive, or multi-repository systems | More independent artifacts and stronger separation | Deeper evidence, retention, segregation, migration, and continuous assurance |

Choose the profile in Phase 00. If one domain needs stronger treatment, use a governed domain override instead of moving the entire project to a heavier profile automatically.

## Start a real project

### Step 1 — Confirm identities and readiness

```bash
vibe-product-os version --json
vibe-product-os setup-doctor --json
```

Expected result:

- package identity and Product OS framework identity are reported separately;
- the packaged Skill source is complete;
- the runtime and canonical catalogs are readable;
- supported and detected agents are listed;
- no project files are changed.

### Step 2 — Preview initialization

Choose a stable uppercase project ID, a human-readable name, a profile, and a repository topology:

```bash
vibe-product-os init \
  --project /absolute/path/to/product \
  --target . \
  --project-id EXAMPLE-PRODUCT \
  --project-name "Example Product" \
  --profile P2 \
  --topology FRAMEWORK_PLUS_PROJECT \
  --json
```

Initialization is a dry-run unless `--apply` is supplied.

Valid topology values are:

- `SINGLE_PROJECT_REPOSITORY`
- `FRAMEWORK_PLUS_PROJECT`
- `FEDERATED_MULTI_REPOSITORY`
- `BROWNFIELD_OVERLAY`

Expected dry-run result:

- exactly nine governed control files are planned;
- no lifecycle artifact files are created;
- no empty phase tree is created;
- initial state is `AUTHORITY_AND_APPLICABILITY_PENDING`;
- existing governed files block overwrite.

### Step 3 — Apply the reviewed initialization

Repeat the same command with `--apply`:

```bash
vibe-product-os init \
  --project /absolute/path/to/product \
  --target . \
  --project-id EXAMPLE-PRODUCT \
  --project-name "Example Product" \
  --profile P2 \
  --topology FRAMEWORK_PLUS_PROJECT \
  --apply \
  --json
```

The initial control plane is:

```text
product-os.yaml
.product-os/
├── framework.lock.yaml
├── repository-index.yaml
├── profile-composition.yaml
├── artifact-register.yaml
└── state/catalogs/
    ├── schema-catalog.json
    ├── artifact-catalog.json
    ├── profile-catalog.json
    └── gate-catalog.json
```

These files establish identity and governance state. They are not completed product specifications.

### Step 4 — Complete the Phase 00 decisions

Before generating phase artifacts, the team should resolve or explicitly leave open:

- product and project ownership;
- authority and delegated authority;
- `GOV-001 Product Constitution`;
- `GOV-009 Standards & Compliance Applicability Matrix`;
- repository topology and canonical repositories;
- lifecycle mode;
- P1/P2/P3 profile and any domain overrides;
- markets, platforms, languages, data classes, integrations, generated documents, accessibility, security, and regulatory triggers;
- active modules and artifact activation decisions;
- initial risks, assumptions, questions, and decisions.

Unknown facts remain `UNKNOWN`, `UNASSIGNED`, or open. Do not replace them with plausible text.

### Step 5 — Preview physical artifacts

```bash
vibe-product-os compose \
  --project /absolute/path/to/product \
  --phase active \
  --dry-run
```

Expected result:

- selected phases and logical artifact IDs;
- P1/P2/P3 physical packages and exact paths;
- artifact treatment: composite, modular, independent, register, or derived;
- existing-file conflicts and activation blockers;
- planned register and profile-composition updates;
- schema validation;
- no file changes.

Apply only the reviewed scope:

```bash
vibe-product-os compose \
  --project /absolute/path/to/product \
  --phase active \
  --apply
```

Conditional activation must name the artifact and its authority/evidence when it is not already supported by an approved active module:

```bash
vibe-product-os compose \
  --project /absolute/path/to/product \
  --phase 04 \
  --activate REQ-014 \
  --activation-authority-ref GOV-001#requirements-authority \
  --activation-evidence-ref GOV-009#applicability-decision \
  --dry-run
```

The composer preserves all 281 logical IDs across profiles, but it does not create every possible file. Inactive, conditional, and derived content remains absent until governed activation requires it.

### Step 6 — Work phase by phase

| Phase | Team question | Expected output |
|---|---|---|
| 00 — Initialization & Intake | What is this project, who owns it, what applies, and how will it run? | Identity, authority, profile, topology, standards applicability, initial governance |
| 01 — Discovery & Problem Definition | Whose problem are we solving, and what evidence supports it? | Research, actors, journeys, needs, problem framing, hypotheses, discovery evidence |
| 02 — Business Architecture | How does the business create value and control the outcome? | Capabilities, processes, policies, rules, measures, business requirements |
| 03 — Product Definition | What product are we committing to define? | Product boundaries, capabilities, modules, feature candidates, scope, product baseline inputs |
| 04 — Requirements Engineering | What must the system do, and how will it be accepted? | Functional and non-functional requirements, acceptance criteria, priorities, traceability |
| 05 — Experience Architecture | How will users move through states and journeys? | Information architecture, flows, states, interaction rules, accessibility behavior |
| 06 — Product Design | What is the reviewable design baseline? | Screens, components, content, tokens, responsive/RTL/accessibility specifications |
| 07 — Solution Architecture | How will the solution satisfy the requirements? | Components, data, integrations, security, reliability, deployment and architecture decisions |
| 08 — Engineering Readiness | Is implementation bounded and ready to start? | Work breakdown, Definition of Ready, environment/repository plans, coverage and readiness evidence |
| 09 — Implementation | What was built, changed, reviewed, and linked back to intent? | Code, implementation records, tests, reviews, build evidence, deviations and decisions |
| 10 — Verification & Release | Is the candidate verified and authorized for release? | Test evidence, defect/risk disposition, release packet, approvals and deployment evidence |
| 11 — Operations & Evolution | Is it operating safely, and what should change next? | Monitoring, incidents, support, service evidence, feedback, change proposals, retirement/evolution records |

Keep each phase as its own artifact or package. Cross-cutting governance is linked by identity instead of being copied inconsistently into every phase.

### Step 7 — Inspect project state continuously

```bash
vibe-product-os status \
  --project /absolute/path/to/product \
  --strict \
  --json
```

Expected result:

- project ID and framework release;
- profile and active phases;
- current gate references;
- registered and pending artifacts;
- path, package, applicability, and anchor state;
- drift or incomplete-control findings;
- no file changes.

### Step 8 — Validate before a gate or handoff

Recommended read-only sequence:

```bash
vibe-product-os doctor --project /absolute/path/to/product --strict --json
vibe-product-os validate --project /absolute/path/to/product --scope project --json
vibe-product-os lint --project /absolute/path/to/product --root . --include-hidden --json
vibe-product-os reconcile --project /absolute/path/to/product --scope all --json
```

Then use the specialized validators for the actual records:

```bash
vibe-product-os graph --project /absolute/path/to/product --file governance/GOV-008-trace-graph.json --json
vibe-product-os gate --project /absolute/path/to/product --file /path/to/gate-decision.json --json
vibe-product-os baseline --project /absolute/path/to/product --file /path/to/baseline.json --json
vibe-product-os handoff --project /absolute/path/to/product --file /path/to/handoff.json --json
```

A passing gate command means the decision record is structurally ready for review. It does not mean the gate is approved. A human with the required authority must make and record the decision.

### Step 9 — Assess a change before editing downstream work

```bash
vibe-product-os impact \
  --project /absolute/path/to/product \
  --file governance/GOV-008-trace-graph.json \
  --from REQ-014 \
  --direction downstream \
  --max-depth 8 \
  --json
```

Expected result:

- bounded upstream or downstream impact candidates;
- trace paths and depth;
- no automatic materiality decision;
- no automatic `NO_IMPACT` decision;
- no file changes.

The accountable team reviews the candidates, records the change in `GOV-007`, updates `GOV-008`, and reopens affected baselines or gates where required.

### Step 10 — Update the installed project framework safely

Preview:

```bash
vibe-product-os update \
  --project /absolute/path/to/product \
  --dry-run \
  --json
```

Apply only with exact authority and change references:

```bash
vibe-product-os update \
  --project /absolute/path/to/product \
  --authority-ref GOV-001#framework-update-authority \
  --change-ref GOV-007#CHANGE-UPDATE-001 \
  --apply \
  --json
```

An applied update creates a verified rollback backup. It does not approve its own change and does not silently cross an incompatible framework release.

## Command reference

### Distribution and project adapter commands

| Command | Writes? | Use it for | Expected result |
|---|---|---|---|
| `install` | Only after confirmation or `--yes` | Install the Skill for selected agents | Exact destinations, receipts, per-agent verification steps |
| `targets` | No | Inspect supported agents, official guides, detection, and resolved paths | Agent catalog and deduplicated plans |
| `version` | No | Separate package and framework identities | Version, release, authority-condition metadata |
| `setup-doctor` | No | Check packaged Skill/runtime readiness | Health report plus supported/detected agents |
| `compose` | Dry-run by default | Materialize profile-aware phase artifacts | Packages, paths, blockers, conflicts, validations |
| `status` | No | Reconcile project control and physical state | Current phase/profile/gate/artifact report |
| `update` | Dry-run by default | Reconcile a project with its bundled framework | Change plan, authority requirements, rollback evidence |
| `verify-release` | No | Verify exact release bytes and detached signatures | Byte identity, publisher identity, and authority boundary |

### Product OS runtime commands

| Command | Required or important options | Behavior |
|---|---|---|
| `init` | `--project-id`, `--project-name`; optional profile/topology/target | Creates only the bounded control plane; dry-run unless `--apply` |
| `validate` | `--scope framework|project|files`; repeated `--file` | Validates schemas and declared subjects |
| `lint` | `--root`; optional `--include-hidden` | Checks repository paths, unfinished content, serialization, and secret signals |
| `reconcile` | `--scope framework|project|all` | Detects catalog and control identity drift |
| `graph` | `--file` | Validates trace graph structure and coverage |
| `impact` | `--file`, `--from`; direction/depth options | Traverses impact candidates without deciding materiality |
| `gate` | `--file`; optional `--partial` | Validates a gate decision record without approving it |
| `baseline` | `--file` | Checks pinned-member reproducibility |
| `handoff` | `--file` | Validates membership, obligations, blockers, state, and acknowledgement fields |
| `migrate` | `--plan`, `--output` | Stages a digest-pinned migration; dry-run unless `--apply`; never cuts over automatically |
| `archive` | repeated `--include`, `--output` | Creates an additive content-addressed archive; dry-run unless `--apply` |
| `doctor` | optional `--strict` | Diagnoses runtime, framework, project, filesystem, and Git readiness |

Use `--json` for evidence, CI, or downstream automation. Automation should key on stable fields and exit codes instead of parsing human-readable output.

## Multi-agent working rules

When several agents work on the same product:

1. Keep one `product-os.yaml` and one `.product-os/` control plane.
2. Pin one reviewed Vibe Product OS package version for the team.
3. Give each agent a bounded task and the exact project root.
4. Require every agent to inspect current state before proposing changes.
5. Use Git branches or worktrees to prevent concurrent edits to the same artifact.
6. Keep one canonical owner for each fact, decision, requirement, source, and evidence item.
7. Register Figma, GitHub, CI, cloud, test, and operational objects by their native identity; do not create an uncontrolled markdown duplicate.
8. Before handoff, report files changed, commands run, validation results, source/evidence references, open questions, and required authority.
9. The receiving human or agent validates the handoff record; an agent never acknowledges on behalf of a person.
10. If two agents produce conflicting proposals, preserve the conflict and route it to the competent authority instead of selecting the more fluent answer.

## Common workflows

### New product

```text
Install → initialize → complete Phase 00 → compose active phase
→ discovery → business architecture → product definition → requirements
→ experience/design/architecture → engineering readiness → implementation
→ verification/release → operations/evolution
```

Expected outcome: a traceable chain from evidence and decisions to shipped and operated behavior, with gates and handoffs reviewed by accountable people.

### Existing product or brownfield repository

Use `BROWNFIELD_OVERLAY`. Inventory current repositories, documents, Figma files, CI/CD, environments, released behavior, known incidents, and existing decisions before declaring a baseline. Product OS should map and govern the current reality, not pretend the product is greenfield.

### External methodology, standard, or blueprint arrives

Treat it as input. Compare it against Product OS and record each useful element as:

- `ADOPT`
- `ADAPT`
- `MERGE`
- `DEFER`
- `REJECT`

If it changes applicability, update `GOV-009`. If it changes an approved baseline, traverse impact and use `GOV-007` plus `GOV-008`. Do not silently replace canonical Product OS terminology or create a parallel lifecycle.

### CI validation

Use read-only commands with JSON output on pull requests:

```bash
vibe-product-os doctor --project "$PROJECT_ROOT" --strict --json
vibe-product-os validate --project "$PROJECT_ROOT" --scope project --json
vibe-product-os reconcile --project "$PROJECT_ROOT" --scope all --json
vibe-product-os status --project "$PROJECT_ROOT" --strict --json
```

CI evidence is current only for the exact project revision, framework/package identity, inputs, and observation time. Re-run after relevant changes.

## Installation safety and recovery

- `--dry-run` never writes.
- Interactive setup shows exact destinations before confirmation.
- Non-interactive writes require `--yes`.
- Existing Skill directories are preserved by default.
- `--force` replaces only the exact resolved `vibe-product-os` destination, not the parent skills directory.
- Destinations that contain one another, overlap the managed store, or resolve through an existing filesystem link are surfaced before writing; overlapping plans are rejected.
- Copy installation stages every target before switching destinations.
- If a multi-target operation fails, staged targets are removed and replaced destinations are restored from temporary backups.
- Link mode uses one persistent managed store and relative links where the platform permits them.
- A managed store from another package version blocks reuse unless replacement is explicit.
- The installer never edits an agent’s general configuration or enables experimental features on the user’s behalf.

To inspect a suspected conflict without writing:

```bash
vibe-product-os install . \
  --scope project \
  --agents all \
  --strategy native \
  --method link \
  --dry-run \
  --json
```

## Troubleshooting

### The Skill is installed but the agent does not show it

1. Run `vibe-product-os targets . --scope project --agents <agent> --json`.
2. Compare the resolved destination to the agent’s official guide linked in the report.
3. Confirm `SKILL.md` is directly inside `<skills-root>/vibe-product-os/`.
4. Start a fresh agent session or use the host’s reload command.
5. For Cline, check the Skills menu and confirm a same-named global Skill is not taking precedence.
6. For Zed, trust the worktree and ensure no extra nesting exists.
7. Run `vibe-product-os setup-doctor --json` and include non-sensitive output in a GitHub issue.

### Installation reports `SKIPPED`

An exact destination already exists and was preserved. Inspect it. Use `--force` only if replacing that exact Skill directory is intended and recoverable.

### Link installation reports a blocked managed store

The persistent store exists but its receipt does not match the package being run. Review:

```text
<project-or-home>/.vibe-product-os/skill-store/vibe-product-os
```

Preview with `--force --dry-run`; apply with `--force --yes` only after confirming replacement is correct.

### `compose` is blocked

Read the returned blockers. Common causes are incomplete Phase 00 authority/applicability, missing control files, conflicting profile overrides, conditional artifacts without activation authority/evidence, or an existing physical file that would be overwritten.

### A command passes but the project is not ready

A targeted validator proves only its declared subject. Readiness also depends on source quality, evidence freshness, trace coverage, unresolved risks, applicable policy, human decisions, and the required gate authority.

## Public pilot support and security

- Use [GitHub Issues](https://github.com/Shiro7/vibe-product-os/issues) for installation problems, reproducible defects, workflow feedback, and documentation gaps.
- Use [GitHub private vulnerability reporting](https://github.com/Shiro7/vibe-product-os/security/advisories/new) for suspected security vulnerabilities.
- Do not put secrets, private keys, confidential product artifacts, regulated data, or unpublished vulnerability details into a public issue.
- Include package version, framework version, operating system, Node.js version, selected agent, exact command, expected result, observed result, and a minimal non-sensitive reproduction.

See [SUPPORT.md](SUPPORT.md), [SECURITY.md](SECURITY.md), and [PILOT_STATUS.md](PILOT_STATUS.md) for the current policy and claim boundary.

## Maintainer verification

Repository contributors can run:

```bash
npm test
npm run test:runtime
npm run dist
npm run audit
```

Building a candidate does not publish it. npm publication, release signatures, distribution tags, and public claims remain separate governed release actions.
