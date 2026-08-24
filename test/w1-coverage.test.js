'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const runtime = require('../lib/runtime');

const root = path.resolve(__dirname, '..');
const skillRoot = path.join(root, 'plugins', 'vibe-product-os', 'skills', 'vibe-product-os');
const map = JSON.parse(fs.readFileSync(
  path.join(root, 'governance', 'w1', 'Skill_Capability_and_Source_Coverage_Map.json'),
  'utf8',
));

test('W1 covers all 17 canonical release components exactly once', () => {
  const canonical = JSON.parse(fs.readFileSync(
    path.join(runtime.OUTPUTS_ROOT, 'Product_OS_v1.0_Final', 'config', 'release-component-catalog.json'),
    'utf8',
  ));
  assert.equal(map.component_count, 17);
  assert.equal(map.components.length, 17);
  assert.deepEqual(
    map.components.map((entry) => entry.component_id).sort(),
    canonical.components.map((entry) => entry.component_id).sort(),
  );
  assert.equal(new Set(map.components.map((entry) => entry.component_id)).size, 17);
});

test('every declared W1 source, Skill route, and runtime command is real', () => {
  const commandCatalog = JSON.parse(fs.readFileSync(
    path.join(runtime.AUTOMATION_ROOT, 'config', 'command-catalog.json'),
    'utf8',
  ));
  const commands = new Set(commandCatalog.commands.map((entry) => entry.command));
  for (const entry of map.components) {
    assert.equal(entry.status, 'COVERED', entry.component_id);
    assert.ok(fs.existsSync(path.join(runtime.FRAMEWORK_RELEASE_ROOT, entry.source_entry_point)), entry.source_entry_point);
    assert.ok(entry.authority_limit.length > 30, entry.component_id);
    for (const route of entry.skill_routes) assert.ok(fs.existsSync(path.join(skillRoot, route)), route);
    for (const command of entry.runtime_commands) assert.ok(commands.has(command), `${entry.component_id}: ${command}`);
  }
});

test('all formal operational modes have source-backed coverage', () => {
  const covered = new Set(map.components.flatMap((entry) => entry.operational_modes));
  for (const mode of map.operational_modes) assert.ok(covered.has(mode), mode);
});

test('W1 runtime identity is pinned to the verified complete release', () => {
  const lock = JSON.parse(fs.readFileSync(runtime.RUNTIME_LOCK, 'utf8'));
  assert.equal(lock.source_release, map.framework.source_release);
  assert.equal(lock.source_release_archive_sha256, map.framework.archive_sha256);
  assert.equal(lock.source_release_file_count, 503);
  assert.equal(lock.file_count, 504);
  assert.equal(lock.extraction_safety.digest_verified, true);
  assert.equal(lock.extraction_safety.traversal_entries_rejected, true);
});
