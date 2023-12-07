
'use strict'

const { ACCESS_TOKEN_HEADER_NAME } = require('../constants');
const store = require('./store');
const { getUserInfoByAuthToken } = require('./utils');

async function middleware(req, res, next) {

	try {

		// extract auth token
		const access_token = req.headers[ACCESS_TOKEN_HEADER_NAME] || req.query[ACCESS_TOKEN_HEADER_NAME];

		if (!access_token) {
			req.auth = null;
			return next();
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
		store.logger.error(err);
	}

}


module.exports = middleware;