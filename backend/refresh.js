const jwt = require("jsonwebtoken");
const { REFRESH_TOKEN_HEADER_NAME } = require("../constants");
const { setAuthHeaders, generateToken } = require("./utils");



async function refresh(req, res) {

   const { authenticator } = _global;

   try {

      const refresh_token = req.headers[REFRESH_TOKEN_HEADER_NAME];

      if (!refresh_token)
         return res.status(400).send('No refresh token header');


      let userInfo;

      try {
         const payload = jwt.verify(refresh_token, _global.SECRET_KEY);
         
         if (exp < Date.now())
			   throw new Error('Expired token');

         if (!payload.isRefreshToken)
            throw new Error('Not a refresh token');

         userInfo = payload.user;
         
      } catch (err) {
         return res.status(403).send('Invalid refresh token');
      }

      const new_refresh_token = generateToken({ 
			userInfo, 
			secretKey: _global.SECRET_KEY, 
			tokenValidityPeriod: _global.REFRESH_TOKEN_VALIDITY_PERIOD,
			isRefreshToken: true,
		});

      const access_token = generateToken({ 
         userInfo, 
         secretKey: _global.SECRET_KEY,
         tokenValidityPeriod: _global.ACCESS_TOKEN_VALIDITY_PERIOD
      })
      
      setAuthHeaders(res, {
         refresh_token: new_refresh_token,
         access_token
      });

      res.send();
   } catch (err) {
      res.sendStatus(500);
      (authenticator.logErr || console.error)(err);
   }
}

const _global = {}

module.exports = function ({ authenticator, REFRESH_TOKEN_VALIDITY_PERIOD, SECRET_KEY, ACCESS_TOKEN_VALIDITY_PERIOD }) {
   _global.authenticator = authenticator;
   _global.REFRESH_TOKEN_VALIDITY_PERIOD = REFRESH_TOKEN_VALIDITY_PERIOD;
   _global.SECRET_KEY = SECRET_KEY;
   _global.ACCESS_TOKEN_VALIDITY_PERIOD = ACCESS_TOKEN_VALIDITY_PERIOD;

   return refresh;
}