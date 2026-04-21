
const constants = require('../constants');
const jwt = require('jsonwebtoken');
const store = require('./store');

function setAuthHeaders(res, tokens) {
	const { access_token, refresh_token } = tokens
	res.new_access_token = access_token;
	res.header(constants.ACCESS_TOKEN_HEADER_NAME, access_token);
	res.header(constants.REFRESH_TOKEN_HEADER_NAME, refresh_token)
}

/**
 * 
 * @param {object} options 
 * @param {object} options.userInfo User information to put in the token
 * @param {string} options.secretKey JWT secret key
 * @param {number} options.tokenValidityPeriod Token validity period in milliseconds
 * @param {boolean} options.isRefreshToken Whether the token is a refresh token
 * @returns {string} JWT token
 */
function generateToken({ userInfo, secretKey, tokenValidityPeriod, isRefreshToken }) {

	const payload = {
		user: userInfo
	}

	if (tokenValidityPeriod)
		payload.exp = Date.now() + tokenValidityPeriod;

	if (isRefreshToken)
		payload.isRefreshToken = true;

	return jwt.sign(payload, secretKey)
}

/**
 * @param {string} token
 */
function decodeToken(token) {
	try {
		const payload = jwt.verify(token, store.secretKey);
		const { exp } = payload;
		
		if (exp && exp < Date.now())
			return null;

		return payload;
	} catch (err) {
		store.logger.error(err);
		return null;
	} 
}

/**
 * @param {string} accessToken
 * @returns {object|null}
 */
function getUserInfoByAuthToken(accessToken) {
	const result = decodeToken(accessToken);
	return result?.user || null;
}

module.exports = {
	decodeToken,
	generateToken,
	getUserInfoByAuthToken,
	setAuthHeaders
}