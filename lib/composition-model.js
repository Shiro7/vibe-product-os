'use strict';

const fs = require('node:fs');
const path = require('node:path');
const runtime = require('./runtime');

const PHASE_DIRECTORIES = {
  'CROSS-PHASE': 'governance',
  'PHASE-00': 'lifecycle/phase-00-initialization',
  'PHASE-01': 'lifecycle/phase-01-discovery',
  'PHASE-02': 'lifecycle/phase-02-business-architecture',
  'PHASE-03': 'lifecycle/phase-03-product-definition',
  'PHASE-04': 'lifecycle/phase-04-requirements',
  'PHASE-05': 'lifecycle/phase-05-experience',
  'PHASE-06': 'lifecycle/phase-06-product-design',
  'PHASE-07': 'lifecycle/phase-07-solution-architecture',
  'PHASE-08': 'lifecycle/phase-08-engineering-readiness',
  'PHASE-09': 'lifecycle/phase-09-implementation',
  'PHASE-10': 'lifecycle/phase-10-verification-release',
  'PHASE-11': 'lifecycle/phase-11-operations-evolution',
};

const REPRESENTATIONS = {
  C: 'COMPOSITE',
  M: 'MODULAR',
  I: 'INDEPENDENT',
  R: 'REGISTER',
  D: 'DERIVED',
};

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/&/gu, ' and ')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .replace(/-{2,}/gu, '-');
}

function loadArtifactCatalog() {
  return JSON.parse(fs.readFileSync(path.join(runtime.FRAMEWORK_ROOT, 'catalogs', 'artifact-catalog.json'), 'utf8'));
}

function treatmentFor(entry, profile) {
  const packagingCode = entry.profile_packaging[profile];
  const baseCode = packagingCode[0];
  const representation = REPRESENTATIONS[baseCode];
  if (!representation) throw new Error(`Unsupported packaging code ${packagingCode} for ${entry.artifact_id}.`);

  const phaseDirectory = PHASE_DIRECTORIES[entry.owning_phase];
  if (!phaseDirectory) throw new Error(`Unsupported owning phase ${entry.owning_phase} for ${entry.artifact_id}.`);
  const artifactSlug = `${entry.artifact_id.toLowerCase()}--${slugify(entry.name)}`;
  const anchorSlug = `${entry.artifact_id.toLowerCase()}-${slugify(entry.name)}`;
  const phaseBase = path.posix.basename(phaseDirectory).slice(0, 8);
  const phaseDescriptor = path.posix.basename(phaseDirectory).slice(9);
  const anchor = `#${anchorSlug}`;
  let canonicalPath;
  let locator;
  let packageId;

  if (entry.artifact_id === 'GOV-002') {
    canonicalPath = '.product-os/artifact-register.yaml';
    locator = canonicalPath;
    packageId = `PACKAGE-GOV-002-${profile}`;
  } else if (representation === 'REGISTER') {
    canonicalPath = `${phaseDirectory}/${artifactSlug}.md`;
    locator = canonicalPath;
    packageId = `PACKAGE-GOVERNANCE-${profile}`;
  } else if (representation === 'DERIVED') {
    canonicalPath = `.product-os/derived/${entry.owning_phase.toLowerCase()}/${artifactSlug}.md`;
    locator = canonicalPath;
    packageId = `PACKAGE-${entry.artifact_id}-${profile}-DERIVED`;
  } else if (representation === 'COMPOSITE') {
    canonicalPath = `${phaseDirectory}/${phaseBase}--${phaseDescriptor}-pack.md`;
    locator = `${canonicalPath}${anchor}`;
    packageId = `PACKAGE-${entry.family}-${profile}-COMPOSITE`;
  } else if (representation === 'MODULAR') {
    canonicalPath = `${phaseDirectory}/${phaseBase}--${entry.data_class.toLowerCase()}-module.md`;
    locator = `${canonicalPath}${anchor}`;
    packageId = `PACKAGE-${entry.family}-${profile}-${entry.data_class}-MODULE`;
  } else {
    canonicalPath = `${phaseDirectory}/${artifactSlug}.md`;
    locator = canonicalPath;
    packageId = `PACKAGE-${entry.artifact_id}-${profile}`;
  }

  return {
    packaging_code: packagingCode,
    representation,
    conditional: packagingCode.includes('*'),
    enhanced_assurance: packagingCode.includes('+'),
    phase_directory: phaseDirectory,
    canonical_path: canonicalPath,
    locator,
    anchor: locator.includes('#') ? anchor : null,
    package_id: packageId,
    materialization: representation === 'DERIVED' ? 'GENERATED_ON_DEMAND' : 'AUTHORABLE_WHEN_APPLICABLE',
  };
}

function buildPhysicalMap(catalog = loadArtifactCatalog()) {
  return catalog.entries.map((entry) => ({
    artifact_id: entry.artifact_id,
    name: entry.name,
    family: entry.family,
    owning_phase: entry.owning_phase,
    data_class: entry.data_class,
    activation_class: entry.activation_class,
    specialized_contract_required: entry.specialized_contract_required,
    contract_ref: `CONTRACT-${entry.artifact_id}@0.1.0`,
    profiles: {
      P1: treatmentFor(entry, 'P1'),
      P2: treatmentFor(entry, 'P2'),
      P3: treatmentFor(entry, 'P3'),
    },
  }));
}

module.exports = {
  PHASE_DIRECTORIES,
  REPRESENTATIONS,
  slugify,
  loadArtifactCatalog,
  treatmentFor,
  buildPhysicalMap,
};
