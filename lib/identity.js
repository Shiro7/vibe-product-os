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
  distribution_status: 'INTERNAL_ALPHA_NOT_AUTHORIZED_FOR_EXTERNAL_DISTRIBUTION',
  external_distribution_blocker: 'AUTH-COND-001',
  production_claim_blocker: 'AUTH-COND-002',
  skill_source_coverage: '17_OF_17_VERIFIED',
  physical_composer_status: 'W2_VERIFIED_WORKING_BASELINE',
  physical_composer_artifact_map_count: 281,
  operational_commands_status: 'W3_VERIFIED_WORKING_BASELINE',
  operational_commands: Object.freeze(['status', 'update', 'verify-release']),
  automation_authority: 'NONE',
});

module.exports = identity;
