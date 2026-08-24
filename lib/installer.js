'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const identity = require('./identity');
const agentTargets = require('./agent-targets');

const SKILL_NAME = 'vibe-product-os';
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const SKILL_SOURCE = path.join(
  PACKAGE_ROOT,
  'plugins',
  SKILL_NAME,
  'skills',
  SKILL_NAME,
);

const {
  AGENTS,
  normalizeAgentIds,
  normalizeMethod,
  normalizeScope,
  normalizeStrategy,
  pathExists,
  resolveAgentSkillsRoot,
  resolveManagedStore,
} = agentTargets;

function resolveSkillsRoot(options = {}) {
  return resolveAgentSkillsRoot(options.agent || 'codex', options).skillsRoot;
}

function normalizeCustomRoots(value, cwd) {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.filter(Boolean).map((entry) => (
    path.resolve(cwd, String(entry))
  )))];
}

function existingState(destination, managedStore = null) {
  if (!pathExists(destination)) {
    return { exists: false, type: null, link_target: null, linked_to_store: false };
  }
  const stat = fs.lstatSync(destination);
  let linkTarget = null;
  if (stat.isSymbolicLink()) {
    linkTarget = path.resolve(path.dirname(destination), fs.readlinkSync(destination));
  }
  return {
    exists: true,
    type: stat.isSymbolicLink() ? 'symlink' : stat.isDirectory() ? 'directory' : 'file',
    link_target: linkTarget,
    linked_to_store: Boolean(managedStore && linkTarget === managedStore),
  };
}

function resolvePhysicalDestination(destination, state) {
  if (state?.link_target) return state.link_target;
  let ancestor = destination;
  const suffix = [];
  while (!pathExists(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) return destination;
    suffix.unshift(path.basename(ancestor));
    ancestor = parent;
  }
  try {
    return path.join(fs.realpathSync(ancestor), ...suffix);
  } catch {
    return destination;
  }
}

function isNestedPath(parent, child) {
  const relative = path.relative(parent, child);
  return Boolean(relative && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function assertIndependentDestinations(targets, managedStore) {
  for (let left = 0; left < targets.length; left += 1) {
    for (let right = left + 1; right < targets.length; right += 1) {
      const first = targets[left].destination;
      const second = targets[right].destination;
      if (isNestedPath(first, second) || isNestedPath(second, first)) {
        throw new Error(`Installation destinations may not contain one another: ${first} and ${second}.`);
      }
    }
  }
  if (!managedStore) return;
  for (const target of targets) {
    if (target.destination === managedStore
      || isNestedPath(target.destination, managedStore)
      || isNestedPath(managedStore, target.destination)) {
      throw new Error(`Agent target and managed store may not contain one another: ${target.destination} and ${managedStore}.`);
    }
  }
}

function groupTargets(options) {
  const groups = new Map();
  const add = (entry) => {
    const key = path.normalize(entry.destination);
    if (!groups.has(key)) {
      groups.set(key, {
        skillsRoot: entry.skillsRoot,
        destination: entry.destination,
        agents: [],
        agent_labels: [],
        layouts: [],
        official_docs: [],
        verification: [],
        notices: [],
        custom: Boolean(entry.custom),
      });
    }
    const group = groups.get(key);
    if (entry.agent) group.agents.push(entry.agent.id);
    if (entry.agent) group.agent_labels.push(entry.agent.label);
    if (entry.layout) group.layouts.push(entry.layout);
    if (entry.agent?.docs) group.official_docs.push(entry.agent.docs);
    if (entry.agent?.verify) group.verification.push(entry.agent.verify);
    if (entry.agent?.notice) group.notices.push(entry.agent.notice);
    if (options.method === 'link' && entry.agent && !entry.agent.documentedLinkSupport) {
      group.notices.push(
        `${entry.agent.label} documents this Skill directory but does not explicitly document symlink discovery; use copy if host behavior is uncertain.`,
      );
    }
    group.custom = group.custom || Boolean(entry.custom);
  };

  for (const agentId of options.agents) {
    const agent = AGENTS[agentId];
    const resolved = resolveAgentSkillsRoot(agentId, options);
    add({
      agent,
      layout: resolved.layout,
      skillsRoot: resolved.skillsRoot,
      destination: path.join(resolved.skillsRoot, SKILL_NAME),
    });
  }
  for (const skillsRoot of options.customRoots) {
    add({
      custom: true,
      layout: 'custom',
      skillsRoot,
      destination: path.join(skillsRoot, SKILL_NAME),
    });
  }

  return [...groups.values()].map((entry) => ({
    ...entry,
    agents: [...new Set(entry.agents)],
    agent_labels: [...new Set(entry.agent_labels)],
    layouts: [...new Set(entry.layouts)],
    official_docs: [...new Set(entry.official_docs)],
    verification: [...new Set(entry.verification)],
    notices: [...new Set(entry.notices)],
  }));
}

function readReceipt(destination) {
  const receiptPath = path.join(destination, '.vibe-product-os-install.json');
  try {
    return JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  } catch {
    return null;
  }
}

function skillDigest(root) {
  const hash = crypto.createHash('sha256');
  const walk = (directory) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.name !== '.vibe-product-os-install.json')
      .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile()) {
        hash.update(relative);
        hash.update('\0');
        hash.update(fs.readFileSync(absolute));
        hash.update('\0');
      } else if (entry.isSymbolicLink()) {
        hash.update(relative);
        hash.update('\0link\0');
        hash.update(fs.readlinkSync(absolute));
        hash.update('\0');
      }
    }
  };
  walk(root);
  return hash.digest('hex');
}

function planInstallations(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const scope = normalizeScope(options.scope);
  const strategy = normalizeStrategy(options.strategy);
  const method = normalizeMethod(options.method);
  const agents = normalizeAgentIds(options.agents === undefined ? ['codex'] : options.agents);
  const customRoots = normalizeCustomRoots(options.customRoots || options.targets, cwd);
  if (!agents.length && !customRoots.length) {
    throw new Error('Choose at least one supported agent or provide a custom skills root with --target.');
  }
  const normalized = {
    ...options,
    cwd,
    scope,
    strategy,
    method,
    agents,
    customRoots,
  };
  const source = options.source || SKILL_SOURCE;
  const sourceDigest = skillDigest(source);
  const managedStore = method === 'link' ? resolveManagedStore(normalized) : null;
  const groupedTargets = groupTargets(normalized);
  assertIndependentDestinations(groupedTargets, managedStore);
  const targetPlans = groupedTargets.map((target) => {
    const state = existingState(target.destination, managedStore);
    const physicalDestination = resolvePhysicalDestination(target.destination, state);
    let action = 'WOULD_INSTALL';
    if (state.linked_to_store && method === 'link') action = 'ALREADY_LINKED';
    else if (state.exists && options.force) action = 'WOULD_REPLACE';
    else if (state.exists) action = 'SKIPPED';
    const notices = [...target.notices];
    if (physicalDestination !== target.destination) {
      notices.push(`Destination resolves through a filesystem link to ${physicalDestination}.`);
    }
    return {
      ...target,
      ...state,
      physical_destination: physicalDestination,
      through_filesystem_link: physicalDestination !== target.destination,
      notices,
      action,
    };
  });

  let store = null;
  if (managedStore) {
    const state = existingState(managedStore);
    const receipt = state.exists && state.type === 'directory' ? readReceipt(managedStore) : null;
    const installedDigest = state.exists && state.type === 'directory'
      ? skillDigest(managedStore)
      : null;
    const reusable = Boolean(
      state.exists
      && state.type === 'directory'
      && fs.existsSync(path.join(managedStore, 'SKILL.md'))
      && receipt?.package === identity.package
      && receipt?.package_version === identity.package_version
      && receipt?.skill_source_sha256 === sourceDigest
      && installedDigest === sourceDigest
    );
    let action = 'WOULD_CREATE';
    if (state.exists && options.force) action = 'WOULD_REPLACE';
    else if (reusable) action = 'REUSE';
    else if (state.exists) action = 'BLOCKED';
    store = {
      destination: managedStore,
      ...state,
      physical_destination: resolvePhysicalDestination(managedStore, state),
      reusable,
      installed_package_version: receipt?.package_version || null,
      installed_skill_sha256: installedDigest,
      action,
    };
  }

  return {
    skill: SKILL_NAME,
    package_version: identity.package_version,
    skill_source_sha256: sourceDigest,
    project: cwd,
    scope,
    strategy,
    method,
    requested_agents: agents,
    custom_roots: customRoots,
    managed_store: store,
    targets: targetPlans,
    unique_destination_count: targetPlans.length,
    deduplicated_agent_target_count: agents.length + customRoots.length - targetPlans.length,
    no_files_changed: true,
  };
}

function planInstallation(options = {}) {
  const plan = planInstallations({ ...options, agents: [options.agent || 'codex'] });
  const target = plan.targets[0];
  return {
    host: target.agents[0] || 'custom',
    scope: plan.scope,
    strategy: plan.strategy,
    method: plan.method,
    skillsRoot: target.skillsRoot,
    destination: target.destination,
    exists: target.exists,
    action: target.action,
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

function writeReceipt(destination, plan, target, kind = 'agent-target') {
  const receipt = {
    receipt_version: '2.0.0',
    package: identity.package,
    package_version: identity.package_version,
    framework: identity.framework,
    framework_version: identity.framework_version,
    skill: SKILL_NAME,
    install_kind: kind,
    scope: plan.scope,
    strategy: plan.strategy,
    method: plan.method,
    agents: target?.agents || plan.requested_agents,
    skill_source_sha256: plan.skill_source_sha256,
    installed_at: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(destination, '.vibe-product-os-install.json'),
    `${JSON.stringify(receipt, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  );
}

function removeExact(target) {
  if (pathExists(target)) fs.rmSync(target, { recursive: true, force: true });
}

function installCopies(plan, source) {
  const actionable = plan.targets.filter((target) => target.action.startsWith('WOULD_'));
  if (!actionable.length) {
    return {
      ...plan,
      status: 'SKIPPED',
      targets: plan.targets.map((target) => ({ ...target, status: target.action })),
    };
  }

  const nonce = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const transactions = [];
  try {
    for (const target of actionable) {
      fs.mkdirSync(target.skillsRoot, { recursive: true });
      const staging = `${target.destination}.tmp-${nonce}`;
      const backup = `${target.destination}.backup-${nonce}`;
      fs.cpSync(source, staging, { recursive: true, errorOnExist: true });
      writeReceipt(staging, plan, target);
      transactions.push({ target, staging, backup, backupCreated: false, installed: false });
    }
    for (const transaction of transactions) {
      if (transaction.target.exists) {
        fs.renameSync(transaction.target.destination, transaction.backup);
        transaction.backupCreated = true;
      }
      fs.renameSync(transaction.staging, transaction.target.destination);
      transaction.installed = true;
    }
    for (const transaction of transactions) {
      if (transaction.backupCreated) removeExact(transaction.backup);
    }
  } catch (error) {
    for (const transaction of [...transactions].reverse()) {
      removeExact(transaction.staging);
      if (transaction.installed) removeExact(transaction.target.destination);
      if (transaction.backupCreated && pathExists(transaction.backup)) {
        fs.renameSync(transaction.backup, transaction.target.destination);
      }
    }
    throw error;
  }

  return {
    ...plan,
    status: 'COMPLETED',
    no_files_changed: false,
    targets: plan.targets.map((target) => ({
      ...target,
      status: target.action === 'WOULD_REPLACE'
        ? 'REPLACED'
        : target.action === 'WOULD_INSTALL'
          ? 'INSTALLED'
          : target.action,
    })),
  };
}

function linkType() {
  return process.platform === 'win32' ? 'junction' : 'dir';
}

function installLinks(plan, source) {
  const actionable = plan.targets.filter((target) => target.action.startsWith('WOULD_'));
  const storeNeedsChange = ['WOULD_CREATE', 'WOULD_REPLACE'].includes(plan.managed_store.action);
  if (plan.managed_store.action === 'BLOCKED') {
    throw new Error(
      `Managed link store already exists but is not this package version: ${plan.managed_store.destination}. `
      + 'Review it and repeat with --force only when replacement is intended.',
    );
  }
  if (!actionable.length && !storeNeedsChange) {
    return {
      ...plan,
      status: 'SKIPPED',
      targets: plan.targets.map((target) => ({ ...target, status: target.action })),
    };
  }

  const nonce = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const store = {
    destination: plan.managed_store.destination,
    staging: `${plan.managed_store.destination}.tmp-${nonce}`,
    backup: `${plan.managed_store.destination}.backup-${nonce}`,
    backupCreated: false,
    installed: false,
    changed: ['WOULD_CREATE', 'WOULD_REPLACE'].includes(plan.managed_store.action),
  };
  const transactions = [];
  try {
    if (store.changed) {
      fs.mkdirSync(path.dirname(store.destination), { recursive: true });
      fs.cpSync(source, store.staging, { recursive: true, errorOnExist: true });
      writeReceipt(store.staging, plan, null, 'managed-store');
      if (plan.managed_store.exists) {
        fs.renameSync(store.destination, store.backup);
        store.backupCreated = true;
      }
      fs.renameSync(store.staging, store.destination);
      store.installed = true;
    }

    for (const target of actionable) {
      fs.mkdirSync(target.skillsRoot, { recursive: true });
      const staging = `${target.destination}.tmp-${nonce}`;
      const backup = `${target.destination}.backup-${nonce}`;
      const relativeStore = path.relative(path.dirname(staging), store.destination) || '.';
      const linkTarget = process.platform === 'win32' ? store.destination : relativeStore;
      fs.symlinkSync(linkTarget, staging, linkType());
      transactions.push({ target, staging, backup, backupCreated: false, installed: false });
    }
    for (const transaction of transactions) {
      if (transaction.target.exists) {
        fs.renameSync(transaction.target.destination, transaction.backup);
        transaction.backupCreated = true;
      }
      fs.renameSync(transaction.staging, transaction.target.destination);
      transaction.installed = true;
    }
    for (const transaction of transactions) {
      if (transaction.backupCreated) removeExact(transaction.backup);
    }
    if (store.backupCreated) removeExact(store.backup);
  } catch (error) {
    for (const transaction of [...transactions].reverse()) {
      removeExact(transaction.staging);
      if (transaction.installed) removeExact(transaction.target.destination);
      if (transaction.backupCreated && pathExists(transaction.backup)) {
        fs.renameSync(transaction.backup, transaction.target.destination);
      }
    }
    removeExact(store.staging);
    if (store.installed) removeExact(store.destination);
    if (store.backupCreated && pathExists(store.backup)) fs.renameSync(store.backup, store.destination);
    throw error;
  }

  return {
    ...plan,
    status: 'COMPLETED',
    no_files_changed: false,
    managed_store: {
      ...plan.managed_store,
      status: plan.managed_store.action === 'REUSE'
        ? 'REUSED'
        : plan.managed_store.action === 'WOULD_REPLACE'
          ? 'REPLACED'
          : 'CREATED',
    },
    targets: plan.targets.map((target) => ({
      ...target,
      status: target.action === 'WOULD_REPLACE'
        ? 'RELINKED'
        : target.action === 'WOULD_INSTALL'
          ? 'LINKED'
          : target.action,
    })),
  };
}

function installMany(options = {}) {
  const source = validateSkillSource(options.source || SKILL_SOURCE);
  const plan = planInstallations(options);
  if (options.dryRun) {
    return {
      ...plan,
      status: plan.managed_store?.action === 'BLOCKED' ? 'BLOCKED' : 'DRY_RUN',
      no_files_changed: true,
    };
  }
  return plan.method === 'link' ? installLinks(plan, source) : installCopies(plan, source);
}

function install(options = {}) {
  const report = installMany({ ...options, agents: [options.agent || 'codex'] });
  const target = report.targets[0];
  return {
    host: target.agents[0] || 'custom',
    scope: report.scope,
    strategy: report.strategy,
    method: report.method,
    skillsRoot: target.skillsRoot,
    destination: target.destination,
    exists: target.exists,
    status: target.status || target.action,
    reason: (target.status || target.action) === 'SKIPPED' ? 'DESTINATION_EXISTS' : undefined,
  };
}

module.exports = {
  SKILL_NAME,
  SKILL_SOURCE,
  normalizeScope,
  resolveSkillsRoot,
  planInstallation,
  planInstallations,
  validateSkillSource,
  install,
  installMany,
};
