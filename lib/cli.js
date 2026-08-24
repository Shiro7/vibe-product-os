'use strict';

const path = require('node:path');
const identity = require('./identity');
const installer = require('./installer');
const agentTargets = require('./agent-targets');
const installWizard = require('./install-wizard');
const runtime = require('./runtime');
const composer = require('./composer');
const status = require('./status');
const updater = require('./updater');
const releaseVerifier = require('./release-verifier');

const helpText = `Vibe Product OS ${identity.package_version} — PUBLIC PILOT

Usage:
  vibe-product-os install [directory]
  vibe-product-os install [directory] --scope <project|user> --agents <ids> --yes [options]
  vibe-product-os targets [directory] [--scope <project|user>] [--agents <ids>] [--json]
  vibe-product-os setup-doctor [--json]
  vibe-product-os version [--json]
  vibe-product-os compose [--project <path>] [--profile <P1|P2|P3>] [--phase <active|all|00..11>] [--activate <ARTIFACT-ID>] [--activation-authority-ref <ref>] [--activation-evidence-ref <ref>] [--dry-run|--apply]
  vibe-product-os status [--project <path>] [--strict] [--json]
  vibe-product-os update [--project <path>] [--authority-ref <ref>] [--change-ref <ref>] [--rollback <UPDATE-ID>] [--dry-run|--apply] [--json]
  vibe-product-os verify-release --manifest <path> [--require-signatures] [--json]
  vibe-product-os <product-os-command> [options]

Product OS runtime commands:
  init, validate, lint, reconcile, graph, impact, gate, baseline,
  handoff, migrate, archive, doctor

Safety:
  Interactive install previews every destination and asks before writing.
  Non-interactive apply requires --yes; --dry-run never writes.
  Installation preserves an existing Skill unless --force is explicit.
  --method link uses a persistent managed store, never the temporary npx cache.
  Product OS mutations remain dry-run unless the underlying command receives --apply.
  compose defaults to dry-run and refuses overwrites, unresolved authority, or ambiguous profile overrides.
  verify-release is read-only; it verifies exact bytes and, when configured, detached Minisign signatures.

Install options:
  --scope <project|user>       Repository-local or user-wide installation.
  --agents <ids>              Comma-separated agent IDs, popular, other, or all.
  --strategy <shared|native>  Share .agents/skills when officially supported, or use native paths.
  --method <copy|link>        Independent copies, or links to one persistent managed store.
  --target <skills-directory> Add a custom skills root; may be repeated.
  --dry-run                   Resolve and preview exact paths without writing.
  --force                     Replace exact existing Skill destinations after consent.
  --yes                       Non-interactive consent to the resolved plan.
  --json                      Machine-readable output.

Supported agent IDs:
  codex, claude, gemini, copilot, cursor, windsurf, opencode, cline, zed
`;

function parseInstallArgs(args) {
  const result = {
    directory: '.', scope: null, agents: null, customRoots: [], strategy: null,
    method: null, yes: false, dryRun: false, force: false, json: false,
    noInteractive: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith('--')) {
      if (result.directory !== '.') throw new Error('Install accepts at most one directory.');
      result.directory = token;
      continue;
    }
    if (token === '--yes') result.yes = true;
    else if (token === '--dry-run') result.dryRun = true;
    else if (token === '--force') result.force = true;
    else if (token === '--json') result.json = true;
    else if (token === '--no-interactive') result.noInteractive = true;
    else if (['--scope', '--agents', '--strategy', '--method', '--target'].includes(token)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${token} requires a value.`);
      if (token === '--scope') result.scope = value;
      else if (token === '--strategy') result.strategy = value;
      else if (token === '--method') result.method = value;
      else if (token === '--target') result.customRoots.push(value);
      else {
        if (!result.agents) result.agents = [];
        result.agents.push(...value.split(',').filter(Boolean));
      }
      index += 1;
    } else {
      throw new Error(`Unknown install option ${token}.`);
    }
  }
  return result;
}

function parseTargetsArgs(args) {
  const result = {
    directory: '.', scope: null, agents: null, strategy: 'shared', method: 'copy', json: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith('--')) {
      if (result.directory !== '.') throw new Error('Targets accepts at most one directory.');
      result.directory = token;
      continue;
    }
    if (token === '--json') result.json = true;
    else if (['--scope', '--agents', '--strategy', '--method'].includes(token)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${token} requires a value.`);
      if (token === '--scope') result.scope = value;
      else if (token === '--strategy') result.strategy = value;
      else if (token === '--method') result.method = value;
      else result.agents = value.split(',').filter(Boolean);
      index += 1;
    } else throw new Error(`Unknown targets option ${token}.`);
  }
  return result;
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printTargets(report) {
  process.stdout.write('Supported agents and official Skill destinations\n\n');
  for (const agent of report.agents) {
    const detected = report.detected.find((item) => item.id === agent.id)?.detected ? ' [detected]' : '';
    process.stdout.write(`${agent.label} (${agent.id})${detected}\n`);
    process.stdout.write(`  Project native: ${agent.project_native_root}\n`);
    process.stdout.write(`  User native: ${agent.user_native_root}\n`);
    process.stdout.write(`  Official guide: ${agent.official_docs}\n`);
    if (agent.notice) process.stdout.write(`  Note: ${agent.notice}\n`);
  }
  process.stdout.write('\nResolved installation plans\n');
  for (const [scope, plan] of Object.entries(report.plans)) {
    process.stdout.write(`  ${scope}:\n`);
    if (plan.managed_store) {
      process.stdout.write(`    managed store: ${plan.managed_store.destination} [${plan.managed_store.action}]\n`);
    }
    for (const target of plan.targets) {
      process.stdout.write(`    ${target.destination} [${target.action}] <- ${target.agent_labels.join(', ') || 'custom'}\n`);
      if (target.through_filesystem_link) {
        process.stdout.write(`      physical: ${target.physical_destination}\n`);
      }
    }
  }
}

function printInstallResult(report) {
  process.stdout.write(`${report.status} — ${report.scope}, ${report.strategy}, ${report.method}\n`);
  if (report.managed_store) {
    process.stdout.write(`Managed store: ${report.managed_store.destination} [${report.managed_store.status || report.managed_store.action}]\n`);
  }
  for (const target of report.targets) {
    process.stdout.write(`${target.status || target.action} — ${target.destination} (${target.agent_labels.join(', ') || 'custom'})\n`);
  }
  const nextSteps = [...new Set(report.targets.flatMap((target) => target.verification))];
  if (nextSteps.length) {
    process.stdout.write('Next checks:\n');
    for (const step of nextSteps) process.stdout.write(`  - ${step}\n`);
  }
}

function parseComposeArgs(args) {
  const result = { project: '.', profile: null, phases: [], activate: [], apply: false, dryRun: false };
  const valueOptions = new Map([
    ['--project', 'project'], ['--profile', 'profile'], ['--phase', 'phases'], ['--activate', 'activate'],
    ['--activation-authority-ref', 'activationAuthorityRef'], ['--activation-evidence-ref', 'activationEvidenceRef'],
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === '--apply') result.apply = true;
    else if (token === '--dry-run') result.dryRun = true;
    else if (token === '--json') result.json = true;
    else if (valueOptions.has(token)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${token} requires a value.`);
      const field = valueOptions.get(token);
      if (['phases', 'activate'].includes(field)) result[field].push(...value.split(',').filter(Boolean));
      else result[field] = value;
      index += 1;
    } else throw new Error(`Unknown compose option ${token}.`);
  }
  if (result.apply && result.dryRun) throw new Error('Choose either --dry-run or --apply, not both.');
  result.project = path.resolve(result.project);
  return result;
}

function parseStatusArgs(args) {
  const result = { project: '.', strict: false, json: false };
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === '--strict') result.strict = true;
    else if (token === '--json') result.json = true;
    else if (token === '--project') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error('--project requires a path.');
      result.project = value;
      index += 1;
    } else throw new Error(`Unknown status option ${token}.`);
  }
  result.project = path.resolve(result.project);
  return result;
}

function parseUpdateArgs(args) {
  const result = { project: '.', apply: false, dryRun: false, json: false, authorityRef: null, changeRef: null, rollback: null };
  const values = new Map([
    ['--project', 'project'], ['--authority-ref', 'authorityRef'], ['--change-ref', 'changeRef'], ['--rollback', 'rollback'],
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === '--apply') result.apply = true;
    else if (token === '--dry-run') result.dryRun = true;
    else if (token === '--json') result.json = true;
    else if (values.has(token)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${token} requires a value.`);
      result[values.get(token)] = value;
      index += 1;
    } else throw new Error(`Unknown update option ${token}.`);
  }
  if (result.apply && result.dryRun) throw new Error('Choose either --dry-run or --apply, not both.');
  result.project = path.resolve(result.project);
  return result;
}

function parseVerifyReleaseArgs(args) {
  const result = { manifest: null, requireSignatures: false, json: false };
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === '--require-signatures') result.requireSignatures = true;
    else if (token === '--json') result.json = true;
    else if (token === '--manifest') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error('--manifest requires a path.');
      result.manifest = path.resolve(value);
      index += 1;
    } else throw new Error(`Unknown verify-release option ${token}.`);
  }
  if (!result.manifest) throw new Error('verify-release requires --manifest <path>.');
  return result;
}

async function run(args) {
  const command = args[0] || 'help';
  const rest = args.slice(1);

  if (['help', '--help', '-h'].includes(command)) {
    process.stdout.write(helpText);
    return;
  }

  if (['version', '--version', '-v'].includes(command)) {
    if (rest.includes('--json')) printJson(identity);
    else process.stdout.write(`Vibe Product OS ${identity.package_version}\nProduct OS framework ${identity.framework_version} (${identity.framework_status})\n`);
    return;
  }

  if (command === 'targets') {
    const options = parseTargetsArgs(rest);
    const cwd = path.resolve(options.directory);
    const agents = options.agents || ['all'];
    const scopes = options.scope ? [agentTargets.normalizeScope(options.scope)] : ['project', 'user'];
    const report = {
      agents: agentTargets.agentCatalog(),
      detected: agentTargets.detectAgents({ cwd }),
      plans: Object.fromEntries(scopes.map((scope) => [scope, installer.planInstallations({
        cwd,
        scope,
        agents,
        strategy: options.strategy,
        method: options.method,
      })])),
    };
    if (options.json) printJson(report);
    else printTargets(report);
    return;
  }

  if (command === 'install') {
    let options = parseInstallArgs(rest);
    const canPrompt = process.stdin.isTTY && process.stdout.isTTY && !options.noInteractive && !options.json;
    if (!options.yes && canPrompt) {
      const wizard = await installWizard.runInstallWizard(options);
      if (wizard.cancelled) {
        process.stdout.write('CANCELLED — no files changed.\n');
        return;
      }
      options = { ...options, ...wizard.options };
    } else {
      if (!options.yes && !options.dryRun) {
        throw new Error('Non-interactive installation requires explicit --yes consent. Use --dry-run to preview first.');
      }
      if (!options.scope) throw new Error('Non-interactive installation requires --scope project or --scope user.');
    }

    const agents = options.agents || (options.customRoots.length ? [] : ['codex']);
    const result = installer.installMany({
      cwd: path.resolve(options.directory),
      scope: options.scope,
      agents,
      customRoots: options.customRoots,
      strategy: options.strategy || 'shared',
      method: options.method || 'copy',
      dryRun: options.dryRun,
      force: options.force,
    });
    if (options.json) printJson({ operation: 'install', ...result });
    else printInstallResult(result);
    return;
  }

  if (command === 'setup-doctor') {
    const cwd = path.resolve(rest.find((value) => !value.startsWith('--')) || '.');
    const report = {
      identity,
      runtime: runtime.health(),
      skill_source: installer.SKILL_SOURCE,
      skill_source_valid: true,
      detected_agents: agentTargets.detectAgents({ cwd }),
      supported_agents: agentTargets.agentCatalog(),
    };
    try {
      installer.validateSkillSource();
    } catch (error) {
      report.skill_source_valid = false;
      report.skill_error = error.message;
    }
    report.healthy = report.runtime.healthy && report.skill_source_valid;
    if (rest.includes('--json')) printJson(report);
    else process.stdout.write(`${report.healthy ? 'HEALTHY' : 'NEEDS_ATTENTION'} — package ${identity.package_version}, framework ${identity.framework_version}\n`);
    if (!report.healthy) process.exitCode = 1;
    return;
  }

  if (command === 'compose') {
    const options = parseComposeArgs(rest);
    printJson(composer.composeProject(options));
    return;
  }

  if (command === 'status') {
    const options = parseStatusArgs(rest);
    const report = status.projectStatus(options);
    if (options.json) printJson(report);
    else process.stdout.write(`${report.summary.result} — ${report.project.project_id}, ${report.project.profile}, phases ${report.project.active_phases.join(', ')}, gates ${report.project.current_gate_refs.join(', ')}, artifacts ${report.artifacts.registered}, pending ${report.artifacts.pending_ids.length}\n`);
    if (report.strict_exit_code) process.exitCode = report.strict_exit_code;
    return;
  }

  if (command === 'update') {
    const options = parseUpdateArgs(rest);
    const report = updater.updateProject(options);
    if (options.json) printJson(report);
    else process.stdout.write(`${report.status} — ${report.project_id}, ${report.current_framework_release || report.update_id} → ${report.target_framework_release || 'rollback'}, changes ${report.planned_changes ? report.planned_changes.length : report.records.length}\n`);
    return;
  }

  if (command === 'verify-release') {
    const options = parseVerifyReleaseArgs(rest);
    const report = releaseVerifier.verifyRelease(options);
    if (options.json) printJson(report);
    else process.stdout.write(`${report.result} — bytes ${report.byte_identity}, publisher ${report.publisher_identity}, Authority publication decision ${report.external_distribution_authorized ? 'PRESENT' : 'NOT PRESENT'}\n`);
    if (report.exit_code) process.exitCode = report.exit_code;
    return;
  }

  runtime.runProductOS(args);
}

module.exports = {
  run,
  parseInstallArgs,
  parseTargetsArgs,
  parseComposeArgs,
  parseStatusArgs,
  parseUpdateArgs,
  parseVerifyReleaseArgs,
  helpText,
};
