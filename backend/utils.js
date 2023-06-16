
const constants = require('../constants');
const jwt = require('jsonwebtoken');

function setAuthHeaders(res, tokens) {
	const { access_token, refresh_token } = tokens
	res.new_access_token = access_token;
	res.header(constants.ACCESS_TOKEN_HEADER_NAME, access_token);
	res.header(constants.REFRESH_TOKEN_HEADER_NAME, refresh_token)
}



function generateToken({ userInfo, secretKey, tokenValidityPeriod, isRefreshToken }) {

	const exp = Date.now() + tokenValidityPeriod
		
	const payload = {
		user: userInfo,
		exp
	}

	if (isRefreshToken)
		payload.isRefreshToken = true;

	return jwt.sign(payload, secretKey)
}

module.exports = {
	generateToken,
	setAuthHeaders
}