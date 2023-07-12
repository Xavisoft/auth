
const chai = require('chai');
const express = require('express');
const chaiHttp = require('chai-http');
const casual = require('casual');
const { init } = require('../backend');
const constants = require('../constants');
const jwt = require('jsonwebtoken');


// create backend
/// user
const user = {
   id: casual.integer(1, 100),
   name: casual.name,
   email: casual.email,
   password: casual.password,
}

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

const ROUTE = '/api/login';
const SECRET_KEY = casual.uuid;

init({
   app,
   route: ROUTE,
   authenticator,
   SECRET_KEY,
});

app.get('/api/user-info', (req, res) => {

   if (!req.auth)
      return res.sendStatus(401);

   if (req.auth.user.id !== user.id)
      return res.sendStatus(403);

   res.send(user);

});

// create HTTP client
const PORT = process.env.PORT;

chai.use(chaiHttp);
const requester = chai.request(`http://localhost:${PORT}`).keepOpen();


const { assert } = chai;

suite("Backend", function () {


   let accessToken, refreshToken;

   this.beforeAll(() => {
      return new Promise((resolve) => {
         app.listen(PORT, resolve)
      });
   });


   // test login
   test('Login', async () => {

      // send request
      const payload = {
         email: user.email,
         password: user.password
      };

      const res = await requester
         .post(ROUTE)
         .send(payload);

      assert.equal(res.status, 200);

      // check if token headers are set and 
      // the information is legit
      accessToken = res.header[constants.ACCESS_TOKEN_HEADER_NAME];
      refreshToken = res.header[constants.REFRESH_TOKEN_HEADER_NAME];

      assert.isString(accessToken);
      assert.isString(refreshToken);

      const decodedAccessToken = jwt.decode(accessToken);
      assert.equal(decodedAccessToken.user.id, user.id);

   });
   
   // test token decoding
   test('Token decoding', async () => {

      // request
      const res = await requester
         .get('/api/user-info')
         .set(constants.ACCESS_TOKEN_HEADER_NAME, accessToken)
         .send();

      assert.equal(res.status, 200);

      // verify payload
      assert.isObject(res.body);

      Object.keys(res.body).forEach(key => {
         assert.equal(res.body[key], user[key]);
      });
      
   });

   // test refreshing token
   test('Test token decoding', async () => {

      // send request
      const res = await requester
         .get(ROUTE)
         .set(constants.REFRESH_TOKEN_HEADER_NAME, refreshToken)
         .send();

      assert.equal(res.status, 200);

      // check if token headers are set and 
      // the information is legit
      accessToken = res.header[constants.ACCESS_TOKEN_HEADER_NAME];
      refreshToken = res.header[constants.REFRESH_TOKEN_HEADER_NAME];

      assert.isString(accessToken);
      assert.isString(refreshToken);

      const decodedAccessToken = jwt.decode(accessToken);
      assert.equal(decodedAccessToken.user.id, user.id);

   })
});