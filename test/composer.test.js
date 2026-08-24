'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { composeProject } = require('../lib/composer');
const runtime = require('../lib/runtime');
const serialization = require(path.join(runtime.AUTOMATION_ROOT, 'lib', 'serialization.js'));

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'bin', 'vibe-product-os.js');
const fixedNow = '2026-08-24T12:00:00.000Z';

function initialize(profile) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), `vpo-${profile.toLowerCase()}-`));
  const result = spawnSync(process.execPath, [
    cli, 'init', '--project-id', `GOLDEN-${profile}`, '--project-name', `Golden ${profile}`,
    '--profile', profile, '--topology', 'FRAMEWORK_PLUS_PROJECT', '--target', project, '--apply', '--json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return project;
}

function fileSet(project) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(path.relative(project, absolute).split(path.sep).join('/'));
    }
  }
  visit(project);
  return files.sort();
}

test('W2 physical map contains exactly 281 artifacts and canonical profile totals', () => {
  const map = JSON.parse(fs.readFileSync(path.join(root, 'governance/w2/Artifact_to_Physical_Output_Map.json'), 'utf8'));
  assert.equal(map.artifact_count, 281);
  assert.equal(map.entries.length, 281);
  assert.equal(new Set(map.entries.map((entry) => entry.artifact_id)).size, 281);
  const expected = {
    P1: { R: 8, D: 18, C: 192, 'C*': 63 },
    P2: { R: 8, D: 18, M: 192, 'M*': 63 },
    P3: { 'R+': 8, 'D+': 18, I: 118, 'I*': 63, 'I+': 74 },
  };
  for (const profile of ['P1', 'P2', 'P3']) {
    const counts = {};
    const locators = new Set();
    for (const entry of map.entries) {
      const treatment = entry.profiles[profile];
      counts[treatment.packaging_code] = (counts[treatment.packaging_code] || 0) + 1;
      assert.equal(locators.has(treatment.locator), false, `${profile}: duplicate locator ${treatment.locator}`);
      locators.add(treatment.locator);
    }
    assert.deepEqual(counts, expected[profile]);
  }
});

for (const profile of ['P1', 'P2', 'P3']) {
  test(`${profile} golden Phase 00 composition is deterministic, schema-valid, and overwrite-safe`, () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(root, `test/fixtures/composer/${profile.toLowerCase()}-phase-00.json`), 'utf8'));
    const project = initialize(profile);
    try {
      const before = fileSet(project);
      const dryRun = composeProject({ project, phases: ['00'], now: fixedNow });
      assert.equal(dryRun.no_files_changed, true);
      assert.deepEqual(fileSet(project), before);
      for (const key of [
        'profile', 'selected_logical_artifact_count', 'applicable_artifact_count', 'pending_artifact_count',
        'materialized_artifact_count', 'authorable_file_count', 'new_package_count',
      ]) assert.equal(dryRun[key], fixture[key], `${profile}: ${key}`);
      assert.ok(dryRun.planned_new_files.includes('governance/GOV-001-product-constitution.md'));
      assert.ok(dryRun.planned_new_files.includes('governance/GOV-009-standards-compliance-applicability-matrix.md'));

      const applied = composeProject({ project, phases: ['00'], now: fixedNow, apply: true });
      assert.equal(applied.applied, true);
      assert.equal(fs.existsSync(path.join(project, fixture.representative_path)), true);
      const content = fs.readFileSync(path.join(project, fixture.representative_path), 'utf8');
      for (const artifactId of fixture.representative_members) assert.match(content, new RegExp(`## ${artifactId} `));

      const register = runtime.runProductOS(['validate', '--project', project, '--scope', 'project', '--json'], { capture: true });
      assert.equal(register.status, 0, register.stderr);
      const artifactRegisterText = fs.readFileSync(path.join(project, '.product-os/artifact-register.yaml'), 'utf8');
      const compositionText = fs.readFileSync(path.join(project, '.product-os/profile-composition.yaml'), 'utf8');
      const filesAfterApply = fileSet(project);
      assert.throws(
        () => composeProject({ project, phases: ['00'], now: fixedNow, apply: true }),
        (error) => error.exitCode === 4 && /conflicts/u.test(error.message),
      );
      assert.deepEqual(fileSet(project), filesAfterApply);
      assert.equal(fs.readFileSync(path.join(project, '.product-os/artifact-register.yaml'), 'utf8'), artifactRegisterText);
      assert.equal(fs.readFileSync(path.join(project, '.product-os/profile-composition.yaml'), 'utf8'), compositionText);
    } finally {
      fs.rmSync(project, { recursive: true, force: true });
    }
  });
}

test('conditional activation is blocked without exact authority and evidence refs', () => {
  const project = initialize('P2');
  try {
    const preview = composeProject({ project, phases: ['00'], activate: ['INIT-006'], now: fixedNow });
    assert.equal(preview.blockers.some((item) => item.code === 'COMPOSE-AUTH-001'), true);
    assert.throws(
      () => composeProject({ project, phases: ['00'], activate: ['INIT-006'], now: fixedNow, apply: true }),
      (error) => error.exitCode === 4,
    );
    const applied = composeProject({
      project,
      phases: ['00'],
      activate: ['INIT-006'],
      activationAuthorityRef: 'GOV-009#conditional-activation',
      activationEvidenceRef: 'EVD-INIT-006-APPLICABILITY',
      now: fixedNow,
      apply: true,
    });
    assert.equal(applied.pending_artifact_count, 2);
    assert.equal(applied.materialized_artifact_count, 14);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('all-phase dry-runs preserve the 281 logical count across every profile', () => {
  for (const profile of ['P1', 'P2', 'P3']) {
    const project = initialize(profile);
    try {
      const before = fileSet(project);
      const plan = composeProject({ project, phases: ['all'], now: fixedNow });
      assert.equal(plan.selected_logical_artifact_count, 281);
      assert.equal(plan.applicable_artifact_count, 190);
      assert.equal(plan.pending_artifact_count, 91);
      assert.equal(plan.no_files_changed, true);
      assert.deepEqual(fileSet(project), before);
    } finally {
      fs.rmSync(project, { recursive: true, force: true });
    }
  }
});

test('tampered manifest locators cannot escape the project root', () => {
  const project = initialize('P2');
  const outside = path.join(path.dirname(project), 'escaped-product-constitution.md');
  try {
    const manifestPath = path.join(project, 'product-os.yaml');
    const manifest = serialization.parseDocument(manifestPath);
    manifest.gov_001_ref = '../escaped-product-constitution.md';
    fs.writeFileSync(manifestPath, `${serialization.stringifyYaml(manifest)}\n`, 'utf8');
    assert.throws(
      () => composeProject({ project, phases: ['00'], now: fixedNow, apply: true }),
      (error) => error.exitCode === 4 && /escapes the project root/u.test(error.message),
    );
    assert.equal(fs.existsSync(outside), false);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('an active domain override without exact module scope blocks apply', () => {
  const project = initialize('P2');
  try {
    const compositionPath = path.join(project, '.product-os/profile-composition.yaml');
    const composition = serialization.parseDocument(compositionPath);
    composition.domain_overrides.push({
      domain_id: 'DOMAIN-PAYMENTS',
      base_profile: 'P2',
      effective_profile: 'P3',
      scope: { summary: 'Payment scope.' },
      triggers: ['Regulated payment processing is in scope.'],
      reason: 'Payment scope requires higher assurance.',
      source_refs: ['SRC-PAYMENTS-001'],
      evidence_refs: ['EVD-PAYMENTS-001'],
      owner: composition.owner,
      authority: 'GOV-009#payments-profile',
      status: 'ACTIVE',
      effective_at: fixedNow,
      review_due: null,
      reopen_triggers: ['Payment scope changes.'],
    });
    fs.writeFileSync(compositionPath, `${serialization.stringifyYaml(composition)}\n`, 'utf8');
    const preview = composeProject({ project, phases: ['00'], now: fixedNow });
    assert.equal(preview.blockers.some((item) => item.code === 'COMPOSE-PROFILE-001'), true);
    assert.throws(
      () => composeProject({ project, phases: ['00'], now: fixedNow, apply: true }),
      (error) => error.exitCode === 4,
    );
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});
