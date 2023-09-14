
const constants = require('../constants');
const { readAuthTokensFromLocalStorage, writeAuthTokensToLocalStorage } = require('./utils');


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


async function _refreshAccessToken(waitDurationBeforeRetry=5000) {
	try {

		const tokens = readAuthTokensFromLocalStorage();
		const { refresh_token } = tokens;

		await _global.axios.get(_global.refreshRoute, {
			headers: {
				[constants.REFRESH_TOKEN_HEADER_NAME]: refresh_token,
			}
		});
	} catch (err) {

		console.error(err);

		setTimeout(() => {
			_refreshAccessToken(2 * waitDurationBeforeRetry);
		}, waitDurationBeforeRetry);
	}
}




function setAuthHeaders(config) {

	const tokens = readAuthTokensFromLocalStorage();
	config.headers[constants.ACCESS_TOKEN_HEADER_NAME] = tokens.access_token;

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
				const expiresIn = 0.8 * (decoded.exp - Date.now());

				setTimeout(() => {
					// check last active
					const lastActiveThreshold = Date.now() - expiresIn / 2;

					if (lastActiveThreshold > _global.lastActive)
						return;

					_refreshAccessToken();

				}, expiresIn);

				setLastActive();

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
		refreshRoute='/api/login'
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