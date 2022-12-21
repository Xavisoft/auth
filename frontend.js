
const constants = require('./constants');



function writeAuthTokensToLocalStorage(tokens) {

	const existingTokens = readAuthTokensFromLocalStorage();
	const data = {};

	data.access_token = tokens.access_token || existingTokens.access_token;
	data.refresh_token = tokens.refresh_token || existingTokens.refresh_token;

	const json = JSON.stringify(data)
	window.localStorage.setItem(constants.LOCAL_STORAGE_KEY, json);

}

const activityEvents = [
	'mousemove',
	'click',
	'mousedown',
	'keydown',
	'scroll',
	'dblclick'
]


function _decodeAccessToken(access_token) {
	const splitted = access_token.split(".");
	return JSON.parse(window.atob(splitted[1]));
}


async function _refreshAccessToken() {
	try {
		await _global.axios.get(_global.refreshRoute);
	} catch (err) {
		console.error(err);
		_refreshAccessToken(); // retry on fail
	}
}


function readAuthTokensFromLocalStorage() {
	try {
		const json = window.localStorage.getItem(constants.LOCAL_STORAGE_KEY);
		return JSON.parse(json) || {};
	} catch {
		return {};
	}
}

function setAuthHeaders(config) {

	const tokens = readAuthTokensFromLocalStorage();

	config.headers[constants.ACCESS_TOKEN_HEADER_NAME] = tokens.access_token;
	config.headers[constants.REFRESH_TOKEN_HEADER_NAME] = tokens.refresh_token;

	console.log(config.headers);


	return config;
}


function storeAuthTokenHeaderFromResponse(response) {


	const access_token = response.headers[constants.ACCESS_TOKEN_HEADER_NAME];
	const refresh_token = response.headers[constants.REFRESH_TOKEN_HEADER_NAME]

	if (access_token || refresh_token) {
		writeAuthTokensToLocalStorage({ access_token, refresh_token});

		if (access_token) {
			try {
				const decoded = _decodeAccessToken(access_token);
				const expiresIn = decoded.exp - Date.now();

				setTimeout(() => {
					// check last active
					const lastActiveThreshold = Date.now() - expiresIn / 2;

					if (_global.lastActive < lastActiveThreshold)
						return;

					_refreshAccessToken();

				}, expiresIn);
			} catch (err) {
				console.error(err);
			}
		} 
	}
	return response;
	
}

function setLastActive() {
	_global.lastActive = Date.now();
}

const _global = {};


function init(options) {

	if (_global.initialized)
		return;

	const {
		axios,
		refreshRoute='/api/login/refresh'
	} = options;

	_global.axios = axios;
	_global.refreshRoute = refreshRoute;
	_global.lastActive = 0;
	

	try {

		axios.interceptors.request.use(setAuthHeaders);
		axios.interceptors.response.use(storeAuthTokenHeaderFromResponse, null);

		activityEvents.forEach(eventName => {
			window.addEventListener(eventName, setLastActive);
		})

	} catch (err) {
		throw err;
	}

	_global.initialized = true;

}

module.exports = init