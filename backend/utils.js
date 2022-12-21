
const { Token } = require('./db');
const constants = require('../constants');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');


function setAuthHeaders(res, tokens) {
	const { access_token, refresh_token } = tokens
	res.new_access_token = access_token;
	res.header(constants.ACCESS_TOKEN_HEADER_NAME, access_token);
	res.header(constants.REFRESH_TOKEN_HEADER_NAME, refresh_token)
}

async function deleteExpiredAuthTokens() {
	await Token.destroy({ where: { 
		expires: {
			[Op.lt]: Date.now(),
		},
	}});
}

async function saveUserInfoInDataStore(refresh_token, userInfo) {

	userInfo = JSON.stringify(userInfo);

	const token = await Token.create({
		refresh_token,
		user_info: userInfo
	});


}

function generateAccessToken({ userInfo, secretKey, tokenValidityPeriod }) {

	const exp = Date.now() + tokenValidityPeriod
		
	const payload = {
		user: userInfo,
		exp
	}

	return jwt.sign(payload, secretKey)
}

module.exports = {
	deleteExpiredAuthTokens,
	generateAccessToken,
	saveUserInfoInDataStore,
	setAuthHeaders
}