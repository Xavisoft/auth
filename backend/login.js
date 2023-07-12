
const store = require('./store');
const { setAuthHeaders, generateToken } = require('./utils');


async function login(req, res) {

	const { authenticator } = store;
	
	try {

		const credentials = req.body; // extract posted data
		const userInfo = await authenticator.getUserInfo(credentials);

		if (!userInfo)
			return res.status(400).send('Invalid credentials.');

		const refresh_token = generateToken({ 
			userInfo, 
			secretKey: store.SECRET_KEY, 
			tokenValidityPeriod: store.REFRESH_TOKEN_VALIDITY_PERIOD,
			isRefreshToken: true,
		});

		const access_token = generateToken({ 
			userInfo, 
			secretKey: store.SECRET_KEY, 
			tokenValidityPeriod: store.ACCESS_TOKEN_VALIDITY_PERIOD
		});

		setAuthHeaders(res, {
			refresh_token,
			access_token
		});
		
		return res.send(userInfo);

	} catch (err) {
		res.sendStatus(500);
		store.logger.error(err);
	}
}



module.exports = login

