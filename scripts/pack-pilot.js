#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageRoot = path.resolve(__dirname, '..');
const packageJson = require('../package.json');
const distRoot = path.join(packageRoot, 'dist');
const expectedTarball = path.join(distRoot, `${packageJson.name}-${packageJson.version}.tgz`);
const packReportPath = path.join(distRoot, 'npm-pack-report.json');
const buildReportPath = path.join(distRoot, 'release-build-report.json');
const sbomName = `${packageJson.name}-${packageJson.version}.spdx.json`;
const sbomPath = path.join(distRoot, sbomName);
const checksumsPath = path.join(distRoot, 'SHA256SUMS');
const verificationManifestPath = path.join(distRoot, 'release-verification-manifest.json');
const authorityPublicKeyPath = path.join(distRoot, 'product-os-authority.pub');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

if (packageJson.version !== '0.1.0-pilot.0') {
  throw new Error('pack:pilot requires package version 0.1.0-pilot.0.');
}
if (packageJson.private === true || packageJson.license !== 'Apache-2.0') {
  throw new Error('AUTH-DEC-001 requires publishable metadata and Apache-2.0 for the pilot candidate.');
}
if (packageJson.publishConfig?.access !== 'public' || packageJson.publishConfig?.tag !== 'pilot') {
  throw new Error('Pilot publication metadata must use public access and the pilot tag.');
}
for (const required of [
  path.join(distRoot, `vibe-product-os-skill-${packageJson.version}.zip`),
  path.join(distRoot, `vibe-product-os-codex-plugin-${packageJson.version}.zip`),
  buildReportPath,
  authorityPublicKeyPath,
]) {
  if (!fs.existsSync(required) || !fs.statSync(required).isFile()) {
    throw new Error(`Run npm run dist first; missing ${path.basename(required)}.`);
  }
}

for (const generated of [expectedTarball, packReportPath, sbomPath, checksumsPath, verificationManifestPath]) {
  fs.rmSync(generated, { force: true });
}
for (const entry of fs.readdirSync(distRoot)) {
  if (entry.endsWith('.minisig')) fs.rmSync(path.join(distRoot, entry), { force: true });
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, [
  'pack',
  '--ignore-scripts',
  '--json',
  '--pack-destination',
  distRoot,
], {
  cwd: packageRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    npm_config_cache: path.join(os.tmpdir(), 'vibe-product-os-npm-cache'),
  },
});

if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`npm pack failed: ${result.stderr || result.stdout}`);

const [pack] = JSON.parse(result.stdout);
if (!pack || pack.filename !== path.basename(expectedTarball) || !fs.existsSync(expectedTarball)) {
  throw new Error('npm pack did not produce the expected pilot tarball.');
}

const prohibited = pack.files
  .map((entry) => entry.path)
  .filter((entry) => (
    entry.startsWith('test/')
    || entry.startsWith('scripts/')
    || entry.startsWith('outputs/')
    || entry.startsWith('dist/')
    || entry.startsWith('reports/')
    || entry.startsWith('vendor/')
    || entry.includes('node_modules/')
    || /(?:^|\/)(?:\.git|\.github)(?:\/|$)/u.test(entry)
    || /\.(?:key|sec|pem|p12|pfx)$/iu.test(entry)
  ));
if (prohibited.length) throw new Error(`npm tarball contains prohibited paths: ${prohibited.join(', ')}`);

const tarballSha256 = sha256(expectedTarball);
const generatedAt = new Date().toISOString();
const sbom = {
  spdxVersion: 'SPDX-2.3',
  dataLicense: 'CC0-1.0',
  SPDXID: 'SPDXRef-DOCUMENT',
  name: `${packageJson.name}-${packageJson.version}`,
  documentNamespace: `https://shiro7.github.io/vibe-product-os/sbom/${packageJson.version}/${tarballSha256}`,
  creationInfo: {
    created: generatedAt,
    creators: ['Organization: M.M.Eyada', 'Tool: vibe-product-os-pack-pilot'],
  },
  packages: [
    {
      name: packageJson.name,
      SPDXID: 'SPDXRef-Package-VibeProductOS',
      versionInfo: packageJson.version,
      downloadLocation: 'NOASSERTION',
      filesAnalyzed: false,
      licenseConcluded: 'Apache-2.0',
      licenseDeclared: 'Apache-2.0',
      copyrightText: 'Copyright 2026 M.M.Eyada',
      checksums: [{ algorithm: 'SHA256', checksumValue: tarballSha256 }],
    },
    {
      name: 'Product OS',
      SPDXID: 'SPDXRef-Package-ProductOS',
      versionInfo: '1.0.0',
      downloadLocation: 'NOASSERTION',
      filesAnalyzed: false,
      licenseConcluded: 'Apache-2.0',
      licenseDeclared: 'Apache-2.0',
      copyrightText: 'Copyright 2026 M.M.Eyada',
    },
  ],
  relationships: [
    { spdxElementId: 'SPDXRef-DOCUMENT', relationshipType: 'DESCRIBES', relatedSpdxElement: 'SPDXRef-Package-VibeProductOS' },
    { spdxElementId: 'SPDXRef-Package-VibeProductOS', relationshipType: 'CONTAINS', relatedSpdxElement: 'SPDXRef-Package-ProductOS' },
  ],
};
writeJson(sbomPath, sbom);

const buildReport = JSON.parse(fs.readFileSync(buildReportPath, 'utf8'));
buildReport.completed_at = generatedAt;
buildReport.build_status = 'PILOT_CANDIDATE_BUILT_UNSIGNED';
buildReport.package_publication_metadata = {
  private_guard: false,
  access: packageJson.publishConfig.access,
  tag: packageJson.publishConfig.tag,
  metadata_is_release_authority: false,
};
buildReport.license_status = 'AUTH_DEC_001_APPROVED_APACHE_2_0';
buildReport.npm_tarball = {
  file: path.basename(expectedTarball),
  size_bytes: fs.statSync(expectedTarball).size,
  sha256: tarballSha256,
  npm_integrity: pack.integrity,
  npm_shasum_sha1: pack.shasum,
  entry_count: pack.entryCount,
  unpacked_size_bytes: pack.unpackedSize,
};
buildReport.sbom = { file: sbomName, size_bytes: fs.statSync(sbomPath).size, sha256: sha256(sbomPath) };
writeJson(buildReportPath, buildReport);

const checksumSubjectNames = [
  `vibe-product-os-skill-${packageJson.version}.zip`,
  `vibe-product-os-codex-plugin-${packageJson.version}.zip`,
  path.basename(expectedTarball),
  sbomName,
  path.basename(buildReportPath),
].sort();
const checksumLines = checksumSubjectNames.map((name) => `${sha256(path.join(distRoot, name))}  ${name}`);
fs.writeFileSync(checksumsPath, `${checksumLines.join('\n')}\n`, 'utf8');

const releaseSubjectDefinitions = [
  ['SKILL-ZIP', `vibe-product-os-skill-${packageJson.version}.zip`],
  ['CODEX-PLUGIN-ZIP', `vibe-product-os-codex-plugin-${packageJson.version}.zip`],
  ['NPM-TARBALL', path.basename(expectedTarball)],
  ['SPDX-SBOM', sbomName],
  ['RELEASE-BUILD-REPORT', path.basename(buildReportPath)],
  ['RELEASE-CHECKSUMS', path.basename(checksumsPath)],
];
const releaseSubjects = releaseSubjectDefinitions.map(([subjectId, file]) => {
  const absolute = path.join(distRoot, file);
  return {
    subject_id: subjectId,
    path: file,
    size_bytes: fs.statSync(absolute).size,
    digest_algorithm: 'sha256',
    sha256: sha256(absolute),
    signature_path: null,
    public_key_path: null,
  };
});

writeJson(verificationManifestPath, {
  manifest_id: 'VIBE-PRODUCT-OS-PILOT-RELEASE-VERIFICATION-001',
  manifest_version: '1.0.0',
  release_root: '.',
  package: packageJson.name,
  package_version: packageJson.version,
  framework_release: '1.0.0',
  source_release: 'Product-OS-v1.0-rc.2',
  release_status: 'PILOT_CANDIDATE_PUBLICATION_PREPARATION_UNSIGNED',
  generated_at: generatedAt,
  signature_policy: 'MINISIGN_REQUIRED_FOR_MANIFEST_AND_EVERY_EXTERNAL_DISTRIBUTION_SUBJECT',
  manifest_signature_path: null,
  manifest_public_key_path: null,
  conditions: [
    { condition_id: 'AUTH-COND-001', status: 'CLOSED' },
    { condition_id: 'AUTH-COND-002', status: 'OPEN_POST_BASELINE' },
    { condition_id: 'AUTH-COND-004', status: 'CLOSED' },
  ],
  package_release_controls: [
    { control_id: 'PACKAGE_RELEASE_SIGNATURES', status: 'PENDING' },
    { control_id: 'PUBLIC_USE_LICENSE_DECISION', status: 'APPROVED', authority_ref: 'AUTH-DEC-001', value: 'Apache-2.0' },
    { control_id: 'PUBLIC_SUPPORT_AND_SECURITY_CHANNELS', status: 'ACTIVE_VERIFIED', authority_ref: 'AUTH-DEC-001', evidence_ref: 'governance/authority/PUBLIC_CHANNEL_ACTIVATION_EVIDENCE_2026-08-25.json' },
    { control_id: 'EXACT_CHANNEL_AUTHORITY_DECISION', status: 'APPROVED', authority_ref: 'AUTH-DEC-002', value: 'npm public / pilot / vibe-product-os@0.1.0-pilot.0' },
  ],
  authority_claim: 'NONE',
  external_distribution_authorized: false,
  claim_boundary: 'PRODUCT_OS_V1_WITH_REAL_PROJECT_VALIDATION_IN_PROGRESS',
  subjects: releaseSubjects,
});

const packReport = {
  report_id: 'VIBE-PRODUCT-OS-PILOT-NPM-PACK-001',
  package: packageJson.name,
  version: packageJson.version,
  status: 'PILOT_CANDIDATE_LOCAL_TARBALL',
  external_distribution_authorized: false,
  external_distribution_blockers: [
    'PACKAGE_RELEASE_SIGNATURES_PENDING',
  ],
  filename: pack.filename,
  size_bytes: fs.statSync(expectedTarball).size,
  unpacked_size_bytes: pack.unpackedSize,
  entry_count: pack.entryCount,
  npm_shasum_sha1: pack.shasum,
  npm_integrity: pack.integrity,
  sha256: tarballSha256,
  prohibited_path_count: prohibited.length,
  release_subject_count: releaseSubjects.length,
};
writeJson(packReportPath, packReport);

process.stdout.write(`${JSON.stringify(packReport, null, 2)}\n`);
