'use strict';

var fs = require('fs'),
	path = require('path');

var async = require('async');


function getPackageJSON(mod, pth, cb) {
	var dir = path.dirname(pth),
		pkgJson = path.join(dir, 'package.json');
	fs.exists(pkgJson, function(exists) {
		if (exists) {
			try {
				mod.package = { json: require(pkgJson) };

				var mainFile;
				if (!mod.package.json.main) {
					mainFile = null;
				} else if (path.isAbsolute(mod.package.json.main)) {
					mainFile = mod.package.json.main;
				} else {
					mainFile = path.join(dir, mod.package.json.main);
					if (!/\.js$/.test(mod.package.json.main)) {
						mainFile += '.js';
					}
				}

				if (mainFile === pth) {
					mod.package.json.main = pth;
				}

				return cb(null, mod);
			} catch (err) {
				return cb(err);
			}
		}

		if (path.dirname(pth) === pth) {
			// We’ve reached root without finding package.json
			return cb(null, null);
		}

		process.nextTick(function() {
			getPackageJSON(mod, path.dirname(pth), cb);
		});
	});
}


module.exports = function moduleInfo(callback) {
	var children = {},
		versionTasks = [];

	function findChildren(mod) {
		if (children[mod.id]) {
			return;
		}

		children[mod.id] = mod;
		versionTasks.push(function(cb) {
			getPackageJSON(mod, mod.filename, cb);
		});

		if (mod.children && mod.children.length) {
			mod.children.forEach(findChildren);
		}
	}

	findChildren(require.main);

	async.parallelLimit(versionTasks, 10, function(err) {
		if (err) {
			return callback(err);
		}

		var modules = [];

		for (var fn in children) {
			if (children.hasOwnProperty(fn)) {
				var child = children[fn];
				modules.push(child);
			}
		}

		modules.sort(function(mod1, mod2) {
			var json1 = mod1.package.json,
				json2 = mod2.package.json;

			if (json1.name !== json2.name) {
				return json1.name < json2.name ? -1 : +1;
			}
			if (json1.version !== json2.version) {
				return json1.version < json2.version ? -1 : +1;
			}
			return mod1.id < mod2.id ? -1 : +1;
		});

		callback(null, modules);
	});
};

module.exports.packages = function(callback) {
	module.exports(function(err, modules) {
		if (err) {
			return callback(err);
		}

		callback(null, modules.filter(function(mod) {
			return mod.filename === mod.package.json.main;
		}));
	});
};
