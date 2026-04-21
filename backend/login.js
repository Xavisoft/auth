
const store = require('./store');
const { setAuthHeaders, generateToken } = require('./utils');


async function login(req, res) {

	const { authenticator } = store;
	
	try {

		const credentials = req.body; // extract posted data
		const userInfo = await authenticator.getUserInfo(credentials);

		if (!userInfo)
			return res.status(400).send('Invalid credentials.');

		const { user, tokenPayload } = userInfo;

		const refresh_token = generateToken({ 
			userInfo: tokenPayload, 
			secretKey: store.secretKey, 
			tokenValidityPeriod: store.refreshTokenValidityPeriod,
			isRefreshToken: true,
		});

		const access_token = generateToken({ 
			userInfo: tokenPayload,
			secretKey: store.secretKey, 
			tokenValidityPeriod: store.accessTokenValidityPeriod
		});

		setAuthHeaders(res, {
			refresh_token,
			access_token
		});
		
		return res.send(user);

	} catch (err) {
		res.sendStatus(500);
		store.logger.error(err);
	}
}



module.exports = login

