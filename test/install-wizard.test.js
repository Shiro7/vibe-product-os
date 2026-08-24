'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { planInstallations } = require('../lib/installer');
const {
  formatInstallationPlan,
  parseAgentSelection,
  parseMethodChoice,
  parseScopeChoice,
  parseStrategyChoice,
} = require('../lib/install-wizard');

test('wizard choices accept numbers, names, groups, and custom target selection', () => {
  assert.equal(parseScopeChoice('2'), 'user');
  assert.equal(parseStrategyChoice('1'), 'shared');
  assert.equal(parseMethodChoice('2'), 'link');
  assert.deepEqual(parseAgentSelection('1,claude,other,10'), {
    agents: ['codex', 'claude', 'opencode', 'cline', 'zed'],
    wantsCustom: true,
  });
});

test('wizard preview exposes exact paths, actions, ownership, and link store', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vpo-wizard-'));
  try {
    const plan = planInstallations({
      cwd: path.join(root, 'project'),
      home: path.join(root, 'home'),
      scope: 'project',
      agents: ['codex', 'claude', 'gemini'],
      strategy: 'shared',
      method: 'link',
    });
    const rendered = formatInstallationPlan(plan);
    assert.match(rendered, /Installation preview/u);
    assert.match(rendered, /Managed store:/u);
    assert.match(rendered, /OpenAI Codex, Gemini CLI/u);
    assert.match(rendered, /Claude Code/u);
    assert.match(rendered, /WOULD_INSTALL/u);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
