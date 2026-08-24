'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const FRAMEWORK_RELEASE_ROOT = path.join(PACKAGE_ROOT, 'runtime', 'framework', 'Product-OS-v1.0');
const OUTPUTS_ROOT = path.join(FRAMEWORK_RELEASE_ROOT, 'outputs');
const AUTOMATION_ROOT = path.join(OUTPUTS_ROOT, 'Automation_Commands');
const FRAMEWORK_ROOT = path.join(OUTPUTS_ROOT, 'Schemas_Repository_Standard');
const AUTOMATION_BIN = path.join(AUTOMATION_ROOT, 'bin', 'product-os.js');
const RUNTIME_LOCK = path.join(PACKAGE_ROOT, 'runtime', 'framework-runtime-lock.json');

function health() {
  const checks = [
    ['automation_bin', AUTOMATION_BIN],
    ['automation_package', path.join(AUTOMATION_ROOT, 'package.json')],
    ['framework_index', path.join(FRAMEWORK_ROOT, 'Schemas_Repository_Standard_Index.md')],
    ['schema_catalog', path.join(FRAMEWORK_ROOT, 'catalogs', 'schema-catalog.json')],
    ['artifact_catalog', path.join(FRAMEWORK_ROOT, 'catalogs', 'artifact-catalog.json')],
    ['release_component_catalog', path.join(OUTPUTS_ROOT, 'Product_OS_v1.0_Final', 'config', 'release-component-catalog.json')],
    ['runtime_lock', RUNTIME_LOCK],
  ].map(([id, file]) => ({ id, file, exists: fs.existsSync(file) }));
  return {
    healthy: checks.every((check) => check.exists),
    checks,
    automationRoot: AUTOMATION_ROOT,
    frameworkRoot: FRAMEWORK_ROOT,
    frameworkReleaseRoot: FRAMEWORK_RELEASE_ROOT,
    outputsRoot: OUTPUTS_ROOT,
    runtimeLock: RUNTIME_LOCK,
  };
}

function runProductOS(args, options = {}) {
  const report = health();
  if (!report.healthy) {
    const missing = report.checks.filter((check) => !check.exists).map((check) => check.file);
    const error = new Error(`Bundled Product OS runtime is incomplete: ${missing.join(', ')}`);
    error.exitCode = 3;
    throw error;
  }
  const result = spawnSync(process.execPath, [AUTOMATION_BIN, ...args], {
    cwd: options.cwd || process.cwd(),
    env: process.env,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });
  if (result.error) throw result.error;
  if (options.capture) return result;
  process.exitCode = result.status === null ? 1 : result.status;
  return result;
}

module.exports = {
  FRAMEWORK_RELEASE_ROOT,
  OUTPUTS_ROOT,
  AUTOMATION_ROOT,
  FRAMEWORK_ROOT,
  AUTOMATION_BIN,
  RUNTIME_LOCK,
  health,
  runProductOS,
};
