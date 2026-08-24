#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '..');
const packageJson = require('../package.json');
const releasePolicy = require('../lib/release-policy');
const { verifyRelease } = require('../lib/release-verifier');
const findings = [];
const unfinishedScaffoldMarker = `[${'TODO'}:`;

function fail(rule, message) {
  findings.push({ rule, severity: 'ERROR', message });
}

function walk(root) {
  const files = [];
  const relativeRoot = path.relative(packageRoot, root).split(path.sep).join('/');
  // sync:runtime verifies the digest-pinned source archive and records every
  // extracted file hash. Runtime tests then validate that generated tree.
  // Avoid a second content scan that duplicates those controls and can force
  // hundreds of iCloud placeholder reads during every release audit.
  if (relativeRoot === 'runtime/framework') return files;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(entry.name)) continue;
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

if (packageJson.name !== 'vibe-product-os') fail('PKG-IDENTITY', 'Unexpected package name.');
if (!/^0\.1\.\d+-pilot\.\d+$/u.test(packageJson.version)) fail('PKG-VERSION', 'Unexpected pilot-candidate package version.');
if (packageJson.private === true) fail('PKG-PUBLISH-GUARD', 'AUTH-DEC-001 approved publication metadata; private=true must be absent.');
if (packageJson.license !== 'Apache-2.0') fail('PKG-LICENSE', 'AUTH-DEC-001 requires Apache-2.0.');
if (packageJson.publishConfig?.access !== 'public' || packageJson.publishConfig?.tag !== 'pilot') {
  fail('PKG-PUBLISH-CONFIG', 'Pilot publication metadata must remain public access with the pilot tag.');
}
if (packageJson.homepage !== 'https://github.com/Shiro7/vibe-product-os#readme'
  || packageJson.bugs?.url !== 'https://github.com/Shiro7/vibe-product-os/issues') {
  fail('PKG-PUBLIC-LOCATORS', 'npm homepage and feedback locator must resolve to the public repository.');
}

const required = [
  'bin/vibe-product-os.js',
  'lib/agent-targets.js',
  'lib/cli.js',
  'lib/install-wizard.js',
  'lib/release-policy.js',
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
  'governance/authority/AUTH-DEC-002_Public_Pilot_Use_Test_Feedback_and_NPM.md',
  'governance/authority/AUTH-DEC-003_Multi_Agent_Installer_and_NPM_Pilot_1.md',
  'governance/authority/PUBLIC_CHANNEL_ACTIVATION_EVIDENCE_2026-08-25.json',
  'governance/authority/product-os-authority.pub',
  'LICENSE',
  'NOTICE',
  'SUPPORT.md',
  'SECURITY.md',
  'plugins/vibe-product-os/.codex-plugin/plugin.json',
  'plugins/vibe-product-os/skills/vibe-product-os/SKILL.md',
  'plugins/vibe-product-os/skills/vibe-product-os/agents/openai.yaml',
  'dist/release-build-report.json',
  `dist/vibe-product-os-skill-${packageJson.version}.zip`,
  `dist/vibe-product-os-codex-plugin-${packageJson.version}.zip`,
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
  if (lock.package_version !== packageJson.version
    || lock.release_authority_decision !== `${releasePolicy.releaseDecision}_PROPOSED`
    || lock.external_distribution_blocker !== 'EXACT_CHANNEL_AUTHORITY_DECISION_PENDING'
    || lock.package_signature_status !== 'VERIFY_WITH_EXTERNAL_SIGNED_RELEASE_MANIFEST') {
    fail('PKG-RUNTIME-RELEASE-POLICY', 'Runtime lock does not match the current package and external-attestation policy.');
  }
}

if (fs.existsSync(path.join(packageRoot, 'governance/authority/authority-state-snapshot.json'))) {
  const authority = JSON.parse(fs.readFileSync(path.join(packageRoot, 'governance/authority/authority-state-snapshot.json'), 'utf8'));
  const expectedNpmReleaseStatus = releasePolicy.exactChannelDecisionStatus === 'APPROVED'
    ? 'APPROVED_PENDING_EXACT_SIGNATURE_VERIFICATION'
    : 'PENDING_EXPLICIT_AUTHORITY_CONFIRMATION_AND_EXACT_SIGNATURE_VERIFICATION';
  if (authority.conditions['AUTH-COND-001'] !== 'CLOSED_SIGNATURE_AND_PRIMARY_CUSTODY_VERIFIED'
    || authority.conditions['AUTH-COND-004'] !== 'CLOSED_CONTINUITY_CONTROLS_VERIFIED'
    || authority.conditions['AUTH-COND-002'] !== 'OPEN_POST_BASELINE_PILOT_DEFERRED_AFTER_UPLOAD') {
    fail('PKG-AUTHORITY-SNAPSHOT', 'Authority state snapshot is incomplete or inconsistent.');
  }
  if (authority.package_publication_policy?.decision_id !== 'AUTH-DEC-001'
    || authority.package_publication_policy?.license !== 'Apache-2.0'
    || authority.package_publication_policy?.license_status !== 'APPROVED'
    || authority.package_publication_policy?.repository_visibility !== 'PUBLIC_ACTIVE_HISTORY_REVIEW_COMPLETE'
    || authority.package_publication_policy?.support_status !== 'ACTIVE_VERIFIED_PUBLIC'
    || authority.package_publication_policy?.security_status !== 'ACTIVE_VERIFIED_PRIVATE_REPORTING'
    || authority.package_publication_policy?.release_decision_id !== releasePolicy.releaseDecision
    || authority.package_publication_policy?.release_decision_status !== releasePolicy.releaseAuthorityStatus
    || authority.package_publication_policy?.public_source_pilot_status !== 'APPROVED_ACTIVE'
    || authority.package_publication_policy?.npm_package !== `${packageJson.name}@${packageJson.version}`
    || authority.package_publication_policy?.npm_access !== 'public'
    || authority.package_publication_policy?.npm_tag !== 'pilot'
    || authority.package_publication_policy?.npm_release_status !== expectedNpmReleaseStatus) {
    fail('PKG-PUBLICATION-POLICY', 'Authority license and channel decision is missing or inconsistent.');
  }
}

if (fs.existsSync(path.join(packageRoot, 'governance/authority/PUBLIC_CHANNEL_ACTIVATION_EVIDENCE_2026-08-25.json'))) {
  const activation = JSON.parse(fs.readFileSync(
    path.join(packageRoot, 'governance/authority/PUBLIC_CHANNEL_ACTIVATION_EVIDENCE_2026-08-25.json'),
    'utf8',
  ));
  const controlStatus = new Map(activation.controls?.map((control) => [control.control_id, control.status]));
  if (activation.authority_decision !== 'AUTH-DEC-001'
    || controlStatus.get('REPOSITORY_VISIBILITY') !== 'PUBLIC_ACTIVE_VERIFIED'
    || controlStatus.get('PUBLIC_SUPPORT_CHANNEL') !== 'ACTIVE_VERIFIED'
    || controlStatus.get('CONFIDENTIAL_SECURITY_REPORTING') !== 'ACTIVE_VERIFIED'
    || activation.remaining_publication_controls?.includes('PUBLIC_SUPPORT_AND_SECURITY_CHANNELS_ACTIVATION_PENDING')) {
    fail('PKG-PUBLIC-CHANNEL-ACTIVATION', 'Public repository, support, or confidential security-reporting activation evidence is incomplete.');
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
