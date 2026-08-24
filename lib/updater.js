'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const runtime = require('./runtime');
const identity = require('./identity');
const { loadProject } = require('./status');

const { stringifyYaml, parseDocument } = require(path.join(runtime.AUTOMATION_ROOT, 'lib', 'serialization.js'));
const { SchemaRegistry } = require(path.join(runtime.AUTOMATION_ROOT, 'lib', 'schema-registry.js'));
const { isInside, assertNoSymlinkEscape } = require(path.join(runtime.AUTOMATION_ROOT, 'lib', 'fs-safe.js'));

const CATALOGS = [
  { id: 'SCHEMA-CATALOG', name: 'schema', relativePath: '.product-os/state/catalogs/schema-catalog.json' },
  { id: 'ARTIFACT-CATALOG', name: 'artifact', relativePath: '.product-os/state/catalogs/artifact-catalog.json' },
  { id: 'PROFILE-CATALOG', name: 'profile', relativePath: '.product-os/state/catalogs/profile-catalog.json' },
  { id: 'GATE-CATALOG', name: 'gate', relativePath: '.product-os/state/catalogs/gate-catalog.json' },
];

function updateError(message, details = {}) {
  const error = new Error(message);
  error.exitCode = 4;
  error.details = details;
  return error;
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha256File(file) {
  return sha256Buffer(fs.readFileSync(file));
}

function bumpMinor(version) {
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/u);
  if (!match) throw updateError(`Invalid semantic version ${JSON.stringify(version)}.`);
  return `${match[1]}.${Number(match[2]) + 1}.0`;
}

function updateId(now) {
  return `UPDATE-${now.replace(/[^0-9]/gu, '').slice(0, 14)}`;
}

function atomicReplace(root, relativePath, content) {
  const target = path.resolve(root, relativePath);
  if (!isInside(root, target)) throw updateError(`Update target escapes project root: ${relativePath}`);
  assertNoSymlinkEscape(root, path.dirname(target));
  if (!fs.existsSync(target) || !fs.lstatSync(target).isFile()) throw updateError(`Update target is not an existing regular file: ${relativePath}`);
  const temporary = `${target}.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
  fs.writeFileSync(temporary, content, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  fs.renameSync(temporary, target);
}

function writeNew(root, relativePath, content) {
  const target = path.resolve(root, relativePath);
  if (!isInside(root, target)) throw updateError(`Update evidence target escapes project root: ${relativePath}`);
  assertNoSymlinkEscape(root, path.dirname(target));
  if (fs.existsSync(target)) throw updateError(`Refusing to overwrite update evidence: ${relativePath}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
}

function targetCatalogs() {
  return CATALOGS.map((item) => {
    const source = path.join(runtime.FRAMEWORK_ROOT, 'catalogs', `${item.name}-catalog.json`);
    if (!fs.existsSync(source)) throw updateError(`Bundled target catalog is missing: ${source}`);
    const content = fs.readFileSync(source);
    const document = JSON.parse(content.toString('utf8'));
    return { ...item, source, content, document, sha256: sha256Buffer(content), version: document.catalog_version };
  });
}

function buildTargetLock(current, projectId, catalogs, authorityRef, changeRef, now) {
  const runtimeLock = JSON.parse(fs.readFileSync(runtime.RUNTIME_LOCK, 'utf8'));
  const byId = new Map(catalogs.map((item) => [item.id, item]));
  const assets = current.assets.map((asset) => {
    const target = byId.get(asset.asset_id);
    if (!target) return asset;
    return {
      ...asset,
      version: target.version,
      revision: target.sha256,
      digest: { algorithm: 'sha256', value: target.sha256 },
      status: 'ACTIVE',
      compatibility: 'COMPATIBLE',
    };
  });
  return {
    ...current,
    lock_version: bumpMinor(current.lock_version),
    framework_release: identity.framework_version,
    framework_source_revision: identity.source_release,
    framework_digest: { algorithm: 'sha256', value: runtimeLock.source_release_aggregate_identity_sha256 },
    schema_catalog_version: byId.get('SCHEMA-CATALOG').version,
    schema_catalog_digest: { algorithm: 'sha256', value: byId.get('SCHEMA-CATALOG').sha256 },
    artifact_catalog_version: byId.get('ARTIFACT-CATALOG').version,
    artifact_catalog_digest: { algorithm: 'sha256', value: byId.get('ARTIFACT-CATALOG').sha256 },
    profile_catalog_version: byId.get('PROFILE-CATALOG').version,
    profile_catalog_digest: { algorithm: 'sha256', value: byId.get('PROFILE-CATALOG').sha256 },
    assets,
    created_at: now,
    created_by: { actor_id: 'VIBE-PRODUCT-OS-UPDATER', actor_type: 'AI_SYSTEM', authority_ref: authorityRef || null },
    approved_by: { actor_id: 'UNASSIGNED', actor_type: 'UNASSIGNED', authority_ref: null },
    change_ref: changeRef || null,
    supersedes: `${current.lock_id}@${current.lock_version}`,
    project_id: projectId,
  };
}

function lockIsCurrent(current, catalogs, runtimeLock) {
  const byId = new Map(catalogs.map((item) => [item.id, item]));
  const digestMatches = (digest, value) => digest
    && digest.algorithm === 'sha256'
    && digest.value === value;
  if (
    current.framework_release !== identity.framework_version
    || current.framework_source_revision !== identity.source_release
    || !digestMatches(current.framework_digest, runtimeLock.source_release_aggregate_identity_sha256)
    || current.schema_catalog_version !== byId.get('SCHEMA-CATALOG').version
    || !digestMatches(current.schema_catalog_digest, byId.get('SCHEMA-CATALOG').sha256)
    || current.artifact_catalog_version !== byId.get('ARTIFACT-CATALOG').version
    || !digestMatches(current.artifact_catalog_digest, byId.get('ARTIFACT-CATALOG').sha256)
    || current.profile_catalog_version !== byId.get('PROFILE-CATALOG').version
    || !digestMatches(current.profile_catalog_digest, byId.get('PROFILE-CATALOG').sha256)
  ) return false;

  const assets = new Map(current.assets.map((asset) => [asset.asset_id, asset]));
  return catalogs.every((catalog) => {
    const asset = assets.get(catalog.id);
    return asset
      && asset.version === catalog.version
      && asset.revision === catalog.sha256
      && digestMatches(asset.digest, catalog.sha256)
      && asset.status === 'ACTIVE'
      && asset.compatibility === 'COMPATIBLE';
  });
}

function validateTargetLock(lock) {
  const registry = new SchemaRegistry(runtime.FRAMEWORK_ROOT);
  const errors = registry.validateDocument(lock);
  if (errors.length) throw updateError(`Target framework lock failed schema validation (${errors.length} errors).`, { errors });
}

function buildPlan(options = {}) {
  const projectRoot = path.resolve(options.project || process.cwd());
  const { controls } = loadProject(projectRoot);
  const manifest = controls['product-os.yaml'];
  const currentLock = controls['.product-os/framework.lock.yaml'];
  const register = controls['.product-os/artifact-register.yaml'];
  const now = options.now || new Date().toISOString();
  const id = updateId(now);
  const blockers = [];

  if (manifest.product_os_release !== identity.framework_version || register.framework_version !== identity.framework_version) {
    blockers.push({
      code: 'UPDATE-REL-001',
      message: `Project release ${manifest.product_os_release}/${register.framework_version} differs from bundled ${identity.framework_version}; an approved schema/content migration plan is required before update.`,
    });
  }

  const catalogs = targetCatalogs();
  const runtimeLock = JSON.parse(fs.readFileSync(runtime.RUNTIME_LOCK, 'utf8'));
  const currentLockMatchesTarget = lockIsCurrent(currentLock, catalogs, runtimeLock);
  const targetLock = currentLockMatchesTarget
    ? currentLock
    : buildTargetLock(currentLock, manifest.project_id, catalogs, options.authorityRef, options.changeRef, now);
  if (!currentLockMatchesTarget) validateTargetLock(targetLock);
  const changes = [];
  for (const catalog of catalogs) {
    const target = path.join(projectRoot, catalog.relativePath);
    if (!fs.existsSync(target) || !fs.lstatSync(target).isFile()) {
      blockers.push({ code: 'UPDATE-CAT-001', path: catalog.relativePath, message: 'Project catalog snapshot is missing or not a regular file.' });
      continue;
    }
    const beforeSha256 = sha256File(target);
    if (beforeSha256 !== catalog.sha256) changes.push({
      kind: 'CATALOG_REPLACE',
      relative_path: catalog.relativePath,
      before_sha256: beforeSha256,
      after_sha256: catalog.sha256,
      content: catalog.content,
    });
  }

  const lockRelativePath = '.product-os/framework.lock.yaml';
  const lockContent = Buffer.from(`${stringifyYaml(targetLock)}\n`, 'utf8');
  const currentLockContent = fs.readFileSync(path.join(projectRoot, lockRelativePath));
  if (sha256Buffer(currentLockContent) !== sha256Buffer(lockContent)) changes.push({
    kind: 'FRAMEWORK_LOCK_REPLACE',
    relative_path: lockRelativePath,
    before_sha256: sha256Buffer(currentLockContent),
    after_sha256: sha256Buffer(lockContent),
    content: lockContent,
  });

  const authorityRequired = changes.length > 0;
  if (options.apply && authorityRequired && (!options.authorityRef || !options.changeRef)) {
    blockers.push({ code: 'UPDATE-AUTH-001', message: 'Update apply requires --authority-ref and --change-ref; automation does not approve its own framework update.' });
  }
  return { projectRoot, manifest, currentLock, targetLock, catalogs, changes, blockers, now, updateId: id };
}

function createBackup(plan) {
  const backupRelativeRoot = `.product-os/state/update-backups/${plan.updateId}`;
  const backupRoot = path.join(plan.projectRoot, backupRelativeRoot);
  assertNoSymlinkEscape(plan.projectRoot, path.dirname(backupRoot));
  if (fs.existsSync(backupRoot)) throw updateError(`Update backup already exists: ${backupRelativeRoot}`);
  const records = [];
  for (const change of plan.changes) {
    const source = path.join(plan.projectRoot, change.relative_path);
    const backupRelativePath = `${backupRelativeRoot}/files/${change.relative_path}`;
    const backup = path.join(plan.projectRoot, backupRelativePath);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(source, backup, fs.constants.COPYFILE_EXCL);
    records.push({
      relative_path: change.relative_path,
      backup_path: backupRelativePath,
      before_sha256: change.before_sha256,
      after_sha256: change.after_sha256,
    });
  }
  const manifest = {
    manifest_id: `${plan.updateId}-BACKUP`,
    manifest_version: '1.0.0',
    update_id: plan.updateId,
    project_id: plan.manifest.project_id,
    created_at: plan.now,
    source_framework_release: plan.currentLock.framework_release,
    target_framework_release: identity.framework_version,
    records,
    restore_rule: 'Rollback only when each current file still matches after_sha256 and every backup matches before_sha256.',
    authority_claim: 'NONE',
  };
  writeNew(plan.projectRoot, `${backupRelativeRoot}/backup-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  return { backupRelativeRoot, manifest };
}

function applyPlan(plan) {
  if (plan.blockers.length) throw updateError(`Update apply blocked by ${plan.blockers.length} blocker(s). Dry-run changed no files.`, { blockers: plan.blockers });
  if (!plan.changes.length) return null;
  const backup = createBackup(plan);
  const originals = new Map(plan.changes.map((change) => [change.relative_path, fs.readFileSync(path.join(plan.projectRoot, change.relative_path))]));
  const written = [];
  try {
    for (const change of plan.changes) {
      atomicReplace(plan.projectRoot, change.relative_path, change.content);
      written.push(change.relative_path);
      const actual = sha256File(path.join(plan.projectRoot, change.relative_path));
      if (actual !== change.after_sha256) throw updateError(`Post-update digest mismatch for ${change.relative_path}.`);
    }
  } catch (error) {
    for (const relativePath of written.reverse()) atomicReplace(plan.projectRoot, relativePath, originals.get(relativePath));
    throw error;
  }
  return backup;
}

function updateProject(options = {}) {
  if (options.rollback) return rollbackProject(options);
  const plan = buildPlan(options);
  const publicPlan = {
    command: 'update',
    mode: options.apply ? 'APPLY' : 'DRY_RUN',
    update_id: plan.updateId,
    project_root: plan.projectRoot,
    project_id: plan.manifest.project_id,
    package_version: identity.package_version,
    current_framework_release: plan.currentLock.framework_release,
    target_framework_release: identity.framework_version,
    target_source_release: identity.source_release,
    status: plan.blockers.length ? 'BLOCKED' : plan.changes.length ? 'UPDATE_AVAILABLE' : 'UP_TO_DATE',
    planned_changes: plan.changes.map(({ content, ...change }) => change),
    blockers: plan.blockers,
    authority_required_for_apply: plan.changes.length > 0,
    authority_claim: 'NONE',
    no_files_changed: !options.apply || plan.changes.length === 0,
  };
  if (!options.apply) return publicPlan;
  const backup = applyPlan(plan);
  return {
    ...publicPlan,
    status: plan.changes.length ? 'APPLIED' : 'UP_TO_DATE',
    no_files_changed: plan.changes.length === 0,
    applied: plan.changes.length > 0,
    backup_path: backup ? backup.backupRelativeRoot : null,
    rollback_command: backup ? `vibe-product-os update --project ${JSON.stringify(plan.projectRoot)} --rollback ${plan.updateId} --authority-ref <ref> --change-ref <ref> --apply` : null,
  };
}

function rollbackProject(options) {
  const projectRoot = path.resolve(options.project || process.cwd());
  if (!/^[A-Z0-9-]+$/u.test(options.rollback)) throw updateError('Rollback must be an exact update ID, not a path.');
  const { controls } = loadProject(projectRoot);
  const projectId = controls['product-os.yaml'].project_id;
  const backupRelativeRoot = `.product-os/state/update-backups/${options.rollback}`;
  const backupRoot = path.join(projectRoot, backupRelativeRoot);
  const manifestPath = path.join(backupRoot, 'backup-manifest.json');
  if (!fs.existsSync(manifestPath) || !fs.lstatSync(manifestPath).isFile()) throw updateError(`Rollback manifest is missing: ${backupRelativeRoot}/backup-manifest.json`);
  const manifest = parseDocument(manifestPath);
  if (manifest.update_id !== options.rollback || manifest.project_id !== projectId) throw updateError('Rollback manifest identity does not match the requested project/update.');
  const blockers = [];
  for (const record of manifest.records) {
    const current = path.resolve(projectRoot, record.relative_path);
    const backup = path.resolve(projectRoot, record.backup_path);
    if (!isInside(projectRoot, current) || !isInside(backupRoot, backup)) blockers.push({ code: 'UPDATE-RBK-001', path: record.relative_path, message: 'Rollback record escapes its governed root.' });
    else {
      try {
        assertNoSymlinkEscape(projectRoot, path.dirname(current));
        assertNoSymlinkEscape(backupRoot, path.dirname(backup));
      } catch {
        blockers.push({ code: 'UPDATE-RBK-004', path: record.relative_path, message: 'Rollback record resolves through an unsafe symlink.' });
        continue;
      }
      const currentSafe = fs.existsSync(current) && fs.lstatSync(current).isFile() && !fs.lstatSync(current).isSymbolicLink();
      const backupSafe = fs.existsSync(backup) && fs.lstatSync(backup).isFile() && !fs.lstatSync(backup).isSymbolicLink();
      if (!currentSafe || sha256File(current) !== record.after_sha256) blockers.push({ code: 'UPDATE-RBK-002', path: record.relative_path, message: 'Current file changed after update; automatic rollback is unsafe.' });
      else if (!backupSafe || sha256File(backup) !== record.before_sha256) blockers.push({ code: 'UPDATE-RBK-003', path: record.backup_path, message: 'Backup digest does not match the recorded pre-update file.' });
    }
  }
  if (options.apply && (!options.authorityRef || !options.changeRef)) blockers.push({ code: 'UPDATE-AUTH-002', message: 'Rollback apply requires --authority-ref and --change-ref.' });
  const report = {
    command: 'update',
    operation: 'ROLLBACK',
    mode: options.apply ? 'APPLY' : 'DRY_RUN',
    update_id: options.rollback,
    project_root: projectRoot,
    project_id: projectId,
    status: blockers.length ? 'BLOCKED' : 'ROLLBACK_AVAILABLE',
    records: manifest.records,
    blockers,
    authority_claim: 'NONE',
    no_files_changed: !options.apply,
  };
  if (!options.apply) return report;
  if (blockers.length) throw updateError(`Rollback apply blocked by ${blockers.length} blocker(s).`, { blockers });

  const currentContents = new Map(manifest.records.map((record) => [record.relative_path, fs.readFileSync(path.join(projectRoot, record.relative_path))]));
  const restored = [];
  try {
    for (const record of manifest.records) {
      atomicReplace(projectRoot, record.relative_path, fs.readFileSync(path.join(projectRoot, record.backup_path)));
      restored.push(record.relative_path);
    }
    writeNew(projectRoot, `${backupRelativeRoot}/rollback-receipt.json`, `${JSON.stringify({
      receipt_id: `${options.rollback}-ROLLBACK`, update_id: options.rollback, project_id: projectId,
      rolled_back_at: options.now || new Date().toISOString(), authority_ref: options.authorityRef,
      change_ref: options.changeRef, restored_files: restored, authority_claim: 'NONE',
    }, null, 2)}\n`);
  } catch (error) {
    for (const relativePath of restored.reverse()) atomicReplace(projectRoot, relativePath, currentContents.get(relativePath));
    throw error;
  }
  return { ...report, status: 'ROLLED_BACK', no_files_changed: false, rolled_back: true, restored_files: restored };
}

module.exports = { CATALOGS, buildPlan, updateProject, rollbackProject, updateId, lockIsCurrent };
