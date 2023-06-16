

const { setAuthHeaders } = require('./utils');
const jwt = require('jsonwebtoken');



async function logout(req, res) {

	const { authenticator, revokedTokens } = _global;

	try {


		if (req.auth) {
			const access_token = req.auth.access_token;
			const payload = jwt.decode(access_token);

			const timeUntilExpiry = payload.exp - Date.now();

			revokedTokens.add(access_token);

			// remove when it expires
			setTimeout(() => {
				revokedTokens.delete(access_token)
			}, timeUntilExpiry);
		}
		
		setAuthHeaders(res, { access_token: null, refresh_token: null });
		res.sendStatus(200);

	} catch (err) {
		res.sendStatus(500);
		(authenticator.logError || console.log)(err);
	}
}


const _global = {};

module.exports = function({ authenticator, revokedTokens }) {
	_global.authenticator = authenticator;
	_global.revokedTokens = revokedTokens
	return logout;
};