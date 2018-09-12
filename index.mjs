import Lfs                             from 'larvitfs';
import * as fs                         from 'fs';
import { default as Vue }              from 'vue';
import { default as vueRendererFuncs } from 'vue-server-renderer';

const topLogPrefix = 'larvitvue: index.mjs - ';

function VueMw(options) {
	const logPrefix = topLogPrefix + 'VueMw() - ';
	const that      = this;

	that.options = options || {};

	if (! that.options.log) {
		that.options.log = {
			'error':   function (str) { console.log('ERRO: ' + str); },
			'warn':    function (str) { console.log('WARN: ' + str); },
			'info':    function (str) { console.log('INFO: ' + str); },
			'verbose': function (str) { console.log('VERB: ' + str); },
			'debug':   function (str) { /*console.log('DEBU: ' + str);*/ },
			'silly':   function (str) { /*console.log('SILL: ' + str);*/ }
		};

		that.options.log.warn(logPrefix + 'Fix larvitutils for logging in this module!!!!');
	}
	that.log = that.options.log;


	if (! that.options.mainTmplPath) {
		that.log.info(logPrefix + 'No mainTmplPath option given, using "./public/vue/components/main.html"');
		that.options.mainTmplPath = './public/vue/components/main.html';
	}

	if (! that.options.indexTmplPath) {
		that.log.info(logPrefix + 'No indexTmplPath option given, using "./public/vue/index.template.html"');
		that.options.indexTmplPath = './public/vue/index.template.html';
	}

	if (! that.options.headTags) {
		that.log.info(logPrefix + 'No headTags option given, using "<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />"');
		that.options.headTags = '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
	}

	if (! that.options.lfs) {
		that.log.verbose(logPrefix + 'No custom lfs (larvitfs) instance supplied, using default one');
		that.options.lfs = new Lfs({'log': that.log});
	}

	for (const key of Object.keys(that.options)) {
		that[key] = that.options[key];
	}

	that.mainTmpl = fs.readFileSync(that.lfs.getPathSync(that.mainTmplPath), 'utf-8');

	that.vueRenderer = vueRendererFuncs.createRenderer({
		'template': fs.readFileSync(that.lfs.getPathSync(that.indexTmplPath), 'utf-8')
	});
}

VueMw.prototype.run = function run(req, res, cb) {
	const logPrefix = topLogPrefix + 'run() - ';
	const that      = this;

	if (typeof cb !== 'function') {
		cb = function () {};
	}

	if ( ! res.vueComponents) {
		res.vueComponents = {};
	}

	let clientApp = `
import loadComponent from '/vue/loadComponent.mjs';

const tasks           = [];
const appContext      = {};
const componentNames  = ${Object.keys(res.vueComponents)};
appContext.components = {};
appContext.template   = \`${that.mainTmpl}\`;
appContext.data       = ${JSON.stringify(res.data)};

for (const componentName of componentNames) {
	tasks.push(function (cb) {
		loadComponent(componentName, function (err, component) {
			if (err) throw err;

			appContext.components[componentName] = component;
		});
	});
}

async.parallel(tasks, function 8err) {
	if (err) throw err;

	const app = new Vue(appContext);
	app.$mount('#app');
});`

	// Render to string
	const appContext      = {};
	appContext.template   = that.mainTmpl;
	appContext.data       = res.data;
	appContext.components = res.vueComponents;

	const app = new Vue(appContext);

	const rendererContext = {
		'clientApp': clientApp,
		'headTags':  that.headTags,
		'title':     res.data.htmlTitle
	};

	that.vueRenderer.renderToString(app, rendererContext, function (err, result) {
		if (err) {
			that.log.error(logPrefix + 'Counld not render template to string, err: ' + err.message);
			return cb(err);
		}

		res.renderedData = result;
		cb();
	});
};

export default VueMw;