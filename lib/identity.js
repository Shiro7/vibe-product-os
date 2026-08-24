'use strict';

const packageJson = require('../package.json');

const identity = Object.freeze({
  product: 'Vibe Product OS',
  package: packageJson.name,
  package_version: packageJson.version,
  framework: 'Product OS',
  framework_version: '1.0.0',
  framework_status: 'ACTIVE_WITH_CONDITIONS',
  source_release: 'Product-OS-v1.0-rc.2',
  distribution_status: 'PILOT_CANDIDATE_PUBLICATION_PREPARATION',
  license: 'Apache-2.0',
  license_decision: 'AUTH-DEC-001_APPROVED',
  public_channel_status: 'APPROVED_PENDING_ACTIVATION',
  framework_signature_condition: 'AUTH-COND-001_CLOSED',
  key_continuity_condition: 'AUTH-COND-004_CLOSED',
  package_signature_status: 'PENDING_EXACT_SUBJECT_SIGNATURES',
  external_distribution_blocker: 'PACKAGE_RELEASE_SIGNATURES_PENDING',
  external_distribution_blockers: Object.freeze([
    'PACKAGE_RELEASE_SIGNATURES_PENDING',
    'PUBLIC_SUPPORT_AND_SECURITY_CHANNELS_ACTIVATION_PENDING',
    'EXACT_CHANNEL_AUTHORITY_DECISION_PENDING',
  ]),
  production_claim_blocker: 'AUTH-COND-002',
  skill_source_coverage: '17_OF_17_VERIFIED',
  physical_composer_status: 'W2_VERIFIED_WORKING_BASELINE',
  physical_composer_artifact_map_count: 281,
  operational_commands_status: 'W3_VERIFIED_WORKING_BASELINE',
  operational_commands: Object.freeze(['status', 'update', 'verify-release']),
  automation_authority: 'NONE',
  claim_boundary: 'PRODUCT_OS_V1_WITH_REAL_PROJECT_VALIDATION_IN_PROGRESS',
});

module.exports = identity;
