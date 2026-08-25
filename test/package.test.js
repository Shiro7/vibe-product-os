'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('publication-preparation pilot metadata and identity are pinned', () => {
  const packageJson = require('../package.json');
  assert.equal(packageJson.name, 'vibe-product-os');
  assert.equal(packageJson.version, '0.1.0-pilot.2');
  assert.notEqual(packageJson.private, true);
  assert.equal(packageJson.license, 'Apache-2.0');
  assert.equal(packageJson.publishConfig.access, 'public');
  assert.equal(packageJson.publishConfig.tag, 'pilot');
  assert.equal(packageJson.vibeProductOS.shortName, 'VPOS');
  assert.equal(packageJson.bin.vpo, 'bin/vibe-product-os.js');
  assert.equal(packageJson.bin['vibe-product-os'], 'bin/vibe-product-os.js');
  assert.equal(packageJson.homepage, 'https://shiro7.github.io/vibe-product-os/');
  assert.equal(packageJson.bugs.url, 'https://github.com/Shiro7/vibe-product-os/issues');
  assert.match(packageJson.description, /Multi-agent Skill installer/u);
  assert.equal(packageJson.files.includes('dist/'), false);
  assert.equal(packageJson.files.includes('NOTICE'), true);
});

test('skill and plugin scaffolds contain no unresolved placeholders', () => {
  const unfinishedScaffoldMarker = `[${'TODO'}:`;
  const files = [
    'plugins/vibe-product-os/.codex-plugin/plugin.json',
    'plugins/vibe-product-os/skills/vibe-product-os/SKILL.md',
    'plugins/vibe-product-os/skills/vibe-product-os/agents/openai.yaml',
  ];
  for (const relative of files) {
    const content = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.equal(content.includes(unfinishedScaffoldMarker), false, relative);
  }
});

test('runtime lock preserves the approved Product OS identity', () => {
  const lock = JSON.parse(fs.readFileSync(
    path.join(root, 'runtime', 'framework-runtime-lock.json'),
    'utf8',
  ));
  assert.equal(lock.framework_version, '1.0.0');
  assert.equal(lock.source_release, 'Product-OS-v1.0-rc.2');
  assert.equal(lock.framework_signature_condition, 'AUTH-COND-001_CLOSED');
  assert.equal(lock.key_continuity_condition, 'AUTH-COND-004_CLOSED');
  assert.equal(lock.package_version, '0.1.0-pilot.2');
  assert.equal(lock.release_authority_decision, 'AUTH-DEC-005_APPROVED');
  assert.equal(lock.external_distribution_blocker, null);
  assert.deepEqual(lock.external_distribution_blockers, []);
  assert.equal(lock.source_release_file_count, 503);
  assert.equal(lock.file_count, 504);
  assert.equal(lock.extraction_safety.digest_verified, true);
});

test('W1, W2, and W3 package governance assets are complete', () => {
  const coverage = JSON.parse(fs.readFileSync(path.join(root, 'governance/w1/Skill_Capability_and_Source_Coverage_Map.json'), 'utf8'));
  const physical = JSON.parse(fs.readFileSync(path.join(root, 'governance/w2/Artifact_to_Physical_Output_Map.json'), 'utf8'));
  const commands = JSON.parse(fs.readFileSync(path.join(root, 'governance/w3/W3_Command_Capability_Map.json'), 'utf8'));
  assert.equal(coverage.component_count, 17);
  assert.equal(coverage.components.every((item) => item.status === 'COVERED'), true);
  assert.equal(physical.artifact_count, 281);
  assert.equal(new Set(physical.entries.map((item) => item.artifact_id)).size, 281);
  assert.equal(commands.command_count, 3);
  assert.deepEqual(commands.commands.map((item) => item.command), ['status', 'update', 'verify-release']);
  assert.equal(commands.package_version, '0.1.0-pilot.2');
  assert.equal(commands.focused_test_count, 21);
  assert.deepEqual(commands.open_release_controls, [
    'PACKAGE_RELEASE_SIGNATURES_PENDING',
  ]);
});

test('public channels, pilot.1 evidence, and pilot.2 authority are pinned', () => {
  const authority = JSON.parse(fs.readFileSync(
    path.join(root, 'governance/authority/authority-state-snapshot.json'),
    'utf8',
  ));
  const activation = JSON.parse(fs.readFileSync(
    path.join(root, 'governance/authority/PUBLIC_CHANNEL_ACTIVATION_EVIDENCE_2026-08-25.json'),
    'utf8',
  ));
  const publication = JSON.parse(fs.readFileSync(
    path.join(root, 'governance/authority/NPM_PUBLICATION_EVIDENCE_0.1.0-pilot.1_2026-08-25.json'),
    'utf8',
  ));
  const pilot2Decision = fs.readFileSync(
    path.join(root, 'governance/authority/AUTH-DEC-005_VPOS_Website_and_NPM_Homepage_Pilot_2.md'),
    'utf8',
  );
  assert.equal(authority.brand_and_website_decision, 'AUTH-DEC-004_VPOS_Official_Short_Name_and_Website.md');
  assert.equal(authority.brand_identity.product_name, 'Vibe Product OS');
  assert.equal(authority.brand_identity.official_short_name, 'VPOS');
  assert.deepEqual(authority.brand_identity.current_cli_names, ['vpo', 'vibe-product-os']);
  assert.equal(authority.package_publication_policy.repository_visibility, 'PUBLIC_ACTIVE_HISTORY_REVIEW_COMPLETE');
  assert.equal(authority.package_publication_policy.support_status, 'ACTIVE_VERIFIED_PUBLIC');
  assert.equal(authority.package_publication_policy.security_status, 'ACTIVE_VERIFIED_PRIVATE_REPORTING');
  assert.equal(authority.package_publication_policy.release_decision_id, 'AUTH-DEC-005');
  assert.equal(authority.package_publication_policy.release_decision_status, 'APPROVED_CONDITIONAL_ON_EXACT_EXTERNAL_ATTESTATION');
  assert.equal(authority.package_publication_policy.npm_package, 'vibe-product-os@0.1.0-pilot.2');
  assert.equal(authority.package_publication_policy.npm_access, 'public');
  assert.equal(authority.package_publication_policy.npm_tag, 'pilot');
  assert.equal(authority.package_publication_policy.npm_release_status, 'APPROVED_PENDING_EXACT_SIGNATURE_VERIFICATION');
  assert.equal(activation.authority_decision, 'AUTH-DEC-001');
  assert.deepEqual(activation.remaining_publication_controls, [
    'PACKAGE_RELEASE_SIGNATURES_PENDING',
    'EXACT_CHANNEL_AUTHORITY_DECISION_PENDING',
  ]);
  assert.equal(publication.authority_decision, 'AUTH-DEC-003');
  assert.equal(publication.npm_publication.version, '0.1.0-pilot.1');
  assert.equal(publication.npm_publication.registry_metadata_verification, 'PASS');
  assert.equal(publication.dist_tag_observation.pilot, '0.1.0-pilot.1');
  assert.equal(publication.dist_tag_observation.latest, '0.1.0-pilot.0');
  assert.equal(publication.signature_verification.publisher_identity, 'VERIFIED');
  assert.equal(publication.signature_verification.signed_subject_count, 6);
  assert.equal(publication.clean_public_install_verification.requested_agent_count, 9);
  assert.equal(publication.clean_public_install_verification.unique_destination_count, 3);
  assert.equal(publication.overall_result, 'PUBLIC_PILOT_1_PUBLISHED_SIGNED_AND_CLEAN_INSTALL_VERIFIED');
  assert.match(pilot2Decision, /decision_id: AUTH-DEC-005/u);
  assert.match(pilot2Decision, /decision_status: APPROVED/u);
  assert.match(pilot2Decision, /vibe-product-os@0\.1\.0-pilot\.2/u);
});
