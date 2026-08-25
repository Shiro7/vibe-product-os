'use strict';

const packageJson = require('../package.json');
const releasePolicy = require('./release-policy');

const identity = Object.freeze({
  product: 'Vibe Product OS',
  short_name: releasePolicy.shortName,
  package: packageJson.name,
  package_version: packageJson.version,
  framework: 'Product OS',
  framework_version: releasePolicy.frameworkVersion,
  framework_status: 'ACTIVE_WITH_CONDITIONS',
  source_release: releasePolicy.sourceRelease,
  distribution_status: 'PUBLIC_PILOT_CHANNEL_AUTHORIZED_EXTERNAL_ATTESTATION_REQUIRED',
  license: 'Apache-2.0',
  license_decision: 'AUTH-DEC-001_APPROVED',
  public_channel_status: 'ACTIVE_VERIFIED',
  release_authority_decision: `${releasePolicy.releaseDecision}_APPROVED`,
  release_authority_status: releasePolicy.releaseAuthorityStatus,
  feedback_channel: 'https://github.com/Shiro7/vibe-product-os/issues',
  framework_signature_condition: 'AUTH-COND-001_CLOSED',
  key_continuity_condition: 'AUTH-COND-004_CLOSED',
  package_signature_status: 'VERIFY_WITH_EXTERNAL_SIGNED_RELEASE_MANIFEST',
  release_attestation_requirement: 'DETACHED_SIGNATURES_AND_SIGNED_MANIFEST_REQUIRED_FOR_PUBLISHER_IDENTITY',
  external_distribution_blocker: null,
  external_distribution_blockers: Object.freeze([]),
  production_claim_blocker: 'AUTH-COND-002',
  skill_source_coverage: '17_OF_17_VERIFIED',
  physical_composer_status: 'W2_VERIFIED_WORKING_BASELINE',
  physical_composer_artifact_map_count: 281,
  operational_commands_status: 'W3_VERIFIED_WORKING_BASELINE',
  operational_commands: Object.freeze(['status', 'update', 'verify-release']),
  automation_authority: 'NONE',
  claim_boundary: releasePolicy.claimBoundary,
});

module.exports = identity;
