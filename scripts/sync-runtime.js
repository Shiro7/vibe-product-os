#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageRoot = path.resolve(__dirname, '..');
const runtimeRoot = path.join(packageRoot, 'runtime');
const frameworkRoot = path.join(runtimeRoot, 'framework');
const vendorRoot = path.join(packageRoot, 'vendor', 'Product-OS-v1.0-rc.2');
const archive = path.join(vendorRoot, 'Product-OS-v1.0-rc.2.tar.gz');
const buildReportPath = path.join(vendorRoot, 'release-build-report.json');
const expectedArchiveSha256 = 'ba12b607ae90b7a77b9eb2b35a54761847e716f0a5031e416784ae9c20c30f49';
const expectedArchiveRoot = 'Product-OS-v1.0/';

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function walk(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (entry.isFile()) files.push(absolute);
    else throw new Error(`Runtime source contains an unsupported filesystem entry: ${absolute}`);
  }
  return files;
}

function runTar(args) {
  const result = spawnSync('tar', args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`tar failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

for (const required of [archive, buildReportPath]) {
  if (!fs.existsSync(required) || !fs.statSync(required).isFile()) {
    throw new Error(`Vendored governed release input is missing: ${required}`);
  }
}

const archiveSha256 = sha256(archive);
if (archiveSha256 !== expectedArchiveSha256) {
  throw new Error(`Product OS release archive digest mismatch: expected ${expectedArchiveSha256}, received ${archiveSha256}`);
}

const buildReport = JSON.parse(fs.readFileSync(buildReportPath, 'utf8'));
if (buildReport.archive_sha256 !== expectedArchiveSha256 || buildReport.source_file_count !== 503) {
  throw new Error('Vendored release-build-report.json does not describe the approved Product OS source archive.');
}

const archiveEntries = runTar(['-tzf', archive])
  .split(/\r?\n/u)
  .filter(Boolean);
if (archiveEntries.length !== buildReport.archive_entry_count) {
  throw new Error(`Archive entry count mismatch: expected ${buildReport.archive_entry_count}, received ${archiveEntries.length}`);
}
for (const entry of archiveEntries) {
  const normalized = path.posix.normalize(entry);
  if (entry.startsWith('/') || normalized === '..' || normalized.startsWith('../')) {
    throw new Error(`Unsafe archive entry rejected: ${entry}`);
  }
  if (!normalized.startsWith(expectedArchiveRoot)) {
    throw new Error(`Archive entry escaped the expected release root: ${entry}`);
  }
}

const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-product-os-runtime-'));
try {
  const stagedFrameworkRoot = path.join(stagingRoot, 'framework');
  fs.mkdirSync(stagedFrameworkRoot, { recursive: true });
  runTar(['-xzf', archive, '-C', stagedFrameworkRoot]);

  const stagedReleaseRoot = path.join(stagedFrameworkRoot, 'Product-OS-v1.0');
  if (!fs.existsSync(path.join(stagedReleaseRoot, 'outputs'))) {
    throw new Error('Extracted Product OS release is missing its canonical outputs root.');
  }

  fs.rmSync(runtimeRoot, { recursive: true, force: true });
  fs.mkdirSync(runtimeRoot, { recursive: true });
  fs.renameSync(stagedFrameworkRoot, frameworkRoot);
} finally {
  fs.rmSync(stagingRoot, { recursive: true, force: true });
}

const files = walk(frameworkRoot)
  .map((file) => ({
    path: path.relative(runtimeRoot, file).split(path.sep).join('/'),
    size_bytes: fs.statSync(file).size,
    sha256: sha256(file),
  }))
  .sort((left, right) => left.path.localeCompare(right.path));

const lock = {
  lock_id: 'VIBE-PRODUCT-OS-RUNTIME-LOCK-001',
  lock_version: '0.2.0',
  package_version: require('../package.json').version,
  framework_product: 'Product OS',
  framework_version: '1.0.0',
  framework_status: 'ACTIVE_WITH_CONDITIONS',
  source_release: buildReport.release_id,
  source_release_version: buildReport.release_version,
  source_release_archive_sha256: archiveSha256,
  source_release_aggregate_identity_sha256: buildReport.aggregate_source_identity_sha256,
  source_release_file_count: buildReport.source_file_count,
  source_release_archive_entry_count: buildReport.archive_entry_count,
  runtime_release_root: 'framework/Product-OS-v1.0',
  baseline_effective_at: '2026-08-16T10:47:02+08:00',
  distribution_status: 'PILOT_CANDIDATE_PUBLICATION_PREPARATION',
  framework_signature_condition: 'AUTH-COND-001_CLOSED',
  key_continuity_condition: 'AUTH-COND-004_CLOSED',
  external_distribution_blocker: 'PACKAGE_RELEASE_SIGNATURES_PENDING',
  external_distribution_blockers: [
    'PACKAGE_RELEASE_SIGNATURES_PENDING',
    'PUBLIC_SUPPORT_AND_SECURITY_CHANNELS_ACTIVATION_PENDING',
    'EXACT_CHANNEL_AUTHORITY_DECISION_PENDING'
  ],
  production_claim_blocker: 'AUTH-COND-002',
  extraction_safety: {
    digest_verified: true,
    entry_count_verified: true,
    traversal_entries_rejected: true,
    expected_archive_root: expectedArchiveRoot,
  },
  file_count: files.length,
  files,
};

fs.writeFileSync(
  path.join(runtimeRoot, 'framework-runtime-lock.json'),
  `${JSON.stringify(lock, null, 2)}\n`,
  'utf8',
);

process.stdout.write(`Synced complete Product OS runtime: ${files.length} files from ${buildReport.release_id}.\n`);
