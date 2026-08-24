'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cli = path.resolve(__dirname, '..', 'bin', 'vibe-product-os.js');

test('version reports package and framework identities separately', () => {
  const result = spawnSync(process.execPath, [cli, 'version', '--json'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const identity = JSON.parse(result.stdout);
  assert.equal(identity.package, 'vibe-product-os');
  assert.equal(identity.package_version, '0.1.0-pilot.1');
  assert.equal(identity.framework_version, '1.0.0');
  assert.equal(identity.framework_signature_condition, 'AUTH-COND-001_CLOSED');
  assert.equal(identity.key_continuity_condition, 'AUTH-COND-004_CLOSED');
  assert.equal(identity.public_channel_status, 'ACTIVE_VERIFIED');
  assert.equal(identity.release_authority_decision, 'AUTH-DEC-003_PROPOSED');
  assert.equal(identity.release_authority_status, 'PROPOSED_PENDING_AUTHORITY_CONFIRMATION');
  assert.equal(identity.external_distribution_blocker, 'EXACT_CHANNEL_AUTHORITY_DECISION_PENDING');
  assert.deepEqual(identity.external_distribution_blockers, [
    'EXACT_CHANNEL_AUTHORITY_DECISION_PENDING',
  ]);
});

test('non-interactive install requires explicit consent and scope', () => {
  const result = spawnSync(process.execPath, [cli, 'install', '.'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /requires explicit --yes consent/);
});

test('non-interactive multi-agent dry-run resolves paths and writes nothing', () => {
  const project = path.join(os.tmpdir(), `vpo-cli-dry-${process.pid}-${Date.now()}`);
  const result = spawnSync(process.execPath, [
    cli, 'install', project, '--scope', 'project', '--agents', 'codex,claude,gemini',
    '--strategy', 'shared', '--method', 'link', '--dry-run', '--json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'DRY_RUN');
  assert.equal(report.targets.length, 2);
  assert.equal(report.managed_store.action, 'WOULD_CREATE');
  assert.equal(fs.existsSync(project), false);
});

test('targets reports all supported agents, official guides, and deduplicated plans', () => {
  const result = spawnSync(process.execPath, [
    cli, 'targets', '.', '--scope', 'project', '--agents', 'all', '--json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.agents.length, 9);
  assert.equal(report.agents.every((agent) => agent.official_docs.startsWith('https://')), true);
  assert.equal(report.plans.project.targets.length, 3);
});

test('compose fails closed when the Product OS control plane is absent', () => {
  const result = spawnSync(process.execPath, [cli, 'compose'], { encoding: 'utf8' });
  assert.equal(result.status, 4);
  assert.match(result.stderr, /Required initialized Product OS control is missing/);
});

test('existing Product OS help is available through the adapter', () => {
  const result = spawnSync(process.execPath, [cli, 'init', '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Product OS Automation/);
  assert.match(result.stdout, /validate/);
});
