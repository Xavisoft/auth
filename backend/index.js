
const login = require('./login');
const middleware = require('./middleware');
const store = require('./store');


/**
 * 
 * @param {object} options 
 * @param {import('express').Application | import('express').Router} options.app The app/router to add the middleware and endpoints on
 * @param {string} options.route Path to add the endpoints
 * @param {number} options.accessTokenValidityPeriod Access token validity period in milliseconds
 * @param {number} options.refreshTokenValidityPeriod Refresh token validity period in milliseconds
 * @param {import('./store').Authenticator} options.authenticator Object encapsulating logic to verify user credentials
 * @param {import('./store').Logger} options.logger Object encapsulating logic to log information
 * @param {string} options.secretKey JWT secret
 */
function init(options) {

	if (store.initialized)
		return;

	const {
		app,
		route="/api/login",
		authenticator,
		logger=console,
		accessTokenValidityPeriod=30 * 60 * 1000, // 30 minutes
		refreshTokenValidityPeriod=7 * 24 * 60 * 60 * 1000, // 7 days
		secretKey
	} = options;

	if (!secretKey)
		throw new Error('secretKey is required');

	if (!app)
		throw new Error("app is required.");

	if (!authenticator)
		throw new Error("authenticator is required.");

	// store the authenticator
	store.authenticator = authenticator;

	// attach middleware and routes

	app.use(middleware);
	app.post(route, login);

	// add data to store
	store.accessTokenValidityPeriod = accessTokenValidityPeriod;
	store.refreshTokenValidityPeriod = refreshTokenValidityPeriod;
	store.secretKey = secretKey;

	store.authenticator = authenticator;
	store.initialized = true;
	store.logger = logger;

}

module.exports = {
	init
}
