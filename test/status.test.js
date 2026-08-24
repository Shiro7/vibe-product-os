'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { projectStatus } = require('../lib/status');
const { composeProject } = require('../lib/composer');
const { updateProject } = require('../lib/updater');

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'bin', 'vibe-product-os.js');

function initialize() {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'vpo-status-'));
  const result = spawnSync(process.execPath, [
    cli, 'init', '--project-id', 'STATUS-PROJECT', '--project-name', 'Status Project',
    '--profile', 'P2', '--topology', 'FRAMEWORK_PLUS_PROJECT', '--target', project, '--apply', '--json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return project;
}

test('status reports initialized project identity without writing files', () => {
  const project = initialize();
  try {
    const before = fs.readFileSync(path.join(project, 'product-os.yaml'), 'utf8');
    const report = projectStatus({ project });
    assert.equal(report.command, 'status');
    assert.equal(report.project.project_id, 'STATUS-PROJECT');
    assert.equal(report.project.profile, 'P2');
    assert.deepEqual(report.project.active_phases, ['PHASE-00']);
    assert.equal(report.artifacts.registered, 0);
    assert.equal(report.framework.identity_match, true);
    assert.equal(report.framework.source_identity_match, false);
    assert.equal(report.findings.some((item) => item.code === 'STATUS-FWK-002'), true);
    assert.equal(report.no_files_changed, true);
    assert.equal(report.approval_claim, 'NONE');
    assert.equal(fs.readFileSync(path.join(project, 'product-os.yaml'), 'utf8'), before);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('status confirms exact rc.2 source and catalog identities after governed update', () => {
  const project = initialize();
  try {
    updateProject({
      project,
      now: '2026-08-24T12:00:00.000Z',
      apply: true,
      authorityRef: 'GOV-001#framework-update-authority',
      changeRef: 'GOV-007#CHANGE-STATUS-001',
    });
    const report = projectStatus({ project });
    assert.equal(report.framework.identity_match, true);
    assert.equal(report.framework.source_identity_match, true);
    assert.equal(report.framework.catalog_snapshots_match, true);
    assert.equal(report.findings.some((item) => ['STATUS-FWK-002', 'STATUS-CAT-001'].includes(item.code)), false);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('status reconciles composed artifacts, packages, paths, and pending applicability', () => {
  const project = initialize();
  try {
    composeProject({ project, phases: ['00'], now: '2026-08-24T12:00:00.000Z', apply: true });
    const report = projectStatus({ project });
    assert.equal(report.artifacts.registered, 16);
    assert.equal(report.artifacts.by_applicability.APPLICABLE, 13);
    assert.equal(report.artifacts.by_applicability.PENDING, 3);
    assert.equal(report.artifacts.materialized, 13);
    assert.equal(report.composition.packages, 7);
    assert.equal(report.summary.errors, 0);
    assert.equal(report.summary.result, 'PASS_WITH_ATTENTION');
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('status detects a missing path that GOV-002 claims is available', () => {
  const project = initialize();
  try {
    const applied = composeProject({ project, phases: ['00'], now: '2026-08-24T12:00:00.000Z', apply: true });
    const target = path.join(project, applied.created_files[0]);
    fs.rmSync(target);
    const report = projectStatus({ project });
    assert.equal(report.summary.result, 'FAIL');
    assert.equal(report.findings.some((item) => item.code === 'STATUS-PATH-002'), true);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('status rejects a canonical artifact locator that resolves through a symlink', () => {
  const project = initialize();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'vpo-status-outside-'));
  try {
    const applied = composeProject({ project, phases: ['00'], now: '2026-08-24T12:00:00.000Z', apply: true });
    const target = path.join(project, applied.created_files[0]);
    const outsideFile = path.join(outside, 'outside.md');
    fs.writeFileSync(outsideFile, fs.readFileSync(target));
    fs.rmSync(target);
    fs.symlinkSync(outsideFile, target);
    const report = projectStatus({ project });
    assert.equal(report.summary.result, 'FAIL');
    assert.equal(report.findings.some((item) => item.code === 'STATUS-PATH-004'), true);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test('status CLI supports strict non-zero attention mode', () => {
  const project = initialize();
  try {
    composeProject({ project, phases: ['00'], now: '2026-08-24T12:00:00.000Z', apply: true });
    const result = spawnSync(process.execPath, [cli, 'status', '--project', project, '--strict', '--json'], { encoding: 'utf8' });
    assert.equal(result.status, 1, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.summary.result, 'PASS_WITH_ATTENTION');
    assert.equal(report.no_files_changed, true);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});
