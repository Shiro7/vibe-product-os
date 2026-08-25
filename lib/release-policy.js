'use strict';

const packageJson = require('../package.json');

const metadata = packageJson.vibeProductOS || {};
const required = [
  'shortName',
  'frameworkVersion',
  'sourceRelease',
  'releaseDecision',
  'releaseAuthorityStatus',
  'npmPrimaryTag',
  'authorityKeyId',
  'authorityPublicKeySha256',
  'claimBoundary',
];

for (const field of required) {
  if (typeof metadata[field] !== 'string' || !metadata[field]) {
    throw new Error(`package.json vibeProductOS.${field} is required.`);
  }
}

if (!/^0\.1\.\d+-pilot\.\d+$/u.test(packageJson.version)) {
  throw new Error(`Unsupported pilot package version: ${packageJson.version}`);
}

const releasePolicy = Object.freeze({
  packageName: packageJson.name,
  packageVersion: packageJson.version,
  shortName: metadata.shortName,
  frameworkVersion: metadata.frameworkVersion,
  sourceRelease: metadata.sourceRelease,
  releaseDecision: metadata.releaseDecision,
  releaseAuthorityStatus: metadata.releaseAuthorityStatus,
  authorityKeyId: metadata.authorityKeyId,
  authorityPublicKeySha256: metadata.authorityPublicKeySha256,
  claimBoundary: metadata.claimBoundary,
  npmAccess: packageJson.publishConfig?.access,
  npmTag: packageJson.publishConfig?.tag,
  npmPrimaryTag: metadata.npmPrimaryTag,
  exactChannelValue: `npm public / ${packageJson.publishConfig?.tag}+${metadata.npmPrimaryTag} / ${packageJson.name}@${packageJson.version}`,
  exactChannelDecisionStatus: metadata.releaseAuthorityStatus.startsWith('APPROVED') ? 'APPROVED' : 'PENDING',
});

module.exports = releasePolicy;
