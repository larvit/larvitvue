# Vue server side rendered without build step - Routing

This guide builds upon [01_basic](01_basic.md), it will not make sense if you haven't already completed that one.

## Adding vue-router

    npm i vue-router

## Create our new components; home and about

    mkdir public/components

public/components/home.mjs

```javascript
export const template = `<p>Home</p>`;
```

public/components/about.mjs

```javascript
export const template = `<p>About</p>`;
```

## Create a routing file

public/routes.mjs

```javascript
import VueRouter from 'vue-router';
import * as home from './components/home.mjs';
import * as about from './components/about.mjs';

const routes = new VueRouter({
	routes: [
		{path: '/', component: home},
		{path: '/about', component: about}
	]
});

export routes;
```

## Modify public/app.mjs to add our router links and make it router aware

```javascript
export routes from './public/routes.mjs'; // Make sure the routes is a part of the main application

export const template = `<div id="app">
	<h1>Visiting: {{ url }}</h1>

	<!-- use router-link component for navigation. -->
	<!-- specify the link by passing the `to` prop. -->
	<!-- `<router-link>` will be rendered as an `<a>` tag by default -->
	<p>
		<router-link to="/">Home</router-link>
		<router-link to="/about">About</router-link>
	</p>

	<!-- route outlet -->
	<!-- component matched by the route will render here -->
	<router-view></router-view>
</div>`;
```
