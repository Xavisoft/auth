
'use strict'
const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_HEADER_NAME } = require('../constants');


async function getUserInfoByAuthToken(access_token) {

	try {
		const payload = jwt.verify(access_token, _global.SECRET_KEY);
		const { exp, user } = payload;

		if (exp < Date.now())
			return null;

		return user;
	} catch (err) {
		console.error(err)
		return null;
	}

}


async function middleware(req, res, next) {

	const { authenticator, revokedTokens } = _global;

	try {

		// extract auth token
		const access_token = req.headers[ACCESS_TOKEN_HEADER_NAME] || req.query[ACCESS_TOKEN_HEADER_NAME];

		if (!access_token) {
			req.auth = null;
			return next();
		}
	
		// check if not revoked
		if (revokedTokens.has(access_token)) {
			res.auth = null;
			next();
		}

		// get user info from access_token
		const user = await getUserInfoByAuthToken(access_token);

		if (user === null) {
			req.auth = null;
			return next();
		}


		// set req.auth
		req.auth = { user, access_token, };
		next();

	} catch (err) {
		res.sendStatus(500);
		(authenticator.logError || console.log)(err);
	}

}




const _global = {};

module.exports = function ({authenticator, SECRET_KEY, revokedTokens }) {
	_global.authenticator = authenticator;
	_global.SECRET_KEY = SECRET_KEY;
	_global.revokedTokens = revokedTokens;
	return middleware;
};