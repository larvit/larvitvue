/**
 * Base Vue App constructor
 *
 * Used to create a vue instance that works both in the browser and on the
 * server, as well with async component and async routes.
 *
 *	@param {obj} options {
 *		Vue: Vue object (not instanciated),
 *		Router: Router object (not instanciated)
 *		data: The data to be passed to the vue application instance
 *		routes: routes array passed on to the Router
 *		mainComponent: The main component to be used (Must be a promise!)
 *		log: Logging object (using log.error, and log.debug)
 *	}
 *	@param {func} cb Callback
 */
export function appCreator(options, cb) {
	const logPrefix = 'public/appCreator.js: appCreator() - ';
	const errors = [];

	if (!options) options = {};
	if (typeof cb !== 'function') cb = () => null;

	if (!options.log) {
		options.log = {};
		options.log.error = (msg) => console.log('Error: ' + msg);

		// Only print debug messages when not in production
		if (process && process.env && process.env.NODE_ENV === 'production') {
			options.log.debug = () => {};
		} else {
			options.log.debug = (msg) => console.log('Debug: ' + msg);
		}
	}

	const log = options.log;
	const Vue = options.Vue;
	const Router = options.Router;
	const routes = options.routes;
	const mainComponent = options.mainComponent;

	['Vue', 'Router', 'routes', 'mainComponent'].forEach((option) => {
		if (!options[option]) {
			const err = new Error(option + ' option is missing');

			errors.push(err);
			log.error(logPrefix + err.message);
		}
	});

	if (!errors.length && !options.mainComponent.then) {
		const err = new Error('mainComponent option is not a promise');

		errors.push(err);
		log.error(logPrefix + err.message);
	}

	if (errors.length) {
		const err = new Error('Invalid options passed, see application log for more info');

		cb(err);

		return;
	}

	log.debug(logPrefix + 'All options ok, continuing');

	Vue.use(Router); // Register the router as a plugin to vue. This is ugly, but it is Vue by design, nothing we can fix. Should be fixed in Vue 3.

	// Create a router instance
	const router = new Router({
		mode: 'history', // Why history mode? I doooon't know
		routes
	});

	// Make the router aware of what URL the visitor is comming from
	router.push(options.data.url);

	// Wait for mainComponent to resolve
	mainComponent.then((main) => {
		log.debug(logPrefix + 'Main component is resolved');

		// Pass the data on to the main component
		main.data = () => options.data;

		// Wait for router to be ready
		router.onReady(() => {
			log.debug(logPrefix + 'router.onReady has returned ok');

			// Create the vue instance of our main component
			cb(null, new Vue({
				router, // Pass on the router, yes
				render: h => h(main), // Custom render function because the router demands it, won't render correctly without it
				data: options.data // The data to be used in this application
			}));
		}, (err) => {
			log.error(logPrefix + 'vue router failed to be ready: ' + err.message);
			cb(err);
		});
	});

	// Catch errors in mainComponent
	mainComponent.catch((err) => {
		log.error(logPrefix + 'mainComponent.catch(): ' + err.message);
		cb(err);
	});
}
