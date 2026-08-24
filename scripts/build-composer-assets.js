#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildPhysicalMap, loadArtifactCatalog } = require('../lib/composition-model');

const root = path.resolve(__dirname, '..');
const outputRoot = path.join(root, 'governance', 'w2');
const catalog = loadArtifactCatalog();
const entries = buildPhysicalMap(catalog);

const map = {
  map_id: 'VPO-W2-ARTIFACT-PHYSICAL-OUTPUT-MAP-001',
  version: '1.0.0',
  status: 'VERIFIED_WORKING_BASELINE',
  framework_version: '1.0.0',
  source_catalog_id: catalog.catalog_id,
  source_catalog_version: catalog.catalog_version,
  artifact_count: entries.length,
  aliases_excluded_from_artifact_count: ['INIT-000', 'REQ-000', 'EXP-000'],
  entries,
};

const packagingCounts = {};
for (const profile of ['P1', 'P2', 'P3']) {
  packagingCounts[profile] = {};
  for (const entry of entries) {
    const code = entry.profiles[profile].packaging_code;
    packagingCounts[profile][code] = (packagingCounts[profile][code] || 0) + 1;
  }
}

const profileCatalog = {
  catalog_id: 'VPO-W2-PROFILE-COMPOSITION-CATALOG-001',
  version: '1.0.0',
  status: 'VERIFIED_WORKING_BASELINE',
  logical_artifact_count: entries.length,
  invariants: [
    'Profiles change physical packaging, not logical artifact identity, obligation, gate meaning, or authority.',
    'Every selected logical artifact has one canonical locator, even when pending or derived and not materialized.',
    'Conditional artifacts are absent until activated; absence never means NOT_APPLICABLE.',
    'Derived artifacts are generated views and never the canonical semantic owner.',
  ],
  profiles: [
    { profile_id: 'P1', name: 'Lean', default_representation: 'COMPOSITE', packaging_counts: packagingCounts.P1 },
    { profile_id: 'P2', name: 'Standard', default_representation: 'MODULAR', packaging_counts: packagingCounts.P2 },
    { profile_id: 'P3', name: 'Comprehensive', default_representation: 'INDEPENDENT', packaging_counts: packagingCounts.P3 },
  ],
  code_semantics: {
    C: 'Composite phase-family file with an independently addressable member section.',
    M: 'Modular phase-family file grouped by data class with an independently addressable member section.',
    I: 'Independent artifact file.',
    R: 'Governed register representation; GOV-002 remains the canonical artifact register control.',
    D: 'Derived view registered by locator and materialized only from canonical inputs.',
    '*': 'Conditional: do not create content until an applicability or event activation exists.',
    '+': 'Enhanced assurance: preserve stronger review, evidence, and segregation expectations.',
  },
};

const applicabilityCatalog = {
  catalog_id: 'VPO-W2-MODULE-APPLICABILITY-COMPOSITION-001',
  version: '1.0.0',
  status: 'VERIFIED_WORKING_BASELINE',
  activation_rules: {
    CORE: { initial_applicability: 'APPLICABLE', materialize_when_phase_selected: true },
    RECUR: { initial_applicability: 'APPLICABLE', materialize_when_phase_selected: true },
    COND: { initial_applicability: 'PENDING', materialize_when_phase_selected: false, activation_source: 'Approved GOV-009/module or explicit governed activation.' },
    EVENT: { initial_applicability: 'PENDING', materialize_when_phase_selected: false, activation_source: 'Observed governed event or explicit governed activation.' },
    DRVD: { initial_applicability: 'PENDING', materialize_when_phase_selected: false, activation_source: 'A deterministic generator with canonical inputs.' },
  },
  not_applicable_rule: 'The composer never infers NOT_APPLICABLE. It requires a complete authority-approved N/A record and creates no empty artifact file.',
  domain_override_rule: 'A domain override may raise packaging/assurance only for its governed scope and cannot weaken universal controls.',
  module_rule: 'Only module records already approved in profile-composition.yaml can activate their artifact_refs automatically; CLI --activate remains a proposal unless project authority is already recorded.',
};

fs.mkdirSync(outputRoot, { recursive: true });
for (const [name, value] of [
  ['Artifact_to_Physical_Output_Map.json', map],
  ['Profile_Composition_Catalog.json', profileCatalog],
  ['Module_and_Applicability_Composition_Catalog.json', applicabilityCatalog],
]) {
  fs.writeFileSync(path.join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

process.stdout.write(`Generated W2 composition assets for ${entries.length} logical artifacts.\n`);
