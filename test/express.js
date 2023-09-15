
const argParser = require('args-parser');
const { createExpressServer, createUser } = require('./utils');





const args = argParser(process.argv);

const { refreshTokenValidityPeriod, port, email, password } = args;


// avoid creating a server when mocha is running every file
if (port) {

   const user = createUser();
   user.email = email;
   user.password = password;

   createExpressServer({
      user,
      REFRESH_TOKEN_VALIDITY_PERIOD: refreshTokenValidityPeriod,
      PORT: port,
   });

}