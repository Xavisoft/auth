
const { LOCAL_STORAGE_KEY } = require("../constants");

/**
 * 
 * @param {{
 * 	access_token?: string;
 * 	refresh_token?: string;
 * }} tokens
 */
function writeAuthTokensToLocalStorage(tokens) {

	const existingTokens = readAuthTokensFromLocalStorage();
	const data = {};

	data.access_token = tokens.access_token || existingTokens.access_token;
	data.refresh_token = tokens.refresh_token || existingTokens.refresh_token;

	const json = JSON.stringify(data)
	localStorage.setItem(LOCAL_STORAGE_KEY, json);

}

/**
 * 
 * @returns {{
 * 	access_token?: string;
 * 	refresh_token?: string;
 * }}
 */
function readAuthTokensFromLocalStorage() {
	try {
		const json = localStorage.getItem(LOCAL_STORAGE_KEY);
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

/**
 * 
 * @param {string} access_token 
 */
function decodeAccessToken(access_token) {
	const splitted = access_token.split(".");
	const base64 = splitted[1];
	const json = atob(base64);
	try {
		return JSON.parse(json);
	} catch (err) {
		return json;
	}
}

/**
 * 
 * @param {string} token 
 */
function isTokenValid(token) {
	const { exp } = decodeAccessToken(token);
	if (exp && exp < Date.now())
		return false;
	return true;
}

async function logout() {
	localStorage.removeItem(LOCAL_STORAGE_KEY);
}

const getAuthToken = getAccessToken;

module.exports = {
	getAccessToken,
   getAuthToken,
	getRefreshToken,
	isTokenValid,
	logout,
   readAuthTokensFromLocalStorage,
   writeAuthTokensToLocalStorage,
}