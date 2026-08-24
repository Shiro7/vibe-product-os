#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageRoot = path.resolve(__dirname, '..');
const packageJson = require('../package.json');
const distRoot = path.join(packageRoot, 'dist');
const expectedTarball = path.join(distRoot, `${packageJson.name}-${packageJson.version}.tgz`);
const packReport = path.join(distRoot, 'npm-pack-report.json');
const verificationManifest = path.join(distRoot, 'release-verification-manifest.json');

if (packageJson.private !== true || packageJson.version !== '0.1.0-alpha.0') {
  throw new Error('pack:alpha only runs for the guarded internal alpha package.');
}

fs.mkdirSync(distRoot, { recursive: true });
fs.rmSync(expectedTarball, { force: true });
fs.rmSync(packReport, { force: true });
fs.rmSync(verificationManifest, { force: true });

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, [
  'pack',
  '--ignore-scripts',
  '--json',
  '--pack-destination',
  distRoot,
], {
  cwd: packageRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    npm_config_cache: path.join(os.tmpdir(), 'vibe-product-os-npm-cache'),
  },
});

if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`npm pack failed: ${result.stderr || result.stdout}`);

const [pack] = JSON.parse(result.stdout);
if (!pack || pack.filename !== path.basename(expectedTarball) || !fs.existsSync(expectedTarball)) {
  throw new Error('npm pack did not produce the expected alpha tarball.');
}

const prohibited = pack.files
  .map((entry) => entry.path)
  .filter((entry) => (
    entry.startsWith('test/')
    || entry.startsWith('scripts/')
    || entry.startsWith('outputs/')
    || entry.includes('node_modules/')
    || /\.(?:key|sec|pem|p12|pfx)$/i.test(entry)
  ));
if (prohibited.length) throw new Error(`npm tarball contains prohibited paths: ${prohibited.join(', ')}`);

const report = {
  report_id: 'VIBE-PRODUCT-OS-ALPHA-NPM-PACK-001',
  package: packageJson.name,
  version: packageJson.version,
  status: 'INTERNAL_ALPHA_LOCAL_TARBALL',
  external_distribution_authorized: false,
  external_distribution_blocker: 'AUTH-COND-001',
  filename: pack.filename,
  size_bytes: fs.statSync(expectedTarball).size,
  unpacked_size_bytes: pack.unpackedSize,
  entry_count: pack.entryCount,
  npm_shasum_sha1: pack.shasum,
  npm_integrity: pack.integrity,
  sha256: crypto.createHash('sha256').update(fs.readFileSync(expectedTarball)).digest('hex'),
  prohibited_path_count: prohibited.length,
};

fs.writeFileSync(
  packReport,
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
);

const releaseSubjects = [
  { subject_id: 'SKILL-ZIP', file: `vibe-product-os-skill-${packageJson.version}.zip` },
  { subject_id: 'CODEX-PLUGIN-ZIP', file: `vibe-product-os-codex-plugin-${packageJson.version}.zip` },
  { subject_id: 'NPM-TARBALL', file: pack.filename },
].map(({ subject_id: subjectId, file }) => {
  const absolute = path.join(distRoot, file);
  if (!fs.existsSync(absolute) || !fs.lstatSync(absolute).isFile()) throw new Error(`Release subject is missing: ${file}`);
  return {
    subject_id: subjectId,
    path: file,
    size_bytes: fs.statSync(absolute).size,
    digest_algorithm: 'sha256',
    sha256: crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex'),
    signature_path: null,
    public_key_path: null,
  };
});

fs.writeFileSync(verificationManifest, `${JSON.stringify({
  manifest_id: 'VIBE-PRODUCT-OS-ALPHA-RELEASE-VERIFICATION-001',
  manifest_version: '1.0.0',
  release_root: '.',
  package: packageJson.name,
  package_version: packageJson.version,
  framework_release: '1.0.0',
  source_release: 'Product-OS-v1.0-rc.2',
  release_status: 'INTERNAL_ALPHA_NOT_AUTHORIZED_FOR_EXTERNAL_DISTRIBUTION',
  generated_at: new Date().toISOString(),
  signature_policy: 'MINISIGN_REQUIRED_FOR_EVERY_EXTERNAL_DISTRIBUTION_SUBJECT',
  conditions: [
    { condition_id: 'AUTH-COND-001', status: 'OPEN' },
    { condition_id: 'AUTH-COND-002', status: 'OPEN' },
  ],
  subjects: releaseSubjects,
}, null, 2)}\n`, 'utf8');

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
