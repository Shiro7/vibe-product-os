'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const runtime = require('./runtime');
const identity = require('./identity');

const { parseDocument } = require(path.join(runtime.AUTOMATION_ROOT, 'lib', 'serialization.js'));
const { SchemaRegistry } = require(path.join(runtime.AUTOMATION_ROOT, 'lib', 'schema-registry.js'));
const { isInside } = require(path.join(runtime.AUTOMATION_ROOT, 'lib', 'fs-safe.js'));

const CONTROL_PATHS = [
  'product-os.yaml',
  '.product-os/framework.lock.yaml',
  '.product-os/repository-index.yaml',
  '.product-os/profile-composition.yaml',
  '.product-os/artifact-register.yaml',
];

const CATALOG_PATHS = [
  'schema-catalog.json',
  'artifact-catalog.json',
  'profile-catalog.json',
  'gate-catalog.json',
];

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function safeRegularInside(root, file) {
  try {
    if (!isInside(root, file)) return false;
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) return false;
    return isInside(fs.realpathSync(root), fs.realpathSync(file));
  } catch {
    return false;
  }
}

function statusError(message, details = {}) {
  const error = new Error(message);
  error.exitCode = 4;
  error.details = details;
  return error;
}

function countBy(values, key) {
  const result = {};
  for (const value of values) {
    const label = typeof key === 'function' ? key(value) : value[key];
    result[label] = (result[label] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

function loadProject(projectRoot) {
  const controls = {};
  for (const relativePath of CONTROL_PATHS) {
    const file = path.join(projectRoot, relativePath);
    if (!safeRegularInside(projectRoot, file)) {
      throw statusError(`Required initialized Product OS control is missing: ${file}`);
    }
    controls[relativePath] = parseDocument(file);
  }

  const registry = new SchemaRegistry(runtime.FRAMEWORK_ROOT);
  const validationErrors = [];
  for (const [relativePath, document] of Object.entries(controls)) {
    validationErrors.push(...registry.validateDocument(document).map((item) => ({ file: relativePath, ...item })));
  }
  if (validationErrors.length) {
    throw statusError(`Existing Product OS controls failed schema validation (${validationErrors.length} errors).`, { validationErrors });
  }

  const projectIds = new Set(Object.values(controls).map((document) => document.project_id).filter(Boolean));
  if (projectIds.size !== 1) throw statusError(`Project identity mismatch across controls: ${[...projectIds].join(', ')}`);
  return { controls, schemaCount: registry.schemas.size };
}

function inspectLocator(projectRoot, entry) {
  const locator = entry.canonical_locator;
  const [value, anchor] = locator.value.split('#');
  if (locator.locator_class !== 'REPOSITORY_RELATIVE') {
    return { artifact_id: entry.artifact_id, locator: locator.value, expected_access: locator.access_status, observed: 'EXTERNAL_OR_NON_FILE' };
  }
  const absolute = path.resolve(projectRoot, value);
  if (!isInside(projectRoot, absolute)) {
    return { artifact_id: entry.artifact_id, locator: locator.value, expected_access: locator.access_status, observed: 'PATH_ESCAPE' };
  }
  const exists = fs.existsSync(absolute);
  const safe = exists && safeRegularInside(projectRoot, absolute);
  const kind = exists ? (fs.lstatSync(absolute).isFile() ? 'FILE' : fs.lstatSync(absolute).isDirectory() ? 'DIRECTORY' : fs.lstatSync(absolute).isSymbolicLink() ? 'SYMLINK' : 'OTHER') : null;
  const anchorExists = safe && anchor && kind === 'FILE'
    ? fs.readFileSync(absolute, 'utf8').includes(`<a id="${anchor}"></a>`)
    : true;
  return {
    artifact_id: entry.artifact_id,
    locator: locator.value,
    expected_access: locator.access_status,
    observed: exists && !safe ? 'UNSAFE_PATH' : exists && anchorExists ? 'AVAILABLE' : 'MISSING',
    kind,
    anchor: anchor || null,
    anchor_observed: anchor ? anchorExists : null,
  };
}

function projectStatus(options = {}) {
  const projectRoot = path.resolve(options.project || process.cwd());
  const { controls, schemaCount } = loadProject(projectRoot);
  const manifest = controls['product-os.yaml'];
  const lock = controls['.product-os/framework.lock.yaml'];
  const composition = controls['.product-os/profile-composition.yaml'];
  const register = controls['.product-os/artifact-register.yaml'];
  const entries = register.entries || [];
  const packages = composition.packages || [];
  const modules = composition.modules || [];
  const findings = [];

  const entryIds = entries.map((entry) => entry.artifact_id);
  const duplicateEntries = [...new Set(entryIds.filter((id, index) => entryIds.indexOf(id) !== index))].sort();
  for (const artifactId of duplicateEntries) findings.push({ code: 'STATUS-REG-001', severity: 'ERROR', artifact_id: artifactId, message: 'Duplicate GOV-002 artifact entry.' });

  const memberships = packages.flatMap((pkg) => (pkg.members || []).map((member) => ({ artifact_id: member.artifact_id, package_id: pkg.package_id })));
  const duplicateMemberships = [...new Set(memberships.map((item) => item.artifact_id).filter((id, index, values) => values.indexOf(id) !== index))].sort();
  for (const artifactId of duplicateMemberships) findings.push({ code: 'STATUS-PKG-001', severity: 'ERROR', artifact_id: artifactId, message: 'Artifact has multiple current physical package memberships.' });

  const locatorObservations = entries.map((entry) => inspectLocator(projectRoot, entry));
  for (const observation of locatorObservations) {
    if (observation.observed === 'PATH_ESCAPE') findings.push({ code: 'STATUS-PATH-001', severity: 'ERROR', ...observation, message: 'Canonical locator escapes the project root.' });
    if (observation.observed === 'UNSAFE_PATH') findings.push({ code: 'STATUS-PATH-004', severity: 'ERROR', ...observation, message: 'Canonical locator resolves through a symlink or outside the real project root.' });
    if (observation.expected_access === 'AVAILABLE' && observation.observed === 'MISSING') findings.push({ code: 'STATUS-PATH-002', severity: 'ERROR', ...observation, message: 'Register claims AVAILABLE but the canonical path is missing.' });
    if (observation.expected_access === 'MISSING' && observation.observed === 'AVAILABLE') findings.push({ code: 'STATUS-PATH-003', severity: 'WARNING', ...observation, message: 'Register claims MISSING but a physical path exists.' });
  }

  const pendingArtifacts = entries.filter((entry) => entry.applicability === 'PENDING').map((entry) => entry.artifact_id).sort();
  if (pendingArtifacts.length) findings.push({ code: 'STATUS-APP-001', severity: 'WARNING', count: pendingArtifacts.length, message: 'Artifacts have unresolved applicability.' });
  const unassignedOwners = entries.filter((entry) => entry.owner && entry.owner.actor_type === 'UNASSIGNED').map((entry) => entry.artifact_id).sort();
  if (unassignedOwners.length) findings.push({ code: 'STATUS-OWN-001', severity: 'WARNING', count: unassignedOwners.length, message: 'Artifacts have unassigned ownership.' });
  const staleArtifacts = entries.filter((entry) => ['BLOCKED', 'REOPENED', 'DEPRECATED'].includes(entry.status)).map((entry) => entry.artifact_id).sort();
  if (staleArtifacts.length) findings.push({ code: 'STATUS-LIFE-001', severity: 'WARNING', count: staleArtifacts.length, message: 'Artifacts require lifecycle attention.' });

  const frameworkIdentityMatches = manifest.product_os_release === lock.framework_release
    && manifest.product_os_release === register.framework_version
    && manifest.product_os_release === identity.framework_version;
  if (!frameworkIdentityMatches) findings.push({ code: 'STATUS-FWK-001', severity: 'ERROR', message: 'Project framework identities do not match the bundled Product OS 1.0.0 runtime.' });

  const runtimeLock = JSON.parse(fs.readFileSync(runtime.RUNTIME_LOCK, 'utf8'));
  const frameworkSourceMatches = lock.framework_source_revision === identity.source_release
    && lock.framework_digest
    && lock.framework_digest.algorithm === 'sha256'
    && lock.framework_digest.value === runtimeLock.source_release_aggregate_identity_sha256;
  if (!frameworkSourceMatches) findings.push({ code: 'STATUS-FWK-002', severity: 'WARNING', message: 'Framework release matches, but the project lock is not pinned to the bundled rc.2 source identity; preview update.' });

  const catalogSnapshots = CATALOG_PATHS.map((file) => {
    const projectFile = path.join(projectRoot, '.product-os', 'state', 'catalogs', file);
    const bundledFile = path.join(runtime.FRAMEWORK_ROOT, 'catalogs', file);
    const safeProjectFile = safeRegularInside(projectRoot, projectFile);
    const matches = safeProjectFile && fs.existsSync(bundledFile) && sha256File(projectFile) === sha256File(bundledFile);
    if (!matches) findings.push({ code: 'STATUS-CAT-001', severity: 'WARNING', path: path.relative(projectRoot, projectFile), message: 'Project catalog snapshot differs from the bundled same-release catalog; preview update.' });
    return { file, path: path.relative(projectRoot, projectFile), identity_match: matches };
  });

  const errors = findings.filter((item) => item.severity === 'ERROR').length;
  const warnings = findings.filter((item) => item.severity === 'WARNING').length;
  const report = {
    command: 'status',
    mode: 'READ_ONLY',
    project_root: projectRoot,
    project: {
      project_id: manifest.project_id,
      project_name: manifest.project_name,
      project_status: manifest.project_status,
      lifecycle_mode: manifest.lifecycle_mode,
      profile: manifest.default_profile,
      active_phases: manifest.active_phases,
      current_gate_refs: manifest.current_gate_refs,
      active_modules: manifest.active_modules,
      owner: manifest.project_owner,
    },
    framework: {
      project_release: manifest.product_os_release,
      locked_release: lock.framework_release,
      bundled_release: '1.0.0',
      source_release: 'Product-OS-v1.0-rc.2',
      identity_match: frameworkIdentityMatches,
      source_identity_match: frameworkSourceMatches,
      catalog_snapshots_match: catalogSnapshots.every((item) => item.identity_match),
      catalog_snapshots: catalogSnapshots,
      schema_count: schemaCount,
    },
    artifacts: {
      registered: entries.length,
      by_status: countBy(entries, 'status'),
      by_applicability: countBy(entries, 'applicability'),
      by_approval: countBy(entries, 'approval_status'),
      by_verification: countBy(entries, 'verification_status'),
      materialized: locatorObservations.filter((item) => item.observed === 'AVAILABLE').length,
      pending_ids: pendingArtifacts,
      unassigned_owner_ids: unassignedOwners,
      lifecycle_attention_ids: staleArtifacts,
    },
    composition: {
      composition_version: composition.composition_version,
      packages: packages.length,
      package_types: countBy(packages, 'package_type'),
      modules: modules.length,
      module_applicability: countBy(modules, 'applicability'),
      active_domain_overrides: (composition.domain_overrides || []).filter((item) => item.status === 'ACTIVE').map((item) => item.domain_id).sort(),
    },
    visibility_limits: {
      decision_log_detail: 'NOT_DERIVED_FROM_FREEFORM_GOV-003_CONTENT',
      gate_outcome: 'NOT_INFERRED_FROM_CURRENT_GATE_REFERENCE',
      compliance: 'NOT_DECLARED',
    },
    findings,
    summary: {
      result: errors ? 'FAIL' : warnings ? 'PASS_WITH_ATTENTION' : 'PASS',
      errors,
      warnings,
      finding_count: findings.length,
    },
    automation_authority: 'STRUCTURAL_AND_DETERMINISTIC_ONLY',
    approval_claim: 'NONE',
    no_files_changed: true,
  };
  if (options.strict && (errors || warnings)) report.strict_exit_code = 1;
  return report;
}

module.exports = { CONTROL_PATHS, CATALOG_PATHS, projectStatus, loadProject, inspectLocator, safeRegularInside };
