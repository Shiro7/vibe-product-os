'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const identity = require('./identity');
const releasePolicy = require('./release-policy');

function verificationError(message, details = {}) {
  const error = new Error(message);
  error.exitCode = 5;
  error.details = details;
  return error;
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function safeLeaf(root, value, field) {
  if (typeof value !== 'string' || !value || value !== path.basename(value) || ['.', '..'].includes(value)) {
    throw verificationError(`${field} must be a single file name inside the manifest directory.`);
  }
  const target = path.resolve(root, value);
  if (path.dirname(target) !== root) throw verificationError(`${field} escapes the manifest directory.`);
  return target;
}

function regularFile(file) {
  try {
    const stat = fs.lstatSync(file);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function validateManifest(manifest, manifestPath) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw verificationError('Release verification manifest must be a JSON object.');
  if (manifest.manifest_version !== '1.0.0') throw verificationError('Unsupported release verification manifest version.');
  if (!Array.isArray(manifest.subjects) || manifest.subjects.length === 0) throw verificationError('Release verification manifest must contain at least one subject.');
  if (manifest.release_root !== '.') throw verificationError('release_root must be "."; release subjects cannot escape the manifest directory.');
  const hasManifestSignature = manifest.manifest_signature_path !== null && manifest.manifest_signature_path !== undefined;
  const hasManifestPublicKey = manifest.manifest_public_key_path !== null && manifest.manifest_public_key_path !== undefined;
  if (hasManifestSignature !== hasManifestPublicKey) throw verificationError('Manifest signature configuration is incomplete.');
  if (hasManifestSignature) {
    safeLeaf(path.dirname(manifestPath), manifest.manifest_signature_path, 'manifest_signature_path');
    safeLeaf(path.dirname(manifestPath), manifest.manifest_public_key_path, 'manifest_public_key_path');
  }
  const ids = new Set();
  const paths = new Set();
  for (const subject of manifest.subjects) {
    if (!subject || typeof subject !== 'object' || Array.isArray(subject)) throw verificationError('Every release subject must be an object.');
    if (typeof subject.subject_id !== 'string' || !subject.subject_id) throw verificationError('Every release subject requires subject_id.');
    if (ids.has(subject.subject_id)) throw verificationError(`Duplicate release subject ID: ${subject.subject_id}`);
    ids.add(subject.subject_id);
    safeLeaf(path.dirname(manifestPath), subject.path, `subjects[${subject.subject_id}].path`);
    if (paths.has(subject.path)) throw verificationError(`Duplicate release subject path: ${subject.path}`);
    paths.add(subject.path);
    if (subject.digest_algorithm !== 'sha256' || !/^[a-f0-9]{64}$/u.test(subject.sha256 || '')) {
      throw verificationError(`Release subject ${subject.subject_id} requires a lowercase SHA-256 digest.`);
    }
    if (!Number.isSafeInteger(subject.size_bytes) || subject.size_bytes < 0) throw verificationError(`Release subject ${subject.subject_id} has an invalid size.`);
    if (subject.signature_path !== null && subject.signature_path !== undefined) safeLeaf(path.dirname(manifestPath), subject.signature_path, `subjects[${subject.subject_id}].signature_path`);
    if (subject.public_key_path !== null && subject.public_key_path !== undefined) safeLeaf(path.dirname(manifestPath), subject.public_key_path, `subjects[${subject.subject_id}].public_key_path`);
  }
}

function verifyMinisign(subjectPath, signaturePath, publicKeyPath, options = {}) {
  const command = options.minisignCommand || 'minisign';
  const result = spawnSync(command, ['-Vm', subjectPath, '-x', signaturePath, '-p', publicKeyPath], {
    encoding: 'utf8',
    shell: false,
    env: options.env || process.env,
  });
  if (result.error && result.error.code === 'ENOENT') return { status: 'TOOL_UNAVAILABLE', detail: 'minisign executable was not found.' };
  if (result.error) return { status: 'ERROR', detail: result.error.message };
  if (result.status !== 0) return { status: 'INVALID', detail: (result.stderr || result.stdout || 'minisign rejected the signature.').trim() };
  return { status: 'VERIFIED', detail: (result.stdout || result.stderr || 'Signature verified.').trim() };
}

function verifyRelease(options = {}) {
  if (!options.manifest) throw verificationError('verify-release requires --manifest <path>.');
  const manifestPath = path.resolve(options.manifest);
  if (!regularFile(manifestPath)) throw verificationError(`Release verification manifest is missing or not a regular file: ${manifestPath}`);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw verificationError(`Release verification manifest is not valid JSON: ${error.message}`);
  }
  validateManifest(manifest, manifestPath);

  const root = path.dirname(manifestPath);
  const expectedPublicKeySha256 = options.expectedPublicKeySha256 || releasePolicy.authorityPublicKeySha256;
  let manifestSignature = { status: 'NOT_CONFIGURED' };
  if (manifest.manifest_signature_path && manifest.manifest_public_key_path) {
    const signaturePath = safeLeaf(root, manifest.manifest_signature_path, 'manifest_signature_path');
    const publicKeyPath = safeLeaf(root, manifest.manifest_public_key_path, 'manifest_public_key_path');
    manifestSignature = !regularFile(signaturePath) || !regularFile(publicKeyPath)
      ? { status: 'MISSING_OR_UNSAFE' }
      : sha256File(publicKeyPath) !== expectedPublicKeySha256
        ? { status: 'UNTRUSTED_KEY', detail: 'Manifest public key does not match the pinned Authority key.' }
        : verifyMinisign(manifestPath, signaturePath, publicKeyPath, options);
  }
  const results = [];
  for (const subject of manifest.subjects) {
    const subjectPath = safeLeaf(root, subject.path, `${subject.subject_id}.path`);
    const entry = {
      subject_id: subject.subject_id,
      path: subject.path,
      expected_size_bytes: subject.size_bytes,
      expected_sha256: subject.sha256,
      byte_identity: 'NOT_VERIFIED',
      signature_identity: 'NOT_VERIFIED',
    };
    if (!regularFile(subjectPath)) {
      entry.byte_identity = 'MISSING_OR_UNSAFE';
      entry.signature_identity = 'NOT_ATTEMPTED';
      results.push(entry);
      continue;
    }
    entry.actual_size_bytes = fs.statSync(subjectPath).size;
    entry.actual_sha256 = sha256File(subjectPath);
    entry.byte_identity = entry.actual_size_bytes === subject.size_bytes && entry.actual_sha256 === subject.sha256
      ? 'VERIFIED'
      : 'MISMATCH';

    const hasSignature = subject.signature_path !== null && subject.signature_path !== undefined;
    const hasPublicKey = subject.public_key_path !== null && subject.public_key_path !== undefined;
    if (!hasSignature && !hasPublicKey) {
      entry.signature_identity = 'NOT_CONFIGURED';
    } else if (!hasSignature || !hasPublicKey) {
      entry.signature_identity = 'INCOMPLETE_CONFIGURATION';
    } else {
      const signaturePath = safeLeaf(root, subject.signature_path, `${subject.subject_id}.signature_path`);
      const publicKeyPath = safeLeaf(root, subject.public_key_path, `${subject.subject_id}.public_key_path`);
      if (!regularFile(signaturePath) || !regularFile(publicKeyPath)) entry.signature_identity = 'MISSING_OR_UNSAFE';
      else if (sha256File(publicKeyPath) !== expectedPublicKeySha256) {
        entry.signature_identity = 'UNTRUSTED_KEY';
        entry.signature_detail = 'Subject public key does not match the pinned Authority key.';
      }
      else {
        const signature = verifyMinisign(subjectPath, signaturePath, publicKeyPath, options);
        entry.signature_identity = signature.status;
        entry.signature_detail = signature.detail;
      }
    }
    results.push(entry);
  }

  const bytesVerified = results.every((entry) => entry.byte_identity === 'VERIFIED');
  const signaturesVerified = manifestSignature.status === 'VERIFIED'
    && results.every((entry) => entry.signature_identity === 'VERIFIED');
  const signatureFailure = !['VERIFIED', 'NOT_CONFIGURED'].includes(manifestSignature.status)
    || results.some((entry) => !['VERIFIED', 'NOT_CONFIGURED'].includes(entry.signature_identity));
  const requiredSignatureFailure = Boolean(options.requireSignatures) && !signaturesVerified;
  const verificationPassed = bytesVerified && !signatureFailure && !requiredSignatureFailure;
  const exactChannelControl = manifest.package_release_controls?.find((item) => item.control_id === 'EXACT_CHANNEL_AUTHORITY_DECISION');
  const approvedExactChannelValues = new Set([
    `npm public / pilot / ${manifest.package}@${manifest.package_version}`,
    `npm public / pilot+latest / ${manifest.package}@${manifest.package_version}`,
  ]);
  const exactAuthorityDecisionApproved = exactChannelControl?.status === 'APPROVED'
    && /^AUTH-DEC-\d+$/u.test(exactChannelControl.authority_ref || '')
    && approvedExactChannelValues.has(exactChannelControl.value);
  const externalDistributionAuthorized = signaturesVerified && exactAuthorityDecisionApproved;
  const blockers = [];
  if (!signaturesVerified) blockers.push('PACKAGE_RELEASE_SIGNATURES_PENDING');
  if (!exactAuthorityDecisionApproved) blockers.push('EXACT_CHANNEL_AUTHORITY_DECISION_PENDING');
  return {
    command: 'verify-release',
    manifest_id: manifest.manifest_id,
    manifest_path: manifestPath,
    package: manifest.package,
    package_version: manifest.package_version,
    framework_release: manifest.framework_release,
    source_release: manifest.source_release,
    result: verificationPassed ? 'PASS' : 'FAIL',
    byte_identity: bytesVerified ? 'VERIFIED' : 'FAILED',
    publisher_identity: signaturesVerified ? 'VERIFIED' : 'NOT_VERIFIED',
    manifest_signature_identity: manifestSignature.status,
    manifest_signature_detail: manifestSignature.detail,
    signatures_required: Boolean(options.requireSignatures),
    ready_for_authority_signing: bytesVerified && !signaturesVerified && !signatureFailure,
    publisher_key_identity: signaturesVerified ? 'PINNED_AUTHORITY_KEY_VERIFIED' : 'NOT_VERIFIED',
    exact_channel_authority_decision: exactAuthorityDecisionApproved ? exactChannelControl.authority_ref : null,
    external_distribution_authorized: externalDistributionAuthorized,
    external_distribution_ready: externalDistributionAuthorized,
    blockers,
    claim_boundaries: [identity.production_claim_blocker],
    authority_claim: externalDistributionAuthorized ? 'SIGNED_EXACT_RELEASE_AUTHORIZATION' : 'NONE',
    no_files_changed: true,
    subjects: results,
    exit_code: verificationPassed ? 0 : 5,
  };
}

module.exports = { verifyRelease, verifyMinisign, validateManifest, sha256File, verificationError };
