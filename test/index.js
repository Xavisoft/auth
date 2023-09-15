
const chai = require('chai');
const chaiHttp = require('chai-http');
const initFrontend = require('../frontend');
const constants = require('../constants');
const jwt = require('jsonwebtoken');
const window = require('./window');
const { createExpressServer, createUser, findFreeport } = require('./utils');
const child_process = require('child_process');


// helper functions
function delay(millis) {
   return new Promise(resolve => setTimeout(resolve, millis));
}

function createAuthInitialiazedAxiosInstance() {

   const axios = require('axios').default.create();

   global.window = window;

   initFrontend({
      axios,
   });

   axios.interceptors.request.use(config => {

      if (typeof config.url === 'string' && config.url.indexOf("/") === 0)
         config.url = `http://localhost:${PORT}${config.url}`;

      return config;

   });

   return axios;
}

function createBackendOnForkProcess(args) {

   const strArgs = Object
      .keys(args)
      .map(key => {
         const value = args[key];
         return `--${key}=${value}`;
      })
      .join(' ');

   const command = `node "${__dirname}/express.js" ${strArgs}`;
   return child_process.exec(command);

}

// constants
const user = createUser();

const PORT = process.env.PORT;
const ROUTE = '/api/login'


chai.use(chaiHttp);
const requester = chai.request(`http://localhost:${PORT}`).keepOpen();

const { assert } = chai;


suite("Backend", function () {

   let accessToken, refreshToken;

   this.beforeAll(() => {
      return createExpressServer({
         PORT,
         user,
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
   test('Token refreshing', async () => {

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

   });

   test("Non-expiring refresh token", async () => {

      // create server
      const { email, password } = user;
      const port = await findFreeport();

      const cp = createBackendOnForkProcess({
         port,
         refreshTokenValidityPeriod: 0,
         email,
         password,
      });

      await delay(1000);

      // login
      const payload = { email, password };

      let res = await chai
         .request(`http://localhost:${port}`)
         .post(ROUTE)
         .send(payload);

      assert.equal(res.status, 200);

      /// check header
      const decodedRefreshToken = jwt.decode(res.headers[constants.REFRESH_TOKEN_HEADER_NAME]);
      assert.isUndefined(decodedRefreshToken.exp);

      // force a refresh
      let refreshToken = res.headers[constants.REFRESH_TOKEN_HEADER_NAME];

      res = await chai
         .request(`http://localhost:${port}`)
         .get(ROUTE)
         .set(constants.REFRESH_TOKEN_HEADER_NAME, refreshToken)
         .send();

      assert.equal(res.status, 200);

      // kill server
      cp.kill();
      
   });
});

suite("Frontend", function() {

   const axios = createAuthInitialiazedAxiosInstance();

   // making sure that the library
   // will refresh access token when it is about to expire
   setInterval(() => {
      window.emit('scroll');
   }, 100);

   // add refresh verification interceptor
   let refreshTokenWasSent = false;
   let accessTokenWasRefreshed = false;

   axios.interceptors.response.use(res => {

      const { config } = res;

      if (config.method.toUpperCase() === 'GET' && config.url.indexOf('/api/login') >= 0) {

         accessTokenWasRefreshed = true;

         if (config.headers && config.headers[constants.REFRESH_TOKEN_HEADER_NAME])
            refreshTokenWasSent = true;
      }

      return res;

   });


   test("Should save tokens when received via headers", async () => {

      // request
      const { email, password } = user;
      const payload = { email, password };
      
      await axios.post('/api/login', payload);

      // check localStorage
      const json = window.localStorage.getItem(constants.LOCAL_STORAGE_KEY);
      const authTokens = JSON.parse(json);

      assert.isString(authTokens.access_token);
      assert.isString(authTokens.refresh_token);

   });

   test("Should send access token with each request", async () => {

      // add verification interceptor
      let accessTokenWasSent;

      axios.interceptors.response.use(res => {

         const { config } = res;

         if (config.headers && config.headers[constants.ACCESS_TOKEN_HEADER_NAME])
            accessTokenWasSent = true;
         else
            accessTokenWasSent = false;

         return res;

      });

      // request
      await axios.get('/api/user-info');

      // check if access token was sent
      assert.isTrue(accessTokenWasSent);

   });

   test("Should refresh access when about to expire", async () => {

      await delay(1000);

      assert.isTrue(accessTokenWasRefreshed);
      assert.isTrue(refreshTokenWasSent);

   });

   
})