
const login = require('./login');
const middleware = require('./middleware');
const refresh = require('./refresh');
const store = require('./store');

/**
 * 
 * @param {object} options 
 * @param {import('express').Application | import('express').Router} options.app The app/router to add the middleware and endpoints on
 * @param {string} options.route Path to add the endpoints
 * @param {number} options.ACCESS_TOKEN_VALIDITY_PERIOD Access token validity period in milliseconds
 * @param {number} options.REFRESH_TOKEN_VALIDITY_PERIOD Refresh token validity period in milliseconds
 * @param {object} options.authenticator Object encapsulating logic to verify user credentials
 * @param {function} options.authenticator.getUserInfo Function to return information used to identify a user based on the passed credentials
 * @param {object} options.logger Object encapsulating logic to log information
 * @param {function} options.logger.log Function to log information
 * @param {function} options.logger.err Function to log errors
 * @param {string} options.SECRET_KEY JWT secret
 */
function init(options) {

	if (store.initialized)
		return;

	const {
		app,
		route="/api/login",
		authenticator,
		logger=console,
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
	store.authenticator = authenticator;

	// attach middleware and routes

	app.use(middleware);
	app.post(route, login);
	app.get(route, refresh)

	// add data to store
	store.ACCESS_TOKEN_VALIDITY_PERIOD = ACCESS_TOKEN_VALIDITY_PERIOD;
	store.REFRESH_TOKEN_VALIDITY_PERIOD = REFRESH_TOKEN_VALIDITY_PERIOD;
	store.SECRET_KEY = SECRET_KEY;

	store.authenticator = authenticator;
	store.initialized = true;
	store.logger = logger;

}

module.exports = {
	init
}
