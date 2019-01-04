# Vue server side rendered without build step - The basics

This guide will setup a basic http server with [express](https://expressjs.com/) and Vue Server Side Render as well as the client side hidration to get your Vue app running in the browser.

## Requirements

nodejs 10+

## Setup

### Create folders for our application

```bash
mkdir vueSSRApp # Main app folder
mkdir vueSSRApp/public # Used for files we want to be accessible via the browser
mkdir vueSSRApp/public/components # Used for all our vue components
cd vueSSRApp # Enter our newly created app folder
```

### Create the files we need

#### package.json:

```json
{
  "name": "vueSSRApp",
  "version": "1.0.0",
  "description": "",
  "main": "server.mjs",
  "scripts": {
    "start": "node --experimental-modules server.mjs"
  },
  "author": {
    "name": "Mikael 'Lilleman' Göransson",
    "email": "lilleman@larvit.se"
  },
  "license": "ISC",
  "dependencies": {
    "express": "^4.16.4",
    "vue": "^2.5.21",
    "vue-server-renderer": "^2.5.21"
  }
}
```

#### public/components/main.mjs

The main component, the one that we use to give our application life. From this
component all other possible components will be loaded. (No extra componetns
are loaded in this example)

```javascript
export const template = `<div id="app">
	<h1>Visiting: {{ url }}</h1>
</div>`;
```

#### public/app.mjs

This is the app constructor. A little factory we can load to create a new
instance of the app for us. We will need a new instance on each server request
on the server side, and one time on each full page reload on the client.

```javascript
// Import main vue component used as our application base
import * as main from './components/main.mjs';

/**
 * Base App constructor
 *
 * We use one object parameter to easily extend with more options
 * and so that it is clear what options we send in
 * @param {obj} options {
 *		Vue: Vue object (not instanciated),
 *		data: The data to be passed to the vue application instance
 *	}
 */
function App(options) {
	// Save "that" in a constant to make this instance available in sub scopes
	const that = this;

	// Set Vue constant to make it easier to access
	const Vue = options.Vue;

	// Vue render function need to modify the main component, so we must
	// reconstruct it from the module since modules cannot be altered
	const mainCopy = Object.assign({}, main);

	// We also want the data in the main component
	mainCopy.data = function () { return options.data; };

	// Create the vue instance of our main component
	that.vue = new Vue(mainCopy);
}

export default App;
```

#### public/client.mjs

Used to mount the vue app on the web page once its all been loaded into the
browser.

```javascript
import Vue from './js/vue/vue.esm.browser.js';
import App from './app.mjs';

// Instanciate the app, using window.appData for data.
// window.appData needs to be defined in the HTML sent to the client
// from the server
const app = new App({ Vue, data: window.appData });

// Mount the app
// This "hydrates" the web page and makes it an active vue page client side
app.vue.$mount('#app');
```

#### public/index.template.html

This is the basic HTML used by the server as a basic to send to the browser and as a holder for the vue app.

window.appData here is used to sync the initial state from the server to the client upon app start.

It is important for performance reasons to load the client.mjs script async, so it will not block the rendering of our page.

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>{{ title }}</title>
		{{{ headTags }}}
		<script>
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

#### server.mjs

This file will serve as our server application, that hosts a little http server,
render our server side HTML and provides our static assets.

```javascript
import Vue from 'vue';
import * as vueServerRenderer from 'vue-server-renderer'; // Can this be done in a more clean way? *
import express from 'express';
import fs from 'fs';
import App from './public/app.mjs';

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
		appData: JSON.stringify(appData)
	}

	const app = new App({Vue, data: appData});

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

### Install dependencies

    npm install

### Startup express http server

    npm start

Point your browser to http://localhost:3000 and awe in the glory of vue server side rendered app and client side hydration without any buildstep at all.
