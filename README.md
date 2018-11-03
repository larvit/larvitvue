# Vue server side rendered without build step

## Requirements

nodejs 10+

## Setup

### Create folders for our application

```bash
mkdir vueSSRApp # Main app folder
mkdir vueSSRApp/public # Used for files we want to be accessible via the browser
cd vueSsrApp # Enter our newly created app folder
```

### Create the files we need

#### package.json:

```json
{
  "name": "vueSSRApp",
  "version": "1.0.0",
  "description": "",
  "main": "server.mjs",
  "dependencies": {
    "express": "^4.16.4",
    "vue": "^2.5.17",
    "vue-server-renderer": "^2.5.17"
  },
  "devDependencies": {},
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC"
}
```

#### public/app.mjs

This is the "app", the main Vue file that will be mounted on the client side and used to generate the "app" section of the server side rendered HTML.

```javascript
export const template = `<div id="app">
	<h1>Visiting: {{ url }}</h1>
</div>`;
```

#### public/index.template.html

This is the basic HTML used by the server as a basic to send to the browser and as a holder for the vue app.

window.appData here is used to sync the initial state from the server to the client upon app start.

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>{{ title }}</title>
		{{{ headMeta }}}
		<script>
			window.appData = {{{ appData }}};
		</script>
		<script async src="clientStartup.mjs" type="module"></script>
	</head>
	<body>
		<!--vue-ssr-outlet-->
	</body>
</html>
```

#### public/clientStartup.mjs

File used only by the browser to setup and mount the vue application

```javascript
import Vue from './js/vue/vue.esm.browser.js';
import * as mainApp from './app.mjs';

const mainAppContext = Object.assign({data: window.appData}, mainApp);
const app = new Vue(mainAppContext);

app.$mount('#app');
```

#### server.mjs

```javascript
import Vue from 'vue';
import * as vueServerRenderer from 'vue-server-renderer'; // Can this be done in a more clean way? *
import express from 'express';
import fs from 'fs';
import * as mainApp from './public/app.mjs'; // This is this specific applications main application, same on client and server

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
		title: 'Woffbluff',
		headMeta: '',
		appData: JSON.stringify(appData) // Serialized exact copy of the appData so we can hydrate correctly on the client side
	}

	// Since we cannot modify mainApp, we create a new mainAppContext with our custom instance data for this specific request
	const mainAppContext = Object.assign({data: appData}, mainApp);

	// Create the Vue app
	const app = new Vue(mainAppContext);

	// Render the Vue app to an HTML string using the context we created earlier
	renderer.renderToString(app, appContext, (err, html) => {
		if (err) throw err;
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

    node --experimental-modules server.mjs

Point your browser to http://localhost:3000 and awe in the glory of vue server side rendered app and client side hydration without any buildstep at all.
