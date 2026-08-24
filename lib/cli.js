'use strict';

const path = require('node:path');
const identity = require('./identity');
const installer = require('./installer');
const runtime = require('./runtime');
const composer = require('./composer');
const status = require('./status');
const updater = require('./updater');
const releaseVerifier = require('./release-verifier');

const helpText = `Vibe Product OS ${identity.package_version} — PILOT CANDIDATE

Usage:
  vibe-product-os install [directory] --scope <project|user> --yes [--dry-run] [--force]
  vibe-product-os targets [directory]
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
  Installation preserves an existing Skill unless --force is explicit.
  Product OS mutations remain dry-run unless the underlying command receives --apply.
  compose defaults to dry-run and refuses overwrites, unresolved authority, or ambiguous profile overrides.
  verify-release is read-only; it verifies exact bytes and, when configured, detached Minisign signatures.
  This candidate is not authorized for public distribution until exact signatures, license, channels, and Authority decision pass.
`;

function parseInstallArgs(args) {
  const result = { directory: '.', scope: null, yes: false, dryRun: false, force: false };
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
    else if (token === '--scope') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error('--scope requires project or user.');
      result.scope = value;
      index += 1;
    } else {
      throw new Error(`Unknown install option ${token}.`);
    }
  }
  if (!result.yes) throw new Error('Installation requires explicit --yes consent. Use --dry-run to preview first.');
  if (!result.scope) throw new Error('Installation requires --scope project or --scope user.');
  return result;
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
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
    const cwd = path.resolve(rest.find((value) => !value.startsWith('--')) || '.');
    printJson({
      supported_host: 'codex',
      project: installer.planInstallation({ cwd, scope: 'project' }),
      user: installer.planInstallation({ cwd, scope: 'user' }),
    });
    return;
  }

  if (command === 'install') {
    const options = parseInstallArgs(rest);
    const result = installer.install({
      cwd: path.resolve(options.directory),
      scope: options.scope,
      dryRun: options.dryRun,
      force: options.force,
    });
    printJson({
      operation: 'install',
      result,
      no_files_changed: options.dryRun || result.status === 'SKIPPED',
      next_action: options.dryRun
        ? 'Review the destination, then repeat without --dry-run when authorized.'
        : 'Codex detects Skill changes automatically; restart only if it does not appear.',
    });
    return;
  }

  if (command === 'setup-doctor') {
    const report = {
      identity,
      runtime: runtime.health(),
      skill_source: installer.SKILL_SOURCE,
      skill_source_valid: true,
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

module.exports = { run, parseInstallArgs, parseComposeArgs, parseStatusArgs, parseUpdateArgs, parseVerifyReleaseArgs, helpText };
