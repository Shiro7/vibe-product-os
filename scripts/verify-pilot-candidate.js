#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { verifyRelease } = require('../lib/release-verifier');

const packageRoot = path.resolve(__dirname, '..');
const packageJson = require('../package.json');
const distRoot = path.join(packageRoot, 'dist');
const tarball = path.join(distRoot, `${packageJson.name}-${packageJson.version}.tgz`);
const manifest = path.join(distRoot, 'release-verification-manifest.json');
const packReportPath = path.join(distRoot, 'npm-pack-report.json');
const publicKey = path.join(distRoot, 'product-os-authority.pub');
const reportPath = path.join(distRoot, 'clean-recipient-verification.json');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
  return result.stdout;
}

for (const required of [tarball, manifest, packReportPath, publicKey]) {
  if (!fs.existsSync(required) || !fs.statSync(required).isFile()) {
    throw new Error(`Pilot candidate input is missing: ${path.basename(required)}`);
  }
}

const byteReport = verifyRelease({ manifest });
if (byteReport.result !== 'PASS' || byteReport.byte_identity !== 'VERIFIED' || byteReport.subjects.length !== 6) {
  throw new Error('Pilot release subjects failed byte-identity verification.');
}
const packReport = JSON.parse(fs.readFileSync(packReportPath, 'utf8'));
if (packReport.prohibited_path_count !== 0 || packReport.version !== packageJson.version) {
  throw new Error('npm pack report failed the package-content boundary.');
}
if (sha256(publicKey) !== '92d7d336663522b1ac55544749fa632cfa63467af5391a01f8788ffefc3412da') {
  throw new Error('Packaged Authority public key mismatch.');
}

const recipientRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-product-os-pilot-recipient-'));
try {
  const cache = path.join(recipientRoot, 'npm-cache');
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
    'install', tarball, '--ignore-scripts', '--no-audit', '--no-fund', '--cache', cache,
  ], { cwd: recipientRoot });

  const installedRoot = path.join(recipientRoot, 'node_modules', packageJson.name);
  const cli = path.join(installedRoot, 'bin', 'vibe-product-os.js');
  const identity = JSON.parse(run(process.execPath, [cli, 'version', '--json'], { cwd: recipientRoot }));
  const doctor = JSON.parse(run(process.execPath, [cli, 'setup-doctor', '--json'], { cwd: recipientRoot }));
  if (identity.package_version !== packageJson.version || identity.framework_version !== '1.0.0') {
    throw new Error('Clean-recipient package/framework identity mismatch.');
  }
  if (!doctor.healthy) throw new Error('Clean-recipient setup doctor did not pass.');

  const prohibitedInstalledPaths = [];
  const walk = (root) => {
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      const absolute = path.join(root, entry.name);
      const relative = path.relative(installedRoot, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if (['.git', '.github', 'test', 'scripts', 'vendor', 'dist', 'reports'].includes(relative)) prohibitedInstalledPaths.push(relative);
        walk(absolute);
      } else if (entry.isFile() && /\.(?:key|sec|pem|p12|pfx)$/iu.test(entry.name)) {
        prohibitedInstalledPaths.push(relative);
      }
    }
  };
  walk(installedRoot);
  if (prohibitedInstalledPaths.length) {
    throw new Error(`Clean recipient found prohibited paths: ${prohibitedInstalledPaths.join(', ')}`);
  }

  const report = {
    report_id: 'VIBE-PRODUCT-OS-PILOT-CLEAN-RECIPIENT-001',
    verified_at: new Date().toISOString(),
    package: packageJson.name,
    package_version: packageJson.version,
    framework_version: identity.framework_version,
    npm_tarball_sha256: sha256(tarball),
    release_subject_count: byteReport.subjects.length,
    byte_identity: byteReport.byte_identity,
    publisher_identity: byteReport.publisher_identity,
    ready_for_authority_signing: byteReport.ready_for_authority_signing,
    npm_install_from_local_tarball: 'PASS',
    setup_doctor: 'PASS',
    prohibited_installed_path_count: 0,
    external_distribution_authorized: false,
    remaining_controls: identity.external_distribution_blockers,
    claim_boundary: identity.claim_boundary,
    result: 'PASS_UNSIGNED_PREPUBLICATION',
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  fs.rmSync(recipientRoot, { recursive: true, force: true });
}
