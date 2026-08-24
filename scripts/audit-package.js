#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '..');
const packageJson = require('../package.json');
const { verifyRelease } = require('../lib/release-verifier');
const findings = [];
const unfinishedScaffoldMarker = `[${'TODO'}:`;

function fail(rule, message) {
  findings.push({ rule, severity: 'ERROR', message });
}

function walk(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(entry.name)) continue;
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

if (packageJson.name !== 'vibe-product-os') fail('PKG-IDENTITY', 'Unexpected package name.');
if (packageJson.version !== '0.1.0-pilot.0') fail('PKG-VERSION', 'Unexpected pilot-candidate package version.');
if (packageJson.private === true) fail('PKG-PUBLISH-GUARD', 'AUTH-DEC-001 approved publication metadata; private=true must be absent.');
if (packageJson.license !== 'Apache-2.0') fail('PKG-LICENSE', 'AUTH-DEC-001 requires Apache-2.0.');
if (packageJson.publishConfig?.access !== 'public' || packageJson.publishConfig?.tag !== 'pilot') {
  fail('PKG-PUBLISH-CONFIG', 'Pilot publication metadata must remain public access with the pilot tag.');
}

const required = [
  'bin/vibe-product-os.js',
  'lib/cli.js',
  'lib/composer.js',
  'lib/composition-model.js',
  'lib/status.js',
  'lib/updater.js',
  'lib/release-verifier.js',
  'runtime/framework-runtime-lock.json',
  'runtime/framework/Product-OS-v1.0/outputs/Product_OS_v1.0_Final/config/release-component-catalog.json',
  'governance/w1/Skill_Capability_and_Source_Coverage_Map.json',
  'governance/w2/Artifact_to_Physical_Output_Map.json',
  'governance/w2/W2_Closure_Review.md',
  'governance/w3/W3_Command_Capability_Map.json',
  'governance/w3/W3_Closure_Review.md',
  'governance/authority/authority-state-snapshot.json',
  'governance/authority/AUTH-DEC-001_Public_License_and_Channels.md',
  'governance/authority/product-os-authority.pub',
  'LICENSE',
  'NOTICE',
  'SUPPORT.md',
  'SECURITY.md',
  'plugins/vibe-product-os/.codex-plugin/plugin.json',
  'plugins/vibe-product-os/skills/vibe-product-os/SKILL.md',
  'plugins/vibe-product-os/skills/vibe-product-os/agents/openai.yaml',
  'dist/release-build-report.json',
  'dist/vibe-product-os-skill-0.1.0-pilot.0.zip',
  'dist/vibe-product-os-codex-plugin-0.1.0-pilot.0.zip',
];
for (const relative of required) {
  if (!fs.existsSync(path.join(packageRoot, relative))) fail('PKG-REQUIRED-FILE', `Missing ${relative}.`);
}

if (fs.existsSync(path.join(packageRoot, 'governance/w1/Skill_Capability_and_Source_Coverage_Map.json'))) {
  const coverage = JSON.parse(fs.readFileSync(path.join(packageRoot, 'governance/w1/Skill_Capability_and_Source_Coverage_Map.json'), 'utf8'));
  if (coverage.component_count !== 17 || coverage.components.length !== 17 || coverage.components.some((item) => item.status !== 'COVERED')) {
    fail('PKG-W1-COVERAGE', 'W1 must cover all 17 release components.');
  }
}

if (fs.existsSync(path.join(packageRoot, 'governance/w2/Artifact_to_Physical_Output_Map.json'))) {
  const physical = JSON.parse(fs.readFileSync(path.join(packageRoot, 'governance/w2/Artifact_to_Physical_Output_Map.json'), 'utf8'));
  if (physical.artifact_count !== 281 || physical.entries.length !== 281 || new Set(physical.entries.map((item) => item.artifact_id)).size !== 281) {
    fail('PKG-W2-COVERAGE', 'W2 physical output map must contain exactly 281 unique artifacts.');
  }
}

if (fs.existsSync(path.join(packageRoot, 'runtime/framework-runtime-lock.json'))) {
  const lock = JSON.parse(fs.readFileSync(path.join(packageRoot, 'runtime/framework-runtime-lock.json'), 'utf8'));
  if (lock.source_release_archive_sha256 !== 'ba12b607ae90b7a77b9eb2b35a54761847e716f0a5031e416784ae9c20c30f49') {
    fail('PKG-RUNTIME-IDENTITY', 'Bundled Product OS archive identity is not the approved rc.2 digest.');
  }
  if (lock.source_release_file_count !== 503 || lock.file_count !== 504) {
    fail('PKG-RUNTIME-COVERAGE', 'Bundled Product OS runtime is not the complete approved release.');
  }
  if (lock.framework_signature_condition !== 'AUTH-COND-001_CLOSED' || lock.key_continuity_condition !== 'AUTH-COND-004_CLOSED') {
    fail('PKG-AUTHORITY-STATE', 'Runtime lock does not reflect the additive Authority closure state.');
  }
}

if (fs.existsSync(path.join(packageRoot, 'governance/authority/authority-state-snapshot.json'))) {
  const authority = JSON.parse(fs.readFileSync(path.join(packageRoot, 'governance/authority/authority-state-snapshot.json'), 'utf8'));
  if (authority.conditions['AUTH-COND-001'] !== 'CLOSED_SIGNATURE_AND_PRIMARY_CUSTODY_VERIFIED'
    || authority.conditions['AUTH-COND-004'] !== 'CLOSED_CONTINUITY_CONTROLS_VERIFIED'
    || authority.conditions['AUTH-COND-002'] !== 'OPEN_POST_BASELINE_PILOT_DEFERRED_AFTER_UPLOAD') {
    fail('PKG-AUTHORITY-SNAPSHOT', 'Authority state snapshot is incomplete or inconsistent.');
  }
  if (authority.package_publication_policy?.decision_id !== 'AUTH-DEC-001'
    || authority.package_publication_policy?.license !== 'Apache-2.0'
    || authority.package_publication_policy?.license_status !== 'APPROVED') {
    fail('PKG-PUBLICATION-POLICY', 'Authority license and channel decision is missing or inconsistent.');
  }
}

const verificationManifest = path.join(packageRoot, 'dist', 'release-verification-manifest.json');
if (fs.existsSync(verificationManifest)) {
  const releaseReport = verifyRelease({ manifest: verificationManifest });
  if (releaseReport.result !== 'PASS' || releaseReport.byte_identity !== 'VERIFIED' || releaseReport.subjects.length !== 6) {
    fail('PKG-RELEASE-IDENTITY', 'Generated release subjects failed byte-identity verification.');
  }
  if (releaseReport.publisher_identity !== 'NOT_VERIFIED' || releaseReport.external_distribution_authorized !== false) {
    fail('PKG-RELEASE-AUTHORITY', 'Unsigned pilot candidate must not claim publisher identity or distribution authority.');
  }
}

const prohibitedExtensions = new Set(['.key', '.sec', '.pem', '.p12', '.pfx']);
for (const file of walk(packageRoot)) {
  if (prohibitedExtensions.has(path.extname(file).toLowerCase())) {
    fail('PKG-PRIVATE-KEY', `Prohibited key-like file: ${path.relative(packageRoot, file)}.`);
  }
  if (!['.md', '.json', '.yaml', '.yml', '.js'].includes(path.extname(file).toLowerCase())) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(unfinishedScaffoldMarker)) fail('PKG-PLACEHOLDER', `Unresolved scaffold placeholder in ${path.relative(packageRoot, file)}.`);
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) {
    fail('PKG-PRIVATE-KEY-CONTENT', `Private-key material marker in ${path.relative(packageRoot, file)}.`);
  }
}

const report = {
  audit: 'vibe-product-os-publication-preparation-pilot-package',
  package_version: packageJson.version,
  result: findings.length ? 'FAIL' : 'PASS',
  findings,
  external_distribution_authorized: false,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (findings.length) process.exitCode = 1;
