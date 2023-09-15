
const { init: initBackend } = require('../backend');
const express = require('express');
const casual = require('casual');
const tcpPortUsed = require('tcp-port-used');


async function findFreeport(from=8080, end=9000) {
   for (let port = from; port <= end; port++) {
      const inUse = await tcpPortUsed.check(port);
      if (!inUse)
         return port;
   }

   return 0;
}


function createExpressServer({
   SECRET_KEY=casual.uuid,
   ACCESS_TOKEN_VALIDITY_PERIOD=1000,
   REFRESH_TOKEN_VALIDITY_PERIOD=1000,
   PORT,
   user,
}) {

   /// authenticator
   function getUserInfo(credentials) {

      const { email, password } = credentials;

      if (email != user.email || password != user.password)
         return null;

      return {
         id: user.id,
      }
   }

   const authenticator = { getUserInfo }

   /// create server
   const app = express();

   //// middlewares
   app.use(express.json());

   initBackend({
      app,
      authenticator,
      SECRET_KEY,
      ACCESS_TOKEN_VALIDITY_PERIOD,
      REFRESH_TOKEN_VALIDITY_PERIOD,
   });

   app.get('/api/user-info', (req, res) => {

      if (!req.auth)
         return res.sendStatus(401);

      if (req.auth.user.id !== user.id)
         return res.sendStatus(403);

      res.send(user);

   });

   return new Promise(resolve => {
      app.listen(PORT, () => {
         resolve(app);
      });
   })
}


function createUser() {
   return {
      id: casual.integer(1, 100),
      name: casual.name,
      email: casual.email,
      password: casual.password,
   }
}


module.exports = {
   createExpressServer,
   createUser,
   findFreeport
}