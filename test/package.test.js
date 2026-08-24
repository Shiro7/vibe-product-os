'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('publication-preparation pilot metadata and identity are pinned', () => {
  const packageJson = require('../package.json');
  assert.equal(packageJson.name, 'vibe-product-os');
  assert.equal(packageJson.version, '0.1.0-pilot.0');
  assert.notEqual(packageJson.private, true);
  assert.equal(packageJson.license, 'Apache-2.0');
  assert.equal(packageJson.publishConfig.access, 'public');
  assert.equal(packageJson.publishConfig.tag, 'pilot');
  assert.equal(packageJson.homepage, 'https://github.com/Shiro7/vibe-product-os#readme');
  assert.equal(packageJson.bugs.url, 'https://github.com/Shiro7/vibe-product-os/issues');
  assert.equal(packageJson.files.includes('dist/'), false);
  assert.equal(packageJson.files.includes('NOTICE'), true);
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
  assert.equal(lock.framework_signature_condition, 'AUTH-COND-001_CLOSED');
  assert.equal(lock.key_continuity_condition, 'AUTH-COND-004_CLOSED');
  assert.equal(lock.external_distribution_blocker, 'PACKAGE_RELEASE_SIGNATURES_PENDING');
  assert.deepEqual(lock.external_distribution_blockers, [
    'PACKAGE_RELEASE_SIGNATURES_PENDING',
  ]);
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
  assert.equal(commands.focused_test_count, 20);
  assert.deepEqual(commands.open_release_controls, [
    'PACKAGE_RELEASE_SIGNATURES_PENDING',
  ]);
});

test('public repository and support/security channel activation evidence is pinned', () => {
  const authority = JSON.parse(fs.readFileSync(
    path.join(root, 'governance/authority/authority-state-snapshot.json'),
    'utf8',
  ));
  const activation = JSON.parse(fs.readFileSync(
    path.join(root, 'governance/authority/PUBLIC_CHANNEL_ACTIVATION_EVIDENCE_2026-08-25.json'),
    'utf8',
  ));
  assert.equal(authority.package_publication_policy.repository_visibility, 'PUBLIC_ACTIVE_HISTORY_REVIEW_COMPLETE');
  assert.equal(authority.package_publication_policy.support_status, 'ACTIVE_VERIFIED_PUBLIC');
  assert.equal(authority.package_publication_policy.security_status, 'ACTIVE_VERIFIED_PRIVATE_REPORTING');
  assert.equal(authority.package_publication_policy.release_decision_id, 'AUTH-DEC-002');
  assert.equal(authority.package_publication_policy.npm_package, 'vibe-product-os@0.1.0-pilot.0');
  assert.equal(authority.package_publication_policy.npm_access, 'public');
  assert.equal(authority.package_publication_policy.npm_tag, 'pilot');
  assert.equal(activation.authority_decision, 'AUTH-DEC-001');
  assert.deepEqual(activation.remaining_publication_controls, [
    'PACKAGE_RELEASE_SIGNATURES_PENDING',
    'EXACT_CHANNEL_AUTHORITY_DECISION_PENDING',
  ]);
});
