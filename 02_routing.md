# Vue server side rendered without build step - Routing

This guide builds upon [01_basic](01_basic.md), it will not make sense if you haven't already completed that one.

## Adding vue-router

    npm i vue-router

## Create our new page components; home and about

    mkdir public/components/pages

public/components/pages/home.mjs

```javascript
export const template = `<p>Home</p>`;
```

public/components/pages/about.mjs

```javascript
export const template = `<p>About</p>`;
```

## Create a file to contain our routes

public/routes.mjs

```javascript
// Import all components we need for our routes
import * as home from './components/pages/home.mjs';
import * as about from './components/pages/about.mjs';

// We must create new copies of the modules since Vue needs to modify them
// and ES6 modules can not be modified
// This is why we have Object.assign({}, module) in the router config

// Export the routes as the default export for ease of use when importing
export default [
	{ path: '/', component: Object.assign({}, home) },
	{ path: '/about', component: Object.assign({}, about) }
];
```

## Modify public/app.mjs to support routing

The whole file after modifications:

```javascript
// Import main vue component used as our application base
import * as main from './components/main.mjs';

// Import routes
import routes from './routes.mjs';

/**
 * Base App constructor
 *
 * We use one object parameter to easily extend with more options
 * and so that it is clear what options we send in
 * @param {obj} options {
 *		Vue: Vue object (not instanciated),
 *		Router: Router object (not instanciated)
 *		data: The data to be passed to the vue application instance
 *	}
 */
function App(options) {
	// Save "that" in a constant to make this instance available in sub scopes
	const that = this;

	// Set Vue and Router constants to make them easier to access
	const Vue = options.Vue;
	const Router = options.Router;

	// Vue render function need to modify the main component, so we must
	// reconstruct it from the module since modules cannot be altered
	const mainCopy = Object.assign({}, main);

	// We also want the data in the main component
	mainCopy.data = function () { return options.data; };

	Vue.use(Router); // Register the router as a plugin to vue. This is ugly, but it is Vue by design, nothing we can fix.

	// Create a router instance
	that.router = new Router({
		mode: 'history', // Why history mode? I doooon't know
		routes
	});

	// Make the router aware of what URL the visitor is comming from
	that.router.push(options.data.url);

	// Create the vue instance of our main component
	that.vue = new Vue({
		router: that.router, // Pass on the router, yes
		render: h => h(mainCopy), // Custom render function because the router demands it, won't render correctly without it
		data: options.data // The data to be used in this application
	});
}

export default App;
```

### Explanations about the changes

Import the routes from routes.mjs:

```javascript
import routes from './routes.mjs';
```

Then create the Router constant from options below the line "const Vue = options.Vue;":

```javascript
const Router = options.Router;
```

Because of how Vue is constructed we must "extend" Vue with the Router:

```javascript
Vue.use(Router);
```

We also need a new router instance:

```javascript
that.router = new Router({
	mode: 'history', // Why history mode? I doooon't know
	routes
});
```

Make the router aware of what URL the visitor is comming from

```javascript
that.router.push(options.data.url);
```

The vue instantiation needs to be replaced with one with router options:

```javascript
that.vue = new Vue({
	router: that.router, // Pass on the router, yes
	render: h => h(mainCopy), // Custom render function because the router demands it, won't render correctly without it
	data: options.data // The data to be used in this application
});
```

## Add new HTML to public/components/main.mjs

So we can actually see the router in action!

```javascript
export const template = `<div id="app">
	<h1>Visiting: {{ url }}</h1>

	<!-- use router-link component for navigation. -->
	<!-- specify the link by passing the "to" prop. -->
	<!-- "<router-link>" will be rendered as an "<a>" tag by default -->
	<p>
		<router-link to="/">Home</router-link>
		<router-link to="/about">About</router-link>
	</p>

	<!-- route outlet -->
	<!-- component matched by the route will render here -->
	<router-view></router-view>
</div>`;
```

## Add NODE_ENV to the browser context

This step most likely will not be needed in the future, but for now the dist of vue-router does not play well with browsers since it requires process.env.NODE_ENV, so we have to add it manually to public/index.template.html:

```HTML
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>{{ title }}</title>
		{{{ headTags }}}
		<script>
			/* We need this because vue-router esm does not play well with browsers otherwise */
			const process = { env: { NODE_ENV: {{ nodeEnv }} }};

			/* Load the app state here */
			window.appData = {{{ appData }}};
		</script>
		<script async src="client.mjs" type="module"></script>
	</head>
	<body>
		<!--vue-ssr-outlet-->
	</body>
</html>
```

## Add router pieces to server.mjs

```javascript
import Vue from 'vue';
import Router from 'vue-router';
import * as vueServerRenderer from 'vue-server-renderer'; // Can this be done in a more clean way? *
import express from 'express';
import fs from 'fs';
import App from './public/app.mjs';

// This is also done in App, but it have to be done before createRenderer() is ran and that's why we also do it here
Vue.use(Router);

const createRenderer = vueServerRenderer.default.createRenderer; // * To get this
const renderer = createRenderer({
	template: fs.readFileSync('public/index.template.html', 'utf-8')
});

const port = 3000; // http server port
const httpApp = express(); // Create the HTTP server with Express

// Serve all files in the /public folder as static files
httpApp.use(express.static('public'));

// Serve vue dist files
httpApp.use('/js/vue', express.static('node_modules/vue/dist'));

// Serve vue-router dist files
httpApp.use('/js/vue-router', express.static('node_modules/vue-router/dist'));

// All requests that are not static files should go to vue
httpApp.get('*', (req, res) => {

	// Define this specific app instance data
	const appData = {
		url: req.url
	}

	// Context sent to the server side renderer
	const appContext = {
		title: 'Page title',
		headTags: '<meta charset="utf-8" />',

		// Serialized exact copy of the appData so we can hydrate correctly on the client side
		appData: JSON.stringify(appData),

		// Must be sent to the client since vue-router ESM can not load without it
		nodeEnv: process.NODE_ENV
	}

	const app = new App({Vue, Router, data: appData});

	// Render the Vue app to an HTML string using the context we created earlier
	renderer.renderToString(app.vue, appContext, (err, html) => {
		if (err) {
			console.log('Error while rendering to string');
			console.log(err);
			res.status(500);
			res.end('500 Internal Server Error');
			return;
		}
		res.end(html);
	});
});

const httpServer = httpApp.listen(port, (err) => {
	if (err) throw err;
	console.log('Server listening on port 3000');
});
```

## Add router support to public/client.mjs

```javascript
import Vue from './js/vue/vue.esm.browser.js';
import Router from './js/vue-router/vue-router.esm.js';
import App from './app.mjs';

// Instanciate the app, using window.appData for data.
// window.appData needs to be defined in the HTML sent to the client
// from the server
const app = new App({ Vue, Router, data: window.appData });

// Mount the app
// This "hydrates" the web page and makes it an active vue page client side
app.vue.$mount('#app');
```
