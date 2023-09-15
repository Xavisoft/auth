const jwt = require("jsonwebtoken");
const { REFRESH_TOKEN_HEADER_NAME } = require("../constants");
const { setAuthHeaders, generateToken } = require("./utils");
const store = require("./store");



async function refresh(req, res) {

   const { authenticator } = store;

   try {

      const refresh_token = req.headers[REFRESH_TOKEN_HEADER_NAME];

      if (!refresh_token)
         return res.status(400).send('No refresh token header');


      let userInfo;

      try {
         const payload = jwt.verify(refresh_token, store.SECRET_KEY);
         const { exp } = payload;
         
         if (exp && exp < Date.now())
			   throw new Error('Expired token');

         if (!payload.isRefreshToken)
            throw new Error('Not a refresh token');

         userInfo = payload.user;
         
      } catch (err) {
         return res.status(403).send('Invalid refresh token');
      }

      const new_refresh_token = generateToken({ 
			userInfo, 
			secretKey: store.SECRET_KEY, 
			tokenValidityPeriod: store.REFRESH_TOKEN_VALIDITY_PERIOD,
			isRefreshToken: true,
		});

      const access_token = generateToken({ 
         userInfo, 
         secretKey: store.SECRET_KEY,
         tokenValidityPeriod: store.ACCESS_TOKEN_VALIDITY_PERIOD
      })
      
      setAuthHeaders(res, {
         refresh_token: new_refresh_token,
         access_token
      });

      res.send();
   } catch (err) {
      res.sendStatus(500);
      store.logger.error(err);
   }
}


module.exports = refresh;