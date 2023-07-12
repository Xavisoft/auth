
const login = require('./login');
const middleware = require('./middleware');
const refresh = require('./refresh');
const store = require('./store');



async function init(options) {

	if (store.initialized)
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

}

module.exports = {
	init
}