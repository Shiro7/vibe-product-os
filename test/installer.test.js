'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { install, planInstallation } = require('../lib/installer');

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
