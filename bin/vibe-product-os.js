#!/usr/bin/env node
'use strict';

const { run } = require('../lib/cli');

run(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`vibe-product-os: ${error.message}\n`);
  process.exitCode = Number.isInteger(error.exitCode) ? error.exitCode : 1;
});
