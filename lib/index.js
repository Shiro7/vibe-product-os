'use strict';

module.exports = {
  installer: require('./installer'),
  runtime: require('./runtime'),
  composer: require('./composer'),
  status: require('./status'),
  updater: require('./updater'),
  releaseVerifier: require('./release-verifier'),
  identity: require('./identity'),
};
