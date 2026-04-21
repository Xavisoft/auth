
const {
	ACCESS_TOKEN_HEADER_NAME,
	REFRESH_TOKEN_HEADER_NAME
} = require('../constants');
const { readAuthTokensFromLocalStorage, writeAuthTokensToLocalStorage, isTokenValid } = require('./utils');


function setAuthHeaders(config) {
	const { access_token, refresh_token } = readAuthTokensFromLocalStorage();
	if (access_token && isTokenValid(access_token)) {
		config.headers[ACCESS_TOKEN_HEADER_NAME] = access_token;
	} else if (refresh_token && isTokenValid(refresh_token)) {
		config.headers[REFRESH_TOKEN_HEADER_NAME] = refresh_token
	}
	return config;
}

function storeAuthTokenHeaderFromResponse(response) {

	const access_token = response.headers[ACCESS_TOKEN_HEADER_NAME];
	const refresh_token = response.headers[REFRESH_TOKEN_HEADER_NAME]

	if (access_token || refresh_token) {
		writeAuthTokensToLocalStorage({ access_token, refresh_token });
	}

	return response;
	
}

const _global = {};

function init(options) {

	if (_global.initialized)
		return;

	const {
		axios,
		refreshRoute='/api/login'
	} = options;

	_global.axios = axios;
	_global.refreshRoute = refreshRoute;
	_global.lastActive = 0;
	
	axios.interceptors.request.use(setAuthHeaders);
	axios.interceptors.response.use(storeAuthTokenHeaderFromResponse, null);

	_global.initialized = true;

}

module.exports = init