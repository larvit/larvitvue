/**
 * This file is just to be backwards compatible with CommonJS require
 */

'use strict';

function WrapperConstructor(options) {
	const that = this;

	import(__dirname + '/index.mjs').then(function (module) {
		that.instance = new module.default(options);

		for (const key of Object.keys(that.instance)) {
			if (key !== 'run') {
				that[key] = that.instance[key];
			}
		}
	});
}

WrapperConstructor.prototype.run = function run(req, res, cb) {
	const that = this;

	if ( ! that.instance) {
		setTimeout(function () {
			that.run(req, res, cb);
		}, 10);
		return;
	}
	that.instance.run(req, res, cb);
}

exports = module.exports = WrapperConstructor;