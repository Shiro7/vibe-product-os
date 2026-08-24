'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('internal alpha publication guard and identity are pinned', () => {
  const packageJson = require('../package.json');
  assert.equal(packageJson.name, 'vibe-product-os');
  assert.equal(packageJson.version, '0.1.0-alpha.0');
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.license, 'UNLICENSED');
  assert.equal(packageJson.publishConfig.tag, 'pilot');
});

test('skill and plugin scaffolds contain no unresolved placeholders', () => {
  const unfinishedScaffoldMarker = `[${'TODO'}:`;
  const files = [
    'plugins/vibe-product-os/.codex-plugin/plugin.json',
    'plugins/vibe-product-os/skills/vibe-product-os/SKILL.md',
    'plugins/vibe-product-os/skills/vibe-product-os/agents/openai.yaml',
  ];
  for (const relative of files) {
    const content = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.equal(content.includes(unfinishedScaffoldMarker), false, relative);
  }
});

test('runtime lock preserves the approved Product OS identity', () => {
  const lock = JSON.parse(fs.readFileSync(
    path.join(root, 'runtime', 'framework-runtime-lock.json'),
    'utf8',
  ));
  assert.equal(lock.framework_version, '1.0.0');
  assert.equal(lock.source_release, 'Product-OS-v1.0-rc.2');
  assert.equal(lock.external_distribution_blocker, 'AUTH-COND-001');
  assert.equal(lock.source_release_file_count, 503);
  assert.equal(lock.file_count, 504);
  assert.equal(lock.extraction_safety.digest_verified, true);
});

test('W1, W2, and W3 package governance assets are complete', () => {
  const coverage = JSON.parse(fs.readFileSync(path.join(root, 'governance/w1/Skill_Capability_and_Source_Coverage_Map.json'), 'utf8'));
  const physical = JSON.parse(fs.readFileSync(path.join(root, 'governance/w2/Artifact_to_Physical_Output_Map.json'), 'utf8'));
  const commands = JSON.parse(fs.readFileSync(path.join(root, 'governance/w3/W3_Command_Capability_Map.json'), 'utf8'));
  assert.equal(coverage.component_count, 17);
  assert.equal(coverage.components.every((item) => item.status === 'COVERED'), true);
  assert.equal(physical.artifact_count, 281);
  assert.equal(new Set(physical.entries.map((item) => item.artifact_id)).size, 281);
  assert.equal(commands.command_count, 3);
  assert.deepEqual(commands.commands.map((item) => item.command), ['status', 'update', 'verify-release']);
  assert.equal(commands.focused_test_count, 18);
});
