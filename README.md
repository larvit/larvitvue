[![Build Status](https://travis-ci.org/larvit/larvitvue.svg)](https://travis-ci.org/larvit/larvitvue) [![Dependencies](https://david-dm.org/larvit/larvitvue.svg)](https://david-dm.org/larvit/larvitvue.svg)
[![Coverage Status](https://coveralls.io/repos/github/larvit/larvitvue/badge.svg)](https://coveralls.io/github/larvit/larvitvue)

# larvitvue Vue server side rendering middleware for node

## IMPORTANT TODOS!!!

Implement larvitfs for fetching stuff... especially the main module

## Installation

    npm i larvitvue

## Usage

**IMPORTANT** This module requires ES6 modules, so it must be ran on node 10 with --experimental-modules

### CommonJS way

Old skool node way with require. You still need --experimental-modules and node 10 as a minimum since this uses ES6 modules under the hood anyways.

```javascript
'use strict';

const VueMw = require('larvitvue');
const vueMw = new VueMw();
const port  = 3010;

function reqHandler(req, res) {

	// This data will be fed to the main Vue server instance
	// It will also be fed to the client
	res.data = {'htmlTitle': 'Some page title'};

	vueMw.run(req, res, function (err) {
		if (err) throw err;

		res.end(res.renderedData);
	});
}

const server = http.createServer(reqHandler)

server.listen(port, function (err) {
	if (err) throw err;

	console.log('server is listening on ' + port);
});
```

### ES6 Module way

New and fancy ES6 module way

```javascript
import { default as VueMw } from 'larvitvue';
const vueMw = new VueMw();
const port  = 3010;

function reqHandler(req, res) {

	// This data will be fed to the main Vue server instance
	// It will also be fed to the client
	res.data          = {'htmlTitle': 'Some page title'};
	res.vueComponents = {}; // Only the component names will be fed to the client!!!

	vueMw.run(req, res, function (err) {
		if (err) throw err;

		res.end(res.renderedData);
	});
}

const server = http.createServer(reqHandler)

server.listen(port, function (err) {
	if (err) throw err;

	console.log('server is listening on ' + port);
});
```

### With larvitbase-www

**Important!** This implementaiton require a specific route and/or controllerfile for each path to be resolved!

#### application main script file

```javascript
const VueMw = require('larvitvue');
const App   = require('larvitbase-www');
const port  = 3010;
const vueMw = new VueMw();

App.prototype.mwRender = function (req, res, cb) {
	if (! res.data) {
		res.data = {};
		res.data.htmlTitle = 'Some page title';
	}

	if (! res.vueComponents) {
		res.vueComponents = {};
	}

	vueMw.run(req, res, cb);
};

App.prototype.mwRunController = function mwRunController(req, res, cb) {
	const that = this;

	if (req.finished) return cb();

	if (! req.routed.controllerFullPath) {
		that.noTargetFound(req, res, cb);
	} else {
		require(req.routed.controllerFullPath)(req, res, cb);
	}
};

const app = new App({'baseOptions': {'httpOptions': port}});

app.start(function (err) {
	if (err) throw err;
});
```
