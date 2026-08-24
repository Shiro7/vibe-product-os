'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { updateProject } = require('../lib/updater');
const runtime = require('../lib/runtime');

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'bin', 'vibe-product-os.js');
const now = '2026-08-24T12:34:56.000Z';

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function initialize() {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'vpo-update-'));
  const result = spawnSync(process.execPath, [
    cli, 'init', '--project-id', 'UPDATE-PROJECT', '--project-name', 'Update Project',
    '--profile', 'P2', '--topology', 'FRAMEWORK_PLUS_PROJECT', '--target', project, '--apply', '--json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return project;
}

test('update dry-run detects lock migration and writes nothing', () => {
  const project = initialize();
  try {
    const lock = path.join(project, '.product-os/framework.lock.yaml');
    const before = fs.readFileSync(lock, 'utf8');
    const report = updateProject({ project, now });
    assert.equal(report.status, 'UPDATE_AVAILABLE');
    assert.equal(report.no_files_changed, true);
    assert.equal(report.planned_changes.some((item) => item.kind === 'FRAMEWORK_LOCK_REPLACE'), true);
    assert.equal(fs.readFileSync(lock, 'utf8'), before);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('update apply requires authority and change references', () => {
  const project = initialize();
  try {
    assert.throws(
      () => updateProject({ project, now, apply: true }),
      (error) => error.exitCode === 4 && /blocked/u.test(error.message),
    );
    assert.equal(fs.existsSync(path.join(project, `.product-os/state/update-backups/UPDATE-20260824123456`)), false);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('update repairs catalog drift, pins rc.2, and creates a verified rollback backup', () => {
  const project = initialize();
  try {
    const catalog = path.join(project, '.product-os/state/catalogs/artifact-catalog.json');
    const canonical = path.join(runtime.FRAMEWORK_ROOT, 'catalogs/artifact-catalog.json');
    fs.writeFileSync(catalog, `${fs.readFileSync(catalog, 'utf8')}\n`, 'utf8');
    assert.notEqual(sha256(catalog), sha256(canonical));
    const dryRun = updateProject({ project, now });
    assert.equal(dryRun.planned_changes.some((item) => item.relative_path.endsWith('artifact-catalog.json')), true);

    const applied = updateProject({
      project, now, apply: true,
      authorityRef: 'GOV-001#framework-update-authority',
      changeRef: 'GOV-007#CHANGE-UPDATE-001',
    });
    assert.equal(applied.status, 'APPLIED');
    assert.equal(applied.applied, true);
    assert.equal(sha256(catalog), sha256(canonical));
    const lockText = fs.readFileSync(path.join(project, '.product-os/framework.lock.yaml'), 'utf8');
    assert.match(lockText, /framework_source_revision: "Product-OS-v1.0-rc.2"/u);
    assert.equal(fs.existsSync(path.join(project, applied.backup_path, 'backup-manifest.json')), true);

    const currentLock = fs.readFileSync(path.join(project, '.product-os/framework.lock.yaml'), 'utf8');
    const upToDate = updateProject({ project, now: '2026-08-24T12:35:56.000Z', apply: true });
    assert.equal(upToDate.status, 'UP_TO_DATE');
    assert.equal(upToDate.no_files_changed, true);
    assert.equal(fs.readFileSync(path.join(project, '.product-os/framework.lock.yaml'), 'utf8'), currentLock);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('rollback restores exact pre-update bytes and refuses ungoverned mutation', () => {
  const project = initialize();
  try {
    const lock = path.join(project, '.product-os/framework.lock.yaml');
    const before = fs.readFileSync(lock);
    const applied = updateProject({
      project, now, apply: true,
      authorityRef: 'GOV-001#framework-update-authority',
      changeRef: 'GOV-007#CHANGE-UPDATE-002',
    });
    const preview = updateProject({ project, rollback: applied.update_id, now });
    assert.equal(preview.status, 'ROLLBACK_AVAILABLE');
    assert.equal(preview.no_files_changed, true);
    assert.throws(
      () => updateProject({ project, rollback: applied.update_id, now, apply: true }),
      (error) => error.exitCode === 4,
    );
    const rollback = updateProject({
      project, rollback: applied.update_id, now, apply: true,
      authorityRef: 'GOV-001#framework-update-authority',
      changeRef: 'GOV-007#CHANGE-ROLLBACK-001',
    });
    assert.equal(rollback.status, 'ROLLED_BACK');
    assert.deepEqual(fs.readFileSync(lock), before);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('rollback blocks when a post-update file changed', () => {
  const project = initialize();
  try {
    const applied = updateProject({
      project, now, apply: true,
      authorityRef: 'GOV-001#framework-update-authority',
      changeRef: 'GOV-007#CHANGE-UPDATE-003',
    });
    const lock = path.join(project, '.product-os/framework.lock.yaml');
    fs.writeFileSync(lock, `${fs.readFileSync(lock, 'utf8')}\n`, 'utf8');
    const preview = updateProject({ project, rollback: applied.update_id, now });
    assert.equal(preview.status, 'BLOCKED');
    assert.equal(preview.blockers.some((item) => item.code === 'UPDATE-RBK-002'), true);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('update refuses a backup directory that resolves through a symlink', () => {
  const project = initialize();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'vpo-update-outside-'));
  try {
    const backupParent = path.join(project, '.product-os/state/update-backups');
    fs.symlinkSync(outside, backupParent);
    assert.throws(() => updateProject({
      project, now, apply: true,
      authorityRef: 'GOV-001#framework-update-authority',
      changeRef: 'GOV-007#CHANGE-UPDATE-SYMLINK',
    }), /symlink/u);
    assert.deepEqual(fs.readdirSync(outside), []);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});
