// jshint mocha:true
'use strict';

var assert = require('assert');

var moduleInfo = require('../package-info');


describe('module info', function() {
	it('should find the main info and test modules', function(done) {
		moduleInfo(function(err, result) {
			if (err) {
				throw err;
			}

			assert(result);
			assert(result.length);

			var foundThis = result.some(function(mod) {
				return mod.id === module.id;
			});
			if (!foundThis) {
				assert.fail('test module was not found in results')
			}

			var foundInfoModule = result.some(function(mod) {
				return mod.id === require.resolve('../package-info');
			});
			if (!foundInfoModule) {
				assert.fail('module-info was not found in results');
			}

			var foundLodash = result.some(function(mod) {
				return mod.id === require.resolve('lodash');
			});
			if (foundLodash) {
				assert.fail('lodash should not be loaded yet');
			}

			done();
		});
	});

	it('should find a newly loaded module', function(done) {
		require('lodash');

		moduleInfo(function(err, result) {
			if (err) {
				throw err;
			}

			assert(result);
			assert(result.length);

			var foundLodash = result.some(function(mod) {
				return mod.id === require.resolve('lodash');
			});
			if (!foundLodash) {
				assert.fail('extra test info was not found in results');
			}

			done();
		});
	});
});

describe('package info', function() {
	it('should find the main info, not the test module', function(done) {
		moduleInfo.packages(function(err, result) {
			if (err) {
				throw err;
			}

			assert(result);
			assert(result.length);

			var foundThis = result.some(function(mod) {
				return mod.id === module.id;
			});
			if (foundThis) {
				assert.fail('test module was found in results, but is not package main');
			}

			var foundInfoModule = result.some(function(mod) {
				return mod.id === require.resolve('../package-info');
			});
			if (!foundInfoModule) {
				assert.fail('module-info was not found in results, but is package main');
			}

			done();
		});
	});
});
