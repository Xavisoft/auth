
const login = require('./login');
const logout = require('./logout');
const middleware = require('./middleware');
const refresh = require('./refresh');


async function init(options) {



	if (_global.initialized)
		return;


	const {
		app,
		route="/api/login",
		authenticator,
		ACCESS_TOKEN_VALIDITY_PERIOD=30*60*1000,
		SECRET_KEY
	} = options;

	const {
		REFRESH_TOKEN_VALIDITY_PERIOD=2 * ACCESS_TOKEN_VALIDITY_PERIOD
	} = options;


	if (!SECRET_KEY)
		throw new Error('SECRET_KEY is required');

	if (!app)
		throw new Error("app is required.");

	if (!authenticator)
		throw new Error("authenticator is required.");

	// store the authenticator
	_global.authenticator = authenticator;

	// attach middleware and routes
	const refreshRoute = `${route}/refresh`;
	const revokedTokens = new Set();

	app.use(middleware({ authenticator, SECRET_KEY, revokedTokens }));
	app.post(route, login({ authenticator, SECRET_KEY, ACCESS_TOKEN_VALIDITY_PERIOD }));
	app.delete(route, logout({ authenticator, revokedTokens }));
	app.get(refreshRoute, refresh({ authenticator, REFRESH_TOKEN_VALIDITY_PERIOD, SECRET_KEY, ACCESS_TOKEN_VALIDITY_PERIOD }))

	// mark as initialized
	_global.initialized = true;

}


const _global = {
	initialized: false
};



module.exports = {
	init
}