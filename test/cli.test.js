'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cli = path.resolve(__dirname, '..', 'bin', 'vibe-product-os.js');

test('version reports package and framework identities separately', () => {
  const result = spawnSync(process.execPath, [cli, 'version', '--json'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const identity = JSON.parse(result.stdout);
  assert.equal(identity.package, 'vibe-product-os');
  assert.equal(identity.package_version, '0.1.0-pilot.0');
  assert.equal(identity.framework_version, '1.0.0');
  assert.equal(identity.framework_signature_condition, 'AUTH-COND-001_CLOSED');
  assert.equal(identity.key_continuity_condition, 'AUTH-COND-004_CLOSED');
  assert.equal(identity.public_channel_status, 'ACTIVE_VERIFIED');
  assert.equal(identity.release_authority_decision, 'AUTH-DEC-002_APPROVED');
  assert.equal(identity.external_distribution_blocker, 'PACKAGE_RELEASE_SIGNATURES_PENDING');
  assert.deepEqual(identity.external_distribution_blockers, [
    'PACKAGE_RELEASE_SIGNATURES_PENDING',
  ]);
});

test('non-interactive install requires explicit consent and scope', () => {
  const result = spawnSync(process.execPath, [cli, 'install', '.'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /requires explicit --yes consent/);
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
