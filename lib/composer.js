'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const runtime = require('./runtime');
const { loadArtifactCatalog, treatmentFor } = require('./composition-model');

const serialization = require(path.join(runtime.AUTOMATION_ROOT, 'lib', 'serialization.js'));
const { SchemaRegistry } = require(path.join(runtime.AUTOMATION_ROOT, 'lib', 'schema-registry.js'));
const { isInside, assertNoSymlinkEscape } = require(path.join(runtime.AUTOMATION_ROOT, 'lib', 'fs-safe.js'));

const PROFILES = ['P1', 'P2', 'P3'];
const PROFILE_RANK = { P1: 1, P2: 2, P3: 3 };
const ALL_PHASES = Array.from({ length: 12 }, (_, index) => `PHASE-${String(index).padStart(2, '0')}`);

function composerError(message, details = {}) {
  const error = new Error(message);
  error.exitCode = 4;
  error.details = details;
  return error;
}

function normalizePhase(value) {
  const text = String(value).trim().toUpperCase();
  if (text === 'ALL') return 'ALL';
  if (/^[0-9]{1,2}$/u.test(text)) return `PHASE-${text.padStart(2, '0')}`;
  if (/^PHASE-[0-9]{2}$/u.test(text)) return text;
  throw composerError(`Invalid phase ${JSON.stringify(value)}. Use 00..11, PHASE-00..PHASE-11, active, or all.`);
}

function resolvePhases(manifest, requested = []) {
  if (!requested.length || requested.some((value) => String(value).toLowerCase() === 'active')) {
    const active = manifest.active_phases || [];
    if (!active.length) throw composerError('Project manifest has no active phases to compose.');
    return [...new Set(active.map(normalizePhase))].sort();
  }
  const normalized = requested.flatMap((value) => String(value).split(',')).filter(Boolean).map(normalizePhase);
  if (normalized.includes('ALL')) return ALL_PHASES;
  for (const phase of normalized) if (!ALL_PHASES.includes(phase)) throw composerError(`Unsupported lifecycle phase ${phase}.`);
  return [...new Set(normalized)].sort();
}

function bumpMinor(version) {
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/u);
  if (!match) throw composerError(`Cannot advance invalid semantic version ${JSON.stringify(version)}.`);
  return `${match[1]}.${Number(match[2]) + 1}.0`;
}

function packagePath(item) {
  if (item.artifact.artifact_id === 'GOV-002') return '.product-os/artifact-register.yaml';
  if (item.treatment.representation === 'REGISTER') return 'governance';
  return item.treatment.canonical_path;
}

function packageType(item) {
  return item.treatment.representation;
}

function contentRole(item) {
  return item.treatment.representation === 'DERIVED' ? 'DERIVED_VIEW' : 'CANONICAL_SEMANTIC';
}

function renderPackage(packageRecord, members, projectId, now) {
  const lines = [
    '---',
    `product_os_package_id: ${packageRecord.package_id}`,
    `package_version: ${packageRecord.package_version}`,
    `project_id: ${projectId}`,
    `profile: ${packageRecord.profile}`,
    `package_type: ${packageRecord.package_type}`,
    'artifact_status: NOT_STARTED',
    'applicability: APPLICABLE',
    'owner: UNASSIGNED',
    `created_at: ${now}`,
    '---',
    '',
    `# ${packageRecord.package_id}`,
    '',
    '> Operational Product OS scaffold. Replace unknowns with sourced project facts; do not treat placeholders as decisions or evidence.',
    '',
    '## Package controls',
    '',
    `- Profile: \`${packageRecord.profile}\``,
    `- Representation: \`${packageRecord.package_type}\``,
    `- Members: ${members.map((item) => `\`${item.artifact.artifact_id}\``).join(', ')}`,
    '- Physical owner: `UNASSIGNED`',
    '- Authority status: `PENDING`',
    '',
  ];

  for (const item of members) {
    lines.push(
      `<a id="${item.treatment.anchor ? item.treatment.anchor.slice(1) : `${item.artifact.artifact_id.toLowerCase()}-${item.slug}`}\"></a>`,
      `## ${item.artifact.artifact_id} — ${item.artifact.name}`,
      '',
      `Contract: \`CONTRACT-${item.artifact.artifact_id}@0.1.0\`  `,
      `Activation: \`${item.artifact.activation_class}\`  `,
      `Data class: \`${item.artifact.data_class}\``,
      '',
      '### Purpose and scope',
      '',
      '- Purpose: `TO_BE_CONFIRMED_FROM_CONTRACT_AND_PROJECT_CONTEXT`',
      '- In scope: `UNRESOLVED`',
      '- Out of scope: `UNRESOLVED`',
      '',
      '### Inputs, sources, and evidence',
      '',
      '- Required inputs: `UNRESOLVED`',
      '- Source references: `NONE_REGISTERED`',
      '- Evidence references: `NONE_REGISTERED`',
      '',
      '### Questions and decisions',
      '',
      '- Required questions: `OPEN`',
      '- Confirmed facts: `NONE_RECORDED`',
      '- Assumptions: `NONE_RECORDED`',
      '- Decisions: `NONE_APPROVED`',
      '',
      '### Requirements, risks, and dependencies',
      '',
      '- Requirements or obligations: `NONE_RECORDED`',
      '- Risks and dependencies: `UNASSESSED`',
      '- Trace references: `NONE_REGISTERED`',
      '',
      '### Verification, handoff, and lifecycle',
      '',
      '- Verification status: `NOT_STARTED`',
      '- Exit criteria: `UNRESOLVED`',
      '- Downstream handoff: `UNRESOLVED`',
      '- Reopen conditions: profile, applicability, source, decision, requirement, evidence, dependency, or downstream scope changes.',
      '- Change history: initial physical scaffold only.',
      '',
    );
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

function atomicReplace(root, relativePath, content) {
  const target = path.resolve(root, relativePath);
  if (!isInside(root, target)) throw composerError(`Replacement target escapes project root: ${relativePath}`);
  assertNoSymlinkEscape(root, path.dirname(target));
  if (fs.existsSync(target) && !fs.lstatSync(target).isFile()) throw composerError(`Replacement target is not a regular file: ${relativePath}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
  fs.writeFileSync(temporary, content, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  fs.renameSync(temporary, target);
}

function writeNew(root, relativePath, content) {
  const target = path.resolve(root, relativePath);
  if (!isInside(root, target)) throw composerError(`Creation target escapes project root: ${relativePath}`);
  assertNoSymlinkEscape(root, path.dirname(target));
  if (fs.existsSync(target)) throw composerError(`Refusing to overwrite existing artifact file: ${relativePath}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
  fs.writeFileSync(temporary, content, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  fs.renameSync(temporary, target);
}

function pruneEmpty(root, file) {
  let directory = path.dirname(path.resolve(file));
  const stop = path.resolve(root);
  while (directory !== stop && isInside(stop, directory)) {
    if (!fs.existsSync(directory) || fs.readdirSync(directory).length) break;
    fs.rmdirSync(directory);
    directory = path.dirname(directory);
  }
}

function validateControls(composition, register, registry = new SchemaRegistry(runtime.FRAMEWORK_ROOT)) {
  const errors = [
    ...registry.validateDocument(composition).map((item) => ({ control: 'profile-composition', ...item })),
    ...registry.validateDocument(register).map((item) => ({ control: 'artifact-register', ...item })),
  ];
  if (errors.length) throw composerError(`Composed control records failed schema validation (${errors.length} errors).`, { errors });
  return { schema_validation: 'PASS', validated_controls: 2 };
}

function activationFor(artifact, activeModuleByArtifact, explicitActivation, activationRefs) {
  const module = activeModuleByArtifact.get(artifact.artifact_id);
  if (['CORE', 'RECUR'].includes(artifact.activation_class)) {
    return { applicability: 'APPLICABLE', materialize: artifact.activation_class !== 'DRVD', source_refs: [], evidence_refs: [], authority_ref: null };
  }
  if (module) {
    return {
      applicability: 'APPLICABLE',
      materialize: artifact.activation_class !== 'DRVD',
      source_refs: [...new Set(module.source_refs || [])],
      evidence_refs: [...new Set(module.evidence_refs || [])],
      authority_ref: module.authority,
    };
  }
  if (explicitActivation.has(artifact.artifact_id)) {
    return {
      applicability: 'APPLICABLE',
      materialize: artifact.activation_class !== 'DRVD',
      source_refs: activationRefs.authority ? [activationRefs.authority] : [],
      evidence_refs: activationRefs.evidence ? [activationRefs.evidence] : [],
      authority_ref: activationRefs.authority || null,
    };
  }
  return { applicability: 'PENDING', materialize: false, source_refs: [], evidence_refs: [], authority_ref: null };
}

function composeProject(options = {}) {
  const projectRoot = path.resolve(options.project || process.cwd());
  const manifestPath = path.join(projectRoot, 'product-os.yaml');
  const compositionPath = path.join(projectRoot, '.product-os', 'profile-composition.yaml');
  const registerPath = path.join(projectRoot, '.product-os', 'artifact-register.yaml');
  for (const required of [manifestPath, compositionPath, registerPath]) {
    if (!fs.existsSync(required) || !fs.lstatSync(required).isFile()) throw composerError(`Required initialized Product OS control is missing: ${required}`);
  }

  const manifest = serialization.parseDocument(manifestPath);
  const composition = serialization.parseDocument(compositionPath);
  const register = serialization.parseDocument(registerPath);
  const schemaRegistry = new SchemaRegistry(runtime.FRAMEWORK_ROOT);
  const inputErrors = [
    ...schemaRegistry.validateDocument(manifest).map((item) => ({ control: 'product-os', ...item })),
    ...schemaRegistry.validateDocument(composition).map((item) => ({ control: 'profile-composition', ...item })),
    ...schemaRegistry.validateDocument(register).map((item) => ({ control: 'artifact-register', ...item })),
  ];
  if (inputErrors.length) throw composerError(`Existing Product OS controls failed schema validation (${inputErrors.length} errors).`, { errors: inputErrors });
  if (manifest.project_id !== composition.project_id || manifest.project_id !== register.project_id) {
    throw composerError('Project identity mismatch across Product OS controls.');
  }
  if (manifest.product_os_release !== '1.0.0' || register.framework_version !== '1.0.0') {
    throw composerError('Physical Composer supports only the bundled Product OS 1.0.0 framework identity.');
  }

  const profile = options.profile || manifest.default_profile;
  if (!PROFILES.includes(profile)) throw composerError(`Profile must be one of ${PROFILES.join(', ')}.`);
  if (profile !== manifest.default_profile || profile !== composition.default_profile) {
    throw composerError(`Requested profile ${profile} conflicts with governed project profile ${manifest.default_profile}/${composition.default_profile}. Change the project profile through governance first.`);
  }
  const phases = resolvePhases(manifest, options.phases || []);
  const explicitActivation = new Set(options.activate || []);
  const activationRefs = { authority: options.activationAuthorityRef || null, evidence: options.activationEvidenceRef || null };
  const catalog = loadArtifactCatalog();
  const catalogById = new Map(catalog.entries.map((entry) => [entry.artifact_id, entry]));
  for (const artifactId of explicitActivation) {
    if (!catalogById.has(artifactId)) throw composerError(`Unknown activation artifact ID ${artifactId}. Use an exact canonical artifact ID.`);
  }

  const activeModules = (composition.modules || []).filter((module) => module.applicability === 'APPLICABLE');
  const activeModuleByArtifact = new Map();
  for (const module of activeModules) {
    for (const artifactId of module.activated_artifact_refs || []) {
      if (activeModuleByArtifact.has(artifactId)) throw composerError(`Artifact ${artifactId} is activated by multiple modules; resolve the ownership conflict first.`);
      activeModuleByArtifact.set(artifactId, module);
    }
  }

  const blockers = [];
  const pendingExplicit = [...explicitActivation].filter((artifactId) => !activeModuleByArtifact.has(artifactId));
  if (pendingExplicit.length && (!activationRefs.authority || !activationRefs.evidence)) {
    blockers.push({
      code: 'COMPOSE-AUTH-001',
      message: `Explicit activation of ${pendingExplicit.join(', ')} requires --activation-authority-ref and --activation-evidence-ref.`,
    });
  }

  const activeOverrides = (composition.domain_overrides || []).filter((override) => override.status === 'ACTIVE');
  for (const override of activeOverrides) {
    const linked = activeModules.some((module) => (module.profile_override_refs || []).includes(override.domain_id));
    if (!linked) blockers.push({ code: 'COMPOSE-PROFILE-001', message: `Active domain override ${override.domain_id} has no exact module profile_override_ref mapping.` });
    if (PROFILE_RANK[override.effective_profile] < PROFILE_RANK[override.base_profile]) {
      blockers.push({ code: 'COMPOSE-PROFILE-002', message: `Domain override ${override.domain_id} weakens ${override.base_profile} to ${override.effective_profile}.` });
    }
  }

  function effectiveProfile(artifactId) {
    const linked = activeOverrides.filter((override) => activeModules.some((module) =>
      (module.profile_override_refs || []).includes(override.domain_id)
      && (module.activated_artifact_refs || []).includes(artifactId)));
    return linked.reduce((selected, override) => PROFILE_RANK[override.effective_profile] > PROFILE_RANK[selected] ? override.effective_profile : selected, profile);
  }

  const selectedArtifacts = catalog.entries.filter((entry) => entry.owning_phase === 'CROSS-PHASE' || phases.includes(entry.owning_phase));
  const selectedIds = new Set(selectedArtifacts.map((entry) => entry.artifact_id));
  for (const artifactId of explicitActivation) if (!selectedIds.has(artifactId)) blockers.push({ code: 'COMPOSE-ACT-002', message: `${artifactId} is outside the selected phase scope.` });

  const items = selectedArtifacts.map((artifact) => {
    const itemProfile = effectiveProfile(artifact.artifact_id);
    const treatment = treatmentFor(artifact, itemProfile);
    if (artifact.artifact_id === 'GOV-001') {
      treatment.canonical_path = manifest.gov_001_ref;
      treatment.locator = manifest.gov_001_ref;
    }
    if (artifact.artifact_id === 'GOV-009') {
      treatment.canonical_path = manifest.gov_009_ref;
      treatment.locator = manifest.gov_009_ref;
    }
    const activation = activationFor(artifact, activeModuleByArtifact, explicitActivation, activationRefs);
    if (treatment.representation === 'DERIVED') activation.materialize = false;
    if (artifact.artifact_id === 'GOV-002') activation.materialize = false;
    return { artifact, profile: itemProfile, treatment, activation, slug: treatment.canonical_path.split('/').pop().replace(/\.md$/u, '') };
  });
  for (const item of items) {
    const candidate = path.resolve(projectRoot, item.treatment.canonical_path);
    if (!isInside(projectRoot, candidate)) {
      throw composerError(`Canonical locator for ${item.artifact.artifact_id} escapes the project root: ${item.treatment.canonical_path}`);
    }
  }

  const existingEntryIds = new Set((register.entries || []).map((entry) => entry.artifact_id));
  const existingPackageIds = new Set((composition.packages || []).map((entry) => entry.package_id));
  const existingPackageMembers = new Set((composition.packages || []).flatMap((item) => item.members || []).map((item) => item.artifact_id));
  const conflicts = [];
  for (const item of items) {
    if (existingEntryIds.has(item.artifact.artifact_id)) conflicts.push({ type: 'REGISTER_ENTRY_EXISTS', artifact_id: item.artifact.artifact_id });
    if (existingPackageMembers.has(item.artifact.artifact_id)) conflicts.push({ type: 'PACKAGE_MEMBERSHIP_EXISTS', artifact_id: item.artifact.artifact_id });
  }

  const packageGroups = new Map();
  for (const item of items.filter((entry) => entry.activation.materialize || entry.artifact.artifact_id === 'GOV-002')) {
    if (!packageGroups.has(item.treatment.package_id)) packageGroups.set(item.treatment.package_id, []);
    packageGroups.get(item.treatment.package_id).push(item);
  }
  for (const packageId of packageGroups.keys()) if (existingPackageIds.has(packageId)) conflicts.push({ type: 'PACKAGE_EXISTS', package_id: packageId });

  const fileGroups = new Map();
  for (const item of items.filter((entry) => entry.activation.materialize && entry.artifact.artifact_id !== 'GOV-002')) {
    if (!fileGroups.has(item.treatment.canonical_path)) fileGroups.set(item.treatment.canonical_path, []);
    fileGroups.get(item.treatment.canonical_path).push(item);
  }
  for (const relativePath of fileGroups.keys()) if (fs.existsSync(path.join(projectRoot, relativePath))) conflicts.push({ type: 'ARTIFACT_FILE_EXISTS', path: relativePath });

  const now = options.now || new Date().toISOString();
  const nextCompositionVersion = bumpMinor(composition.composition_version);
  const nextRegisterVersion = bumpMinor(register.register_version);
  const newPackages = [...packageGroups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([packageId, members]) => {
    const first = members[0];
    return {
      package_id: packageId,
      package_type: packageType(first),
      path_or_native_ref: packagePath(first),
      format: first.artifact.artifact_id === 'GOV-002' ? 'YAML' : 'MARKDOWN',
      schema_id: first.artifact.artifact_id === 'GOV-002' ? 'urn:product-os:schema:v1:artifact-register' : 'urn:product-os:schema:v1:artifact-instance',
      package_version: '0.1.0',
      profile: first.profile,
      members: members.sort((a, b) => a.artifact.artifact_id.localeCompare(b.artifact.artifact_id)).map((item) => ({
        artifact_id: item.artifact.artifact_id,
        artifact_version: '0.1.0',
        locator: item.treatment.locator,
        content_role: contentRole(item),
      })),
      role: contentRole(first),
      owner: composition.owner,
      access_classification: manifest.access_classification || 'INTERNAL',
      generator_ref: null,
      generated: false,
      status: 'ACTIVE',
    };
  });

  const newEntries = items.map((item) => ({
    instance_id: `${manifest.project_id}-${item.artifact.artifact_id}`,
    artifact_id: item.artifact.artifact_id,
    logical_id: item.artifact.artifact_id,
    title: item.artifact.name,
    status: 'NOT_STARTED',
    applicability: item.activation.applicability,
    owner: manifest.project_owner,
    version: '0.1.0',
    canonical_locator: {
      locator_class: 'REPOSITORY_RELATIVE',
      value: item.treatment.locator,
      revision: null,
      digest: null,
      access_status: item.activation.materialize || item.artifact.artifact_id === 'GOV-002' ? 'AVAILABLE' : 'MISSING',
    },
    contract_ref: `CONTRACT-${item.artifact.artifact_id}@0.1.0`,
    profile: item.profile,
    packaging_code: item.treatment.packaging_code,
    composite_package_ref: item.activation.materialize || item.artifact.artifact_id === 'GOV-002' ? item.treatment.package_id : null,
    dependencies: [],
    source_refs: item.activation.source_refs,
    evidence_refs: item.activation.evidence_refs,
    approval_status: 'PENDING',
    verification_status: 'NOT_STARTED',
    not_applicable_record: null,
    supersedes: null,
    superseded_by: null,
    created_at: now,
    updated_at: now,
    reopen_conditions: ['Profile, applicability, source, evidence, dependency, ownership, authority, gate, or downstream scope changes.'],
  }));

  const updatedComposition = {
    ...composition,
    composition_version: nextCompositionVersion,
    packages: [...(composition.packages || []), ...newPackages],
    last_updated: now,
    change_refs: [...new Set([...(composition.change_refs || []), `COMPOSE-${now.replace(/[^0-9]/gu, '').slice(0, 14)}`])],
  };
  const updatedRegister = {
    ...register,
    register_version: nextRegisterVersion,
    profile_composition_version: nextCompositionVersion,
    generated_at: now,
    entries: [...(register.entries || []), ...newEntries],
  };
  const validation = validateControls(updatedComposition, updatedRegister, schemaRegistry);

  const physicalMap = {
    map_id: `${manifest.project_id}-ARTIFACT-PHYSICAL-MAP`,
    map_version: nextCompositionVersion,
    generated: true,
    generator_id: 'vibe-product-os-physical-composer',
    generator_version: require('../package.json').version,
    framework_version: '1.0.0',
    project_id: manifest.project_id,
    default_profile: profile,
    selected_phases: phases,
    generated_at: now,
    do_not_edit: true,
    entries: updatedRegister.entries.map((entry) => ({
      artifact_id: entry.artifact_id,
      profile: entry.profile,
      packaging_code: entry.packaging_code,
      applicability: entry.applicability,
      canonical_locator: entry.canonical_locator.value,
      materialized: entry.canonical_locator.access_status === 'AVAILABLE',
      package_id: entry.composite_package_ref,
    })),
  };

  const renderedFiles = [...fileGroups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([relativePath, members]) => {
    const packageRecord = newPackages.find((candidate) => candidate.package_id === members[0].treatment.package_id);
    return { relativePath, content: renderPackage(packageRecord, members, manifest.project_id, now) };
  });
  const mapRelativePath = '.product-os/state/composition/artifact-physical-map.json';
  const plan = {
    operation: 'compose',
    mode: options.apply ? 'APPLY' : 'DRY_RUN',
    project_root: projectRoot,
    project_id: manifest.project_id,
    framework_version: '1.0.0',
    profile,
    selected_phases: phases,
    selected_logical_artifact_count: items.length,
    applicable_artifact_count: items.filter((item) => item.activation.applicability === 'APPLICABLE').length,
    pending_artifact_count: items.filter((item) => item.activation.applicability === 'PENDING').length,
    materialized_artifact_count: items.filter((item) => item.activation.materialize || item.artifact.artifact_id === 'GOV-002').length,
    authorable_file_count: renderedFiles.length,
    new_package_count: newPackages.length,
    new_register_entry_count: newEntries.length,
    planned_new_files: renderedFiles.map((item) => item.relativePath),
    planned_control_updates: ['.product-os/profile-composition.yaml', '.product-os/artifact-register.yaml', mapRelativePath],
    blockers,
    conflicts,
    validation,
    authority_claim: 'NONE',
    no_files_changed: !options.apply,
  };

  if (!options.apply) return plan;
  if (blockers.length || conflicts.length) {
    throw composerError(`Composition apply blocked: ${blockers.length} blockers and ${conflicts.length} conflicts. Dry-run changed no files.`, { plan });
  }

  const replaced = [
    { relativePath: '.product-os/profile-composition.yaml', before: fs.readFileSync(compositionPath, 'utf8') },
    { relativePath: '.product-os/artifact-register.yaml', before: fs.readFileSync(registerPath, 'utf8') },
    { relativePath: mapRelativePath, before: fs.existsSync(path.join(projectRoot, mapRelativePath)) ? fs.readFileSync(path.join(projectRoot, mapRelativePath), 'utf8') : null },
  ];
  const created = [];
  try {
    for (const file of renderedFiles) {
      writeNew(projectRoot, file.relativePath, file.content);
      created.push(file.relativePath);
    }
    atomicReplace(projectRoot, '.product-os/profile-composition.yaml', `${serialization.stringifyYaml(updatedComposition)}\n`);
    atomicReplace(projectRoot, '.product-os/artifact-register.yaml', `${serialization.stringifyYaml(updatedRegister)}\n`);
    atomicReplace(projectRoot, mapRelativePath, `${JSON.stringify(physicalMap, null, 2)}\n`);
  } catch (error) {
    for (const relativePath of created.reverse()) {
      const absolute = path.join(projectRoot, relativePath);
      if (fs.existsSync(absolute)) fs.rmSync(absolute);
      pruneEmpty(projectRoot, absolute);
    }
    for (const item of replaced) {
      const absolute = path.join(projectRoot, item.relativePath);
      if (item.before === null) {
        if (fs.existsSync(absolute)) fs.rmSync(absolute);
      } else atomicReplace(projectRoot, item.relativePath, item.before);
    }
    throw error;
  }

  return { ...plan, no_files_changed: false, applied: true, created_files: created, updated_controls: plan.planned_control_updates };
}

module.exports = { composeProject, normalizePhase, resolvePhases, bumpMinor };
