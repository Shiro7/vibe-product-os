'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const identity = require('./identity');

const SKILL_NAME = 'vibe-product-os';
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const SKILL_SOURCE = path.join(
  PACKAGE_ROOT,
  'plugins',
  SKILL_NAME,
  'skills',
  SKILL_NAME,
);

function normalizeScope(value = 'project') {
  const normalized = String(value).trim().toLowerCase();
  if (['project', 'repo', 'repository', 'local'].includes(normalized)) return 'project';
  if (['user', 'global'].includes(normalized)) return 'user';
  throw new Error('Install scope must be project/repository or user/global.');
}

function resolveSkillsRoot(options = {}) {
  const scope = normalizeScope(options.scope);
  const cwd = path.resolve(options.cwd || process.cwd());
  const home = path.resolve(options.home || os.homedir());
  return path.join(scope === 'project' ? cwd : home, '.agents', 'skills');
}

function planInstallation(options = {}) {
  const scope = normalizeScope(options.scope);
  const skillsRoot = resolveSkillsRoot({ ...options, scope });
  const destination = path.join(skillsRoot, SKILL_NAME);
  return {
    host: 'codex',
    scope,
    skillsRoot,
    destination,
    exists: fs.existsSync(destination),
  };
}

function validateSkillSource(source = SKILL_SOURCE) {
  const required = [
    path.join(source, 'SKILL.md'),
    path.join(source, 'agents', 'openai.yaml'),
  ];
  const missing = required.filter((file) => !fs.existsSync(file));
  if (missing.length) throw new Error(`Packaged Skill source is incomplete: ${missing.join(', ')}`);
  return source;
}

function writeReceipt(destination, plan) {
  const receipt = {
    package: identity.package,
    package_version: identity.package_version,
    framework: identity.framework,
    framework_version: identity.framework_version,
    skill: SKILL_NAME,
    host: plan.host,
    scope: plan.scope,
    installed_at: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(destination, '.vibe-product-os-install.json'),
    `${JSON.stringify(receipt, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  );
}

function install(options = {}) {
  const plan = planInstallation(options);
  const source = validateSkillSource(options.source || SKILL_SOURCE);
  const force = Boolean(options.force);
  const dryRun = Boolean(options.dryRun);

  if (plan.exists && !force) {
    return { ...plan, status: 'SKIPPED', reason: 'DESTINATION_EXISTS' };
  }
  if (dryRun) {
    return { ...plan, status: plan.exists ? 'WOULD_REPLACE' : 'WOULD_INSTALL' };
  }

  fs.mkdirSync(plan.skillsRoot, { recursive: true });
  const nonce = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const staging = `${plan.destination}.tmp-${nonce}`;
  const backup = `${plan.destination}.backup-${nonce}`;
  let backupCreated = false;
  let destinationInstalled = false;

  try {
    fs.cpSync(source, staging, { recursive: true, errorOnExist: true });
    if (plan.exists) {
      fs.renameSync(plan.destination, backup);
      backupCreated = true;
    }
    fs.renameSync(staging, plan.destination);
    destinationInstalled = true;
    writeReceipt(plan.destination, plan);
    if (backupCreated) fs.rmSync(backup, { recursive: true, force: true });
    return { ...plan, status: plan.exists ? 'REPLACED' : 'INSTALLED' };
  } catch (error) {
    if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
    if (destinationInstalled && fs.existsSync(plan.destination)) {
      fs.rmSync(plan.destination, { recursive: true, force: true });
    }
    if (backupCreated && fs.existsSync(backup)) fs.renameSync(backup, plan.destination);
    throw error;
  }
}

module.exports = {
  SKILL_NAME,
  SKILL_SOURCE,
  normalizeScope,
  resolveSkillsRoot,
  planInstallation,
  validateSkillSource,
  install,
};
