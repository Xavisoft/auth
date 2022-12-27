const { REFRESH_TOKEN_HEADER_NAME } = require("../constants");
const { Token } = require("./db");
const { v4: uuid } = require('uuid');
const { setAuthHeaders, generateAccessToken } = require("./utils");



async function refresh(req, res) {

   const { authenticator } = _global;

   try {

      const refresh_token = req.headers[REFRESH_TOKEN_HEADER_NAME];

      if (!refresh)
         return res.status(400).send('No refresh token header');

      const token = await Token.findOne({ where: { refresh_token }});

      if (!token)
         return res.status(400).send('Invalid refresh token header');

      const userInfo = JSON.parse(token.user_info);

      const new_refresh_token = uuid();
      const access_token = generateAccessToken({ 
         userInfo, 
         secretKey: _global.SECRET_KEY,
         tokenValidityPeriod: _global.ACCESS_TOKEN_VALIDITY_PERIOD
      })
      
      setAuthHeaders(res, {
         refresh_token: new_refresh_token,
         access_token
      });

      res.send();

      try {
         await Token.update({
            refresh_token: new_refresh_token,
            expires: Date.now() + _global.REFRESH_TOKEN_VALIDITY_PERIOD
         }, {
            where: {
               refresh_token
            }
         });
      } catch {}

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