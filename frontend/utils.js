
const { LOCAL_STORAGE_KEY } = require("../constants");

function writeAuthTokensToLocalStorage(tokens) {

	const existingTokens = readAuthTokensFromLocalStorage();
	const data = {};

	data.access_token = tokens.access_token || existingTokens.access_token;
	data.refresh_token = tokens.refresh_token || existingTokens.refresh_token;

	const json = JSON.stringify(data)
	window.localStorage.setItem(LOCAL_STORAGE_KEY, json);

}

function readAuthTokensFromLocalStorage() {
	try {
		const json = window.localStorage.getItem(LOCAL_STORAGE_KEY);
		return JSON.parse(json) || {};
	} catch {
		return {};
	}
}


function getAccessToken() {
   return readAuthTokensFromLocalStorage().access_token || null;
}

function getRefreshToken() {
   return readAuthTokensFromLocalStorage().refresh_token || null;
}

const getAuthToken = getAccessToken;

module.exports = {
	getAccessToken,
   getAuthToken,
	getRefreshToken,
   readAuthTokensFromLocalStorage,
   writeAuthTokensToLocalStorage,
}