
const { v4:uuid } = require('uuid');
const { saveUserInfoInDataStore, setAuthHeaders, generateAccessToken } = require('./utils');
const jwt = require('jsonwebtoken')

async function login(req, res) {

	const { authenticator } = _global;
	
	try {

		const credentials = req.body; // extract posted data
		const userInfo = await authenticator.getUserInfo(credentials);

		if (!userInfo)
			return res.status(400).send('Invalid credentials.');

		const refresh_token = uuid();
		await saveUserInfoInDataStore(refresh_token, userInfo);

		const access_token = generateAccessToken({ 
			userInfo, 
			secretKey: _global.SECRET_KEY, 
			tokenValidityPeriod: _global.ACCESS_TOKEN_VALIDITY_PERIOD
		});

		setAuthHeaders(res, {
			refresh_token,
			access_token
		});
		
		return res.send(userInfo);

	} catch (err) {
		res.sendStatus(500);
		(authenticator.logError || console.log)(err)
	}
}



const _global = {};

module.exports = function({ authenticator, ACCESS_TOKEN_VALIDITY_PERIOD, SECRET_KEY }) {
	_global.authenticator = authenticator;
	_global.ACCESS_TOKEN_VALIDITY_PERIOD = ACCESS_TOKEN_VALIDITY_PERIOD;
	_global.SECRET_KEY = SECRET_KEY
	return login;
}


