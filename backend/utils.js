
const constants = require('../constants');
const jwt = require('jsonwebtoken');
const store = require('./store');

function setAuthHeaders(res, tokens) {
	const { access_token, refresh_token } = tokens
	res.new_access_token = access_token;
	res.header(constants.ACCESS_TOKEN_HEADER_NAME, access_token);
	res.header(constants.REFRESH_TOKEN_HEADER_NAME, refresh_token)
}



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


function getUserInfoByAuthToken(access_token) {

	try {
		const payload = jwt.verify(access_token, store.SECRET_KEY);
		const { exp, user } = payload;

		if (exp < Date.now())
			return null;

		return user;
	} catch (err) {
		store.logger.error(err);
		return null;
	}

}

module.exports = {
	generateToken,
	getUserInfoByAuthToken,
	setAuthHeaders
}