#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '..');
const distRoot = path.join(packageRoot, 'dist');
const manifestPath = path.join(distRoot, 'release-verification-manifest.json');
const publicKeyName = 'product-os-authority.pub';
const publicKeyPath = path.join(distRoot, publicKeyName);
const expectedPublicKeySha256 = '92d7d336663522b1ac55544749fa632cfa63467af5391a01f8788ffefc3412da';

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

if (!fs.existsSync(manifestPath) || !fs.existsSync(publicKeyPath)) {
  throw new Error('Build and pack the pilot candidate before configuring signatures.');
}
if (sha256(publicKeyPath) !== expectedPublicKeySha256) {
  throw new Error('Authority public-key digest mismatch.');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.package_version !== '0.1.0-pilot.0' || manifest.subjects.length !== 6) {
  throw new Error('Unexpected pilot release manifest identity or subject count.');
}
for (const subject of manifest.subjects) {
  const signatureName = `${subject.path}.minisig`;
  const signaturePath = path.join(distRoot, signatureName);
  if (!fs.existsSync(signaturePath) || !fs.statSync(signaturePath).isFile()) {
    throw new Error(`Missing detached signature for ${subject.path}.`);
  }
  subject.signature_path = signatureName;
  subject.public_key_path = publicKeyName;
}

manifest.manifest_signature_path = 'release-verification-manifest.json.minisig';
manifest.manifest_public_key_path = publicKeyName;
manifest.release_status = 'PILOT_CANDIDATE_SUBJECTS_SIGNED_PENDING_MANIFEST_SIGNATURE_AND_VERIFICATION';
const signatureControl = manifest.package_release_controls.find((item) => item.control_id === 'PACKAGE_RELEASE_SIGNATURES');
if (signatureControl) signatureControl.status = 'SUBJECTS_SIGNED_MANIFEST_SIGNATURE_PENDING';
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

process.stdout.write('Configured six subject signatures and manifest signature identity.\n');
