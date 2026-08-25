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
    package: 'vibe-product-os', package_version: '0.1.0-pilot.0', framework_release: '1.0.0',
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

test('verify-release rejects incomplete manifest signature configuration', () => {
  const item = fixture();
  try {
    item.manifest.manifest_signature_path = 'release-verification-manifest.json.minisig';
    fs.writeFileSync(item.manifestPath, `${JSON.stringify(item.manifest, null, 2)}\n`, 'utf8');
    assert.throws(() => verifyRelease({ manifest: item.manifestPath }), /Manifest signature configuration is incomplete/u);
  } finally { fs.rmSync(item.root, { recursive: true, force: true }); }
});

test('verify-release requires and verifies the manifest plus every subject signature', () => {
  const item = fixture();
  try {
    const fakeMinisign = path.join(item.root, 'fake-minisign');
    fs.writeFileSync(fakeMinisign, '#!/bin/sh\nexit 0\n', { mode: 0o700 });
    fs.writeFileSync(path.join(item.root, 'product-os-authority.pub'), 'test public key\n');
    fs.writeFileSync(path.join(item.root, 'package.tgz.minisig'), 'test subject signature\n');
    item.manifest.subjects[0].signature_path = 'package.tgz.minisig';
    item.manifest.subjects[0].public_key_path = 'product-os-authority.pub';
    item.manifest.manifest_signature_path = 'release-verification-manifest.json.minisig';
    item.manifest.manifest_public_key_path = 'product-os-authority.pub';
    item.manifest.package_release_controls = [{
      control_id: 'EXACT_CHANNEL_AUTHORITY_DECISION',
      status: 'APPROVED',
      authority_ref: 'AUTH-DEC-999',
      value: 'npm public / pilot+latest / vibe-product-os@0.1.0-pilot.0',
    }];
    fs.writeFileSync(item.manifestPath, `${JSON.stringify(item.manifest, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(item.root, 'release-verification-manifest.json.minisig'), 'test manifest signature\n');
    const expectedPublicKeySha256 = crypto.createHash('sha256').update('test public key\n').digest('hex');
    const report = verifyRelease({
      manifest: item.manifestPath,
      requireSignatures: true,
      minisignCommand: fakeMinisign,
      expectedPublicKeySha256,
    });
    assert.equal(report.result, 'PASS');
    assert.equal(report.publisher_identity, 'VERIFIED');
    assert.equal(report.manifest_signature_identity, 'VERIFIED');
    assert.equal(report.subjects[0].signature_identity, 'VERIFIED');
    assert.equal(report.exact_channel_authority_decision, 'AUTH-DEC-999');
    assert.equal(report.external_distribution_authorized, true);
  } finally { fs.rmSync(item.root, { recursive: true, force: true }); }
});

test('verify-release rejects signatures made with a substituted public key', () => {
  const item = fixture();
  try {
    const fakeMinisign = path.join(item.root, 'fake-minisign');
    fs.writeFileSync(fakeMinisign, '#!/bin/sh\nexit 0\n', { mode: 0o700 });
    fs.writeFileSync(path.join(item.root, 'product-os-authority.pub'), 'substituted public key\n');
    fs.writeFileSync(path.join(item.root, 'package.tgz.minisig'), 'test subject signature\n');
    item.manifest.subjects[0].signature_path = 'package.tgz.minisig';
    item.manifest.subjects[0].public_key_path = 'product-os-authority.pub';
    item.manifest.manifest_signature_path = 'release-verification-manifest.json.minisig';
    item.manifest.manifest_public_key_path = 'product-os-authority.pub';
    fs.writeFileSync(item.manifestPath, `${JSON.stringify(item.manifest, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(item.root, 'release-verification-manifest.json.minisig'), 'test manifest signature\n');
    const report = verifyRelease({ manifest: item.manifestPath, requireSignatures: true, minisignCommand: fakeMinisign });
    assert.equal(report.result, 'FAIL');
    assert.equal(report.publisher_identity, 'NOT_VERIFIED');
    assert.equal(report.manifest_signature_identity, 'UNTRUSTED_KEY');
    assert.equal(report.subjects[0].signature_identity, 'UNTRUSTED_KEY');
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
    const expectedPublicKeySha256 = crypto.createHash('sha256').update('not a public key\n').digest('hex');
    const report = verifyRelease({
      manifest: item.manifestPath,
      minisignCommand: path.join(item.root, 'missing-minisign'),
      expectedPublicKeySha256,
    });
    assert.equal(report.result, 'FAIL');
    assert.equal(report.subjects[0].signature_identity, 'TOOL_UNAVAILABLE');
  } finally { fs.rmSync(item.root, { recursive: true, force: true }); }
});
