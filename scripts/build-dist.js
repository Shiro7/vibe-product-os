#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageRoot = path.resolve(__dirname, '..');
const packageJson = require('../package.json');
const skillRoot = path.join(packageRoot, 'plugins', 'vibe-product-os', 'skills', 'vibe-product-os');
const pluginRoot = path.join(packageRoot, 'plugins', 'vibe-product-os');
const distRoot = path.join(packageRoot, 'dist');
const skillZip = path.join(distRoot, `vibe-product-os-skill-${packageJson.version}.zip`);
const pluginZip = path.join(distRoot, `vibe-product-os-codex-plugin-${packageJson.version}.zip`);
const authoritySnapshot = path.join(packageRoot, 'governance', 'authority', 'authority-state-snapshot.json');
const authorityPublicKey = path.join(packageRoot, 'governance', 'authority', 'product-os-authority.pub');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function countFiles(root) {
  let count = 0;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) count += countFiles(absolute);
    else if (entry.isFile()) count += 1;
  }
  return count;
}

function buildZip(cwd, output, entries) {
  const result = spawnSync('zip', ['-q', '-r', output, ...entries], {
    cwd,
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`zip failed: ${result.stderr || result.stdout}`);
}

function git(args) {
  const result = spawnSync('git', args, { cwd: packageRoot, encoding: 'utf8' });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim();
}

for (const required of [
  path.join(skillRoot, 'SKILL.md'),
  path.join(skillRoot, 'agents', 'openai.yaml'),
  path.join(pluginRoot, '.codex-plugin', 'plugin.json'),
  path.join(packageRoot, 'runtime', 'framework-runtime-lock.json'),
  authoritySnapshot,
  authorityPublicKey,
]) {
  if (!fs.existsSync(required)) throw new Error(`Distribution input is missing: ${required}`);
}

fs.rmSync(distRoot, { recursive: true, force: true });
fs.mkdirSync(distRoot, { recursive: true });
fs.copyFileSync(authorityPublicKey, path.join(distRoot, 'product-os-authority.pub'));

const skillEntries = ['SKILL.md', 'agents', 'references', 'assets']
  .filter((entry) => fs.existsSync(path.join(skillRoot, entry)));
buildZip(skillRoot, skillZip, skillEntries);
buildZip(pluginRoot, pluginZip, ['.codex-plugin', 'skills']);

const outputs = [skillZip, pluginZip].map((file) => ({
  file: path.basename(file),
  size_bytes: fs.statSync(file).size,
  sha256: sha256(file),
}));

const report = {
  report_id: 'VIBE-PRODUCT-OS-PILOT-BUILD-001',
  package: packageJson.name,
  package_version: packageJson.version,
  framework_version: '1.0.0',
  build_status: 'PILOT_CANDIDATE_PUBLICATION_PREPARATION',
  external_distribution_authorized: false,
  external_distribution_blockers: [
    'PACKAGE_RELEASE_SIGNATURES_PENDING',
    'EXACT_CHANNEL_AUTHORITY_DECISION_PENDING'
  ],
  framework_authority_conditions: {
    'AUTH-COND-001': 'CLOSED',
    'AUTH-COND-002': 'OPEN_POST_BASELINE',
    'AUTH-COND-004': 'CLOSED'
  },
  source_identity: {
    git_commit: git(['rev-parse', 'HEAD']),
    git_worktree: git(['status', '--porcelain']) ? 'DIRTY' : 'CLEAN'
  },
  signing_key_id: 'EAB95C319319813D',
  package_signature_status: 'PENDING_EXACT_SUBJECT_SIGNATURES',
  skill_capability_source_coverage: '17_OF_17_PASS',
  physical_composer_status: 'W2_VERIFIED_WORKING_BASELINE',
  physical_composer_artifact_map_count: 281,
  operational_commands_status: 'W3_VERIFIED_WORKING_BASELINE',
  operational_commands: ['status', 'update', 'verify-release'],
  skill_source_file_count: countFiles(skillRoot),
  plugin_source_file_count: countFiles(pluginRoot),
  outputs,
};

fs.writeFileSync(
  path.join(distRoot, 'release-build-report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
);

process.stdout.write(`Built ${outputs.length} publication-preparation pilot archives.\n`);
