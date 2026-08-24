'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { verifyRelease } = require('../lib/release-verifier');

const cli = path.resolve(__dirname, '..', 'bin', 'vibe-product-os.js');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vpo-release-'));
  const subject = Buffer.from('immutable release bytes\n', 'utf8');
  fs.writeFileSync(path.join(root, 'package.tgz'), subject);
  const manifest = {
    manifest_id: 'TEST-RELEASE-MANIFEST', manifest_version: '1.0.0', release_root: '.',
    package: 'vibe-product-os', package_version: '0.1.0-alpha.0', framework_release: '1.0.0',
    source_release: 'Product-OS-v1.0-rc.2',
    subjects: [{
      subject_id: 'NPM-TARBALL', path: 'package.tgz', size_bytes: subject.length,
      digest_algorithm: 'sha256', sha256: crypto.createHash('sha256').update(subject).digest('hex'),
      signature_path: null, public_key_path: null,
    }],
  };
  const manifestPath = path.join(root, 'release-verification-manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return { root, manifest, manifestPath };
}

test('verify-release proves exact bytes without claiming publisher identity or changing files', () => {
  const item = fixture();
  try {
    const before = fs.readFileSync(item.manifestPath, 'utf8');
    const report = verifyRelease({ manifest: item.manifestPath });
    assert.equal(report.result, 'PASS');
    assert.equal(report.byte_identity, 'VERIFIED');
    assert.equal(report.publisher_identity, 'NOT_VERIFIED');
    assert.equal(report.external_distribution_authorized, false);
    assert.equal(report.no_files_changed, true);
    assert.equal(fs.readFileSync(item.manifestPath, 'utf8'), before);
  } finally { fs.rmSync(item.root, { recursive: true, force: true }); }
});

test('verify-release fails on subject tampering', () => {
  const item = fixture();
  try {
    fs.appendFileSync(path.join(item.root, 'package.tgz'), 'tampered');
    const report = verifyRelease({ manifest: item.manifestPath });
    assert.equal(report.result, 'FAIL');
    assert.equal(report.byte_identity, 'FAILED');
    assert.equal(report.exit_code, 5);
  } finally { fs.rmSync(item.root, { recursive: true, force: true }); }
});

test('verify-release requires every detached signature when requested', () => {
  const item = fixture();
  try {
    const result = spawnSync(process.execPath, [cli, 'verify-release', '--manifest', item.manifestPath, '--require-signatures', '--json'], { encoding: 'utf8' });
    assert.equal(result.status, 5, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.byte_identity, 'VERIFIED');
    assert.equal(report.publisher_identity, 'NOT_VERIFIED');
  } finally { fs.rmSync(item.root, { recursive: true, force: true }); }
});

test('verify-release fails closed when signature configuration is incomplete', () => {
  const item = fixture();
  try {
    item.manifest.subjects[0].signature_path = 'package.tgz.minisig';
    fs.writeFileSync(item.manifestPath, `${JSON.stringify(item.manifest, null, 2)}\n`, 'utf8');
    const report = verifyRelease({ manifest: item.manifestPath });
    assert.equal(report.result, 'FAIL');
    assert.equal(report.subjects[0].signature_identity, 'INCOMPLETE_CONFIGURATION');
  } finally { fs.rmSync(item.root, { recursive: true, force: true }); }
});

test('verify-release rejects paths outside the manifest directory', () => {
  const item = fixture();
  try {
    item.manifest.subjects[0].path = '../package.tgz';
    fs.writeFileSync(item.manifestPath, `${JSON.stringify(item.manifest, null, 2)}\n`, 'utf8');
    assert.throws(() => verifyRelease({ manifest: item.manifestPath }), (error) => error.exitCode === 5 && /single file name/u.test(error.message));
  } finally { fs.rmSync(item.root, { recursive: true, force: true }); }
});

test('verify-release fails closed if configured Minisign verification cannot start', () => {
  const item = fixture();
  try {
    fs.writeFileSync(path.join(item.root, 'package.tgz.minisig'), 'not a signature\n');
    fs.writeFileSync(path.join(item.root, 'minisign.pub'), 'not a public key\n');
    item.manifest.subjects[0].signature_path = 'package.tgz.minisig';
    item.manifest.subjects[0].public_key_path = 'minisign.pub';
    fs.writeFileSync(item.manifestPath, `${JSON.stringify(item.manifest, null, 2)}\n`, 'utf8');
    const report = verifyRelease({ manifest: item.manifestPath, minisignCommand: path.join(item.root, 'missing-minisign') });
    assert.equal(report.result, 'FAIL');
    assert.equal(report.subjects[0].signature_identity, 'TOOL_UNAVAILABLE');
  } finally { fs.rmSync(item.root, { recursive: true, force: true }); }
});
