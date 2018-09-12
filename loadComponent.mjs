import * as fs from 'fs';

export default function loadComponent(name, cb) {
	import('./public/vue/components/' + name + '.mjs')
		.then(function (componentScript) {
			const component = Object.assign({}, componentScript);

			fs.readFile('./public/vue/components/' + name + '.html', 'utf-8', function (err, result) {
				if (err) return cb(err);

				component.template = result;
				cb(null, component);
			});
		})
		.catch(function (err) { cb(err); });
}