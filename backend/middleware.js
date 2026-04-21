
'use strict'

const { ACCESS_TOKEN_HEADER_NAME, REFRESH_TOKEN_HEADER_NAME } = require('../constants');
const store = require('./store');
const { getUserInfoByAuthToken, decodeToken, generateToken } = require('./utils');

/**
 * 
 * @param {import('express').Request} req 
 * @param {string} tokenName 
 */
function getTokenFromRequest(req, tokenName) {
	return req.headers[tokenName] || req.query[tokenName];
}

/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Request} res 
 * @param {function} next 
 * @returns 
 */
async function middleware(req, res, next) {

	try {

		// extract auth token
		let accessToken = getTokenFromRequest(req, ACCESS_TOKEN_HEADER_NAME);
		if (!accessToken) {
			const refreshToken = getTokenFromRequest(req, REFRESH_TOKEN_HEADER_NAME);
			if (refreshToken) {
				// refresh token
				const info = decodeToken(refreshToken);
				if (info && info.isRefreshToken) {
					const userInfo = info.user

					accessToken = generateToken({
						userInfo,
						secretKey: store.secretKey,
						tokenValidityPeriod: store.accessTokenValidityPeriod,
					});

					const refreshToken = generateToken({
						userInfo,
						secretKey: store.secretKey,
						tokenValidityPeriod: store.refreshTokenValidityPeriod,
						isRefreshToken: true,
					});

					res.header(REFRESH_TOKEN_HEADER_NAME, refreshToken);
					res.header(ACCESS_TOKEN_HEADER_NAME, accessToken);
				}
			}
		}

		req.auth = null;

		if (!accessToken)
			return next();
	
		// get user info from access_token
		const user = getUserInfoByAuthToken(accessToken);

		if (user === null)
			return next();

		// set req.auth
		req.auth = { user, accessToken };
		next();

	} catch (err) {
		res.sendStatus(500);
		store.logger.error(err);
	}

}


module.exports = middleware;