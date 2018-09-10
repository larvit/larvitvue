export default function loadComponent(name, cb) {
	const script = import('./components/' + name + '.mjs');

	let tmpl;

	if (typeof window === 'undefined') {
		tmpl = fetch('./components/' + name + '.html').then(function(res) {return res.text();});
	} else {
		tmpl = fetch('./vue/components/' + name + '.html').then(function(res) {return res.text();});
	}

	Promise.all([tmpl, script]).then(function(values) {
		const tmplStr   = values[0];
		const scriptObj = values[1];
		const component = Object.assign({}, scriptObj);

		component.template = tmplStr;

		cb(null, component);
	});
};
