import { default as async }            from 'async';
import * as http                       from 'http';
import * as fs                         from 'fs';
import loadComponent                   from './loadComponent.mjs';
import { default as Vue }              from 'vue';
import { default as vueRendererFuncs } from 'vue-server-renderer';

const port        = 3010;
const mainTmpl    = fs.readFileSync('./public/vue/components/main.html', 'utf-8');
const vueRenderer = vueRendererFuncs.createRenderer({
	'template': fs.readFileSync('./public/vue/index.template.html', 'utf-8')
});

function reqHandler(req, res) {
	console.log('Request to: ' + req.url);

	const tasks = [];

	if (req.url === '/') {
		const components = {'nisse': undefined};
		const pageTitle  = 'the title';
		const headTags   = '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
		const appData    = {
			'message': 'True thing'
		}

		let clientApp = '';
		let htmlStr;

		clientApp += 'import loadComponent from \'/vue/loadComponent.mjs\';\n';
		clientApp += 'const tasks      = [];\n';
		clientApp += '\n';
		clientApp += 'const appContext      = {};\n';
		clientApp += 'appContext.components = {};\n';
		clientApp += 'appContext.template   = `' + mainTmpl + '`;\n';
		clientApp += '\n';

		// Load components
		for (const componentName of Object.keys(components)) {
			clientApp += 'tasks.push(function (cb) {\n';
			clientApp += '	loadComponent(\'' + componentName + '\', function (err, result) {\n';
			clientApp += '		if (err) throw err;\n';
			clientApp += '		appContext.components[\'' + componentName + '\'] = result;\n';
			clientApp += '		cb();\n';
			clientApp += '	});\n';
			clientApp += '});\n';
			clientApp += '\n';

			tasks.push(function (cb) {
				loadComponent(componentName, function (err, component) {
					if (err) return cb(err);
					components[componentName] = component;
					cb();
				});
			});
		}

		clientApp += 'async.parallel(tasks, function (err) {\n';

clientApp += 'const p = document.createElement(\'p\');\n';
clientApp += 'p.textContent = \'mounting app\';\n';
clientApp += 'document.body.appendChild(p);\n';

		clientApp += '	if (err) throw err;\n';
		clientApp += '	window.appData  = ' + JSON.stringify(appData) + ';\n'; // Expose outside this module
		clientApp += '	appContext.data = window.appData;\n';
		clientApp += '	const app       = new Vue(appContext);\n';
		clientApp += '	app.$mount(\'#app\');\n';
		clientApp += '});\n';

		// Render to string
		tasks.push(function (cb) {
			const appContext = {};
			appContext.components = components;
			appContext.template   = mainTmpl;
			appContext.data       = appData;

			const app = new Vue(appContext);

			const rendererContext = {
				'clientApp': clientApp,
				'headTags':  headTags,
				'title':     pageTitle
			};

			vueRenderer.renderToString(app, rendererContext, function (err, result) {
				if (err) return cb(err);
				htmlStr = result;
				cb();
			});
		});

		async.series(tasks, function (err) {
			if (err) throw err;
			res.end(htmlStr);
		});
	} else {
		res.statusCode = 404;
		res.end('404 Not Found');
	}
}

const server = http.createServer(reqHandler)

server.listen(port, function (err) {
	if (err) throw err;

	console.log('server is listening on ' + port);
});