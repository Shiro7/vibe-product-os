'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { install, installMany, planInstallation, planInstallations } = require('../lib/installer');
const {
  agentCatalog,
  normalizeAgentIds,
  resolveAgentSkillsRoot,
} = require('../lib/agent-targets');

function temporaryRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-product-os-install-'));
}

test('plans official repository and user Codex skill locations', () => {
  const root = temporaryRoot();
  try {
    const project = path.join(root, 'project');
    const home = path.join(root, 'home');
    assert.equal(
      planInstallation({ cwd: project, home, scope: 'project' }).destination,
      path.join(project, '.agents', 'skills', 'vibe-product-os'),
    );
    assert.equal(
      planInstallation({ cwd: project, home, scope: 'user' }).destination,
      path.join(home, '.agents', 'skills', 'vibe-product-os'),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('dry-run writes nothing and install writes a receipt', () => {
  const root = temporaryRoot();
  try {
    const project = path.join(root, 'project');
    const preview = install({ cwd: project, scope: 'project', dryRun: true });
    assert.equal(preview.status, 'WOULD_INSTALL');
    assert.equal(fs.existsSync(path.join(project, '.agents')), false);

    const result = install({ cwd: project, scope: 'project' });
    assert.equal(result.status, 'INSTALLED');
    assert.ok(fs.existsSync(path.join(result.destination, 'SKILL.md')));
    const receipt = JSON.parse(fs.readFileSync(
      path.join(result.destination, '.vibe-product-os-install.json'),
      'utf8',
    ));
    assert.equal(receipt.package, 'vibe-product-os');
    assert.equal(receipt.framework_version, '1.0.0');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('existing installation is preserved unless force is explicit', () => {
  const root = temporaryRoot();
  try {
    const project = path.join(root, 'project');
    const first = install({ cwd: project, scope: 'project' });
    const sentinel = path.join(first.destination, 'preserve.txt');
    fs.writeFileSync(sentinel, 'preserve me\n', 'utf8');

    const skipped = install({ cwd: project, scope: 'project' });
    assert.equal(skipped.status, 'SKIPPED');
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'preserve me\n');

    const replaced = install({ cwd: project, scope: 'project', force: true });
    assert.equal(replaced.status, 'REPLACED');
    assert.equal(fs.existsSync(sentinel), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('agent registry pins official native Skill roots for every supported host', () => {
  const root = temporaryRoot();
  try {
    const project = path.join(root, 'project');
    const home = path.join(root, 'home');
    const expected = {
      codex: ['.agents/skills', '.agents/skills'],
      claude: ['.claude/skills', '.claude/skills'],
      gemini: ['.gemini/skills', '.gemini/skills'],
      copilot: ['.github/skills', '.copilot/skills'],
      cursor: ['.cursor/skills', '.cursor/skills'],
      windsurf: ['.windsurf/skills', '.codeium/windsurf/skills'],
      opencode: ['.opencode/skills', '.config/opencode/skills'],
      cline: ['.cline/skills', '.cline/skills'],
      zed: ['.agents/skills', '.agents/skills'],
    };
    assert.deepEqual(agentCatalog().map((agent) => agent.id), Object.keys(expected));
    for (const [agent, [projectRoot, userRoot]] of Object.entries(expected)) {
      assert.equal(
        resolveAgentSkillsRoot(agent, { cwd: project, home, scope: 'project', strategy: 'native' }).skillsRoot,
        path.join(project, ...projectRoot.split('/')),
      );
      assert.equal(
        resolveAgentSkillsRoot(agent, { cwd: project, home, scope: 'user', strategy: 'native' }).skillsRoot,
        path.join(home, ...userRoot.split('/')),
      );
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('shared layout deduplicates compatible agents and falls back to native-only paths', () => {
  const root = temporaryRoot();
  try {
    const plan = planInstallations({
      cwd: path.join(root, 'project'),
      home: path.join(root, 'home'),
      scope: 'project',
      agents: ['all'],
      strategy: 'shared',
    });
    assert.equal(plan.requested_agents.length, 9);
    assert.equal(plan.targets.length, 3);
    assert.equal(plan.deduplicated_agent_target_count, 6);
    assert.deepEqual(plan.targets[0].agents, [
      'codex', 'gemini', 'copilot', 'cursor', 'windsurf', 'opencode', 'zed',
    ]);
    assert.deepEqual(plan.targets.slice(1).map((target) => target.agents[0]), ['claude', 'cline']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('plans show filesystem-linked physical destinations and reject nested custom targets', () => {
  const root = temporaryRoot();
  try {
    const project = path.join(root, 'project');
    const physicalAgents = path.join(root, 'physical-agents');
    fs.mkdirSync(project, { recursive: true });
    fs.mkdirSync(physicalAgents, { recursive: true });
    fs.symlinkSync(physicalAgents, path.join(project, '.agents'), 'dir');
    const plan = planInstallations({ cwd: project, scope: 'project', agents: ['codex'] });
    assert.equal(plan.targets[0].through_filesystem_link, true);
    assert.equal(
      plan.targets[0].physical_destination,
      path.join(fs.realpathSync(physicalAgents), 'skills', 'vibe-product-os'),
    );
    assert.throws(() => planInstallations({
      cwd: project,
      scope: 'project',
      agents: ['codex'],
      customRoots: ['.agents/skills/vibe-product-os/nested-skills'],
    }), /may not contain one another/u);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('multi-agent copy installation is atomic by destination and records shared ownership', () => {
  const root = temporaryRoot();
  try {
    const project = path.join(root, 'project');
    const result = installMany({
      cwd: project,
      scope: 'project',
      agents: ['codex', 'claude', 'gemini'],
      strategy: 'shared',
      method: 'copy',
    });
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.targets.length, 2);
    assert.deepEqual(result.targets.map((target) => target.status), ['INSTALLED', 'INSTALLED']);
    const sharedReceipt = JSON.parse(fs.readFileSync(
      path.join(project, '.agents/skills/vibe-product-os/.vibe-product-os-install.json'),
      'utf8',
    ));
    assert.deepEqual(sharedReceipt.agents, ['codex', 'gemini']);
    assert.equal(sharedReceipt.method, 'copy');
    assert.ok(fs.existsSync(path.join(project, '.claude/skills/vibe-product-os/SKILL.md')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('multi-agent copy staging failure preserves every existing destination', () => {
  const root = temporaryRoot();
  try {
    const project = path.join(root, 'project');
    const first = installMany({
      cwd: project,
      scope: 'project',
      agents: ['codex'],
      strategy: 'shared',
    });
    const sentinel = path.join(first.targets[0].destination, 'preserve.txt');
    fs.writeFileSync(sentinel, 'original\n', 'utf8');
    fs.writeFileSync(path.join(project, '.claude'), 'not a directory\n', 'utf8');
    assert.throws(() => installMany({
      cwd: project,
      scope: 'project',
      agents: ['codex', 'claude'],
      strategy: 'shared',
      force: true,
    }));
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'original\n');
    assert.equal(fs.existsSync(path.join(project, '.claude/skills/vibe-product-os')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('link installation persists one managed store and creates reusable agent links', () => {
  const root = temporaryRoot();
  try {
    const project = path.join(root, 'project');
    const result = installMany({
      cwd: project,
      scope: 'project',
      agents: ['codex', 'claude', 'gemini'],
      strategy: 'native',
      method: 'link',
    });
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.managed_store.status, 'CREATED');
    assert.ok(fs.existsSync(path.join(result.managed_store.destination, 'SKILL.md')));
    for (const target of result.targets) {
      assert.equal(fs.lstatSync(target.destination).isSymbolicLink(), true);
      assert.equal(fs.realpathSync(target.destination), fs.realpathSync(result.managed_store.destination));
    }
    const second = installMany({
      cwd: project,
      scope: 'project',
      agents: ['codex', 'claude', 'gemini'],
      strategy: 'native',
      method: 'link',
    });
    assert.equal(second.status, 'SKIPPED');
    assert.equal(second.managed_store.action, 'REUSE');
    assert.equal(second.targets.every((target) => target.status === 'ALREADY_LINKED'), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('link installation refuses a tampered managed store without force', () => {
  const root = temporaryRoot();
  try {
    const project = path.join(root, 'project');
    const first = installMany({
      cwd: project,
      scope: 'project',
      agents: ['codex'],
      method: 'link',
    });
    fs.appendFileSync(path.join(first.managed_store.destination, 'SKILL.md'), '\nTampered\n', 'utf8');
    const preview = installMany({
      cwd: project,
      scope: 'project',
      agents: ['codex'],
      method: 'link',
      dryRun: true,
    });
    assert.equal(preview.status, 'BLOCKED');
    assert.equal(preview.managed_store.action, 'BLOCKED');
    assert.throws(() => installMany({
      cwd: project,
      scope: 'project',
      agents: ['codex'],
      method: 'link',
    }), /Managed link store already exists/u);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('dry-run supports aliases and custom roots without writing', () => {
  const root = temporaryRoot();
  try {
    const project = path.join(root, 'project');
    assert.deepEqual(normalizeAgentIds(['cloude', 'github', 'other']), [
      'claude', 'copilot', 'opencode', 'cline', 'zed',
    ]);
    const result = installMany({
      cwd: project,
      scope: 'project',
      agents: [],
      customRoots: ['custom-skills'],
      dryRun: true,
    });
    assert.equal(result.status, 'DRY_RUN');
    assert.equal(result.targets[0].destination, path.join(project, 'custom-skills', 'vibe-product-os'));
    assert.equal(fs.existsSync(project), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
