
const chai = require('chai');
const chaiHttp = require('chai-http');
const initFrontend = require('../frontend');
const constants = require('../constants');
const jwt = require('jsonwebtoken');
const { createExpressServer, createUser, findFreeport } = require('./utils');
const casual = require('casual');
const { writeAuthTokensToLocalStorage, getAccessToken, getRefreshToken, isTokenValid, logout } = require('../frontend/utils');
const { generateToken, getUserInfoByAuthToken } = require('../backend/utils');
const { default: axiosLib } = require('axios');
const child_process = require('child_process');


// helper functions
function delay(millis) {
   return new Promise(resolve => setTimeout(resolve, millis));
}

function createAuthInitialiazedAxiosInstance() {

   global.localStorage = localStorage;
   const axios = axiosLib.create();

   initFrontend({ axios });

   axios.interceptors.request.use(config => {
      if (typeof config.url === 'string' && config.url.indexOf("/") === 0)
         config.url = `http://localhost:${PORT}${config.url}`;
      return config;
   });

   return axios;
}

/**
 * 
 * @param {object} args
 * @param {number} args.refreshTokenValidityPeriod
 * @param {number} args.port
 * @param {string} args.email
 * @param {string} args.password
 * @returns 
 */
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
const PORT = process.env.PORT;
const ROUTE = '/api/login'
const user = createUser();
const secretKey = casual.uuid;

chai.use(chaiHttp);
const requester = chai.request(`http://localhost:${PORT}`).keepOpen();

const { assert } = chai;

const localStorage = {

   _data: {},

   setItem: function(key, data) {
      this._data[key] = data;
   },

   getItem: function(key) {
      return this._data[key] || null;
   },

   removeItem(key) {
      return delete this._data[key];
   }
}

// tests
suite("Backend", function () {

   this.beforeAll(() => {
      return createExpressServer({
         secretKey,
         PORT,
         user,
      });
   });

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

      // check response
      /// body
      for (const key in user) {
         assert.equal(res.body[key], user[key]);
      }

      /// check if token headers are set and 
      /// the information is legit
      const accessToken = res.header[constants.ACCESS_TOKEN_HEADER_NAME];
      const refreshToken = res.header[constants.REFRESH_TOKEN_HEADER_NAME];

      assert.isString(accessToken);
      assert.isString(refreshToken);

      const decodedAccessToken = jwt.decode(accessToken);
      assert.equal(decodedAccessToken.user.id, user.id);

   });
   
   test('Test auth', async () => {
      // request
      const accessToken = generateToken({
         userInfo: { id: user.id },
         secretKey,
         tokenValidityPeriod: 1000,
      });

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

   test('Token refreshing', async () => {
      // send request
      const userInfo = { id: casual.integer() };

      const refreshToken = generateToken({
         userInfo,
         secretKey,
         tokenValidityPeriod: 1000,
         isRefreshToken: true
      });

      const res = await requester
         .get(`/api/user-info`)
         .set(constants.REFRESH_TOKEN_HEADER_NAME, refreshToken)
         .send();

      // check if token headers are set and 
      // the information is legit
      const newAccessToken = res.header[constants.ACCESS_TOKEN_HEADER_NAME];
      const newRefreshToken = res.header[constants.REFRESH_TOKEN_HEADER_NAME];

      assert.isString(newAccessToken);
      assert.isString(newRefreshToken);

      const decodedAccessToken = jwt.decode(newAccessToken);
      const decodedRefreshToken = jwt.decode(newRefreshToken);

      for (const key in userInfo) {
         assert.equal(decodedAccessToken.user[key], userInfo[key]);
         assert.equal(decodedRefreshToken.user[key], userInfo[key]);
      }

   });

   test("Non-expiring refresh token", async () => {
      // create server
      const { email, password } = user;
      const port = await findFreeport();

      const cp = createBackendOnForkProcess({
         port,
         refreshTokenValidityPeriod: 0,
         email,
         password
      });

      await delay(500);

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

      // kill server
      cp.kill();
      
   });

   suite("utils", function () {
      test("getUserInfoByAuthToken()", () => {
         
         const userInfo = {
            name: casual.word,
         };

         const tokenValidityPeriod = 1000000;
         const accessToken = generateToken({ userInfo, secretKey, tokenValidityPeriod });

         const decodedUserInfo = getUserInfoByAuthToken(accessToken);

         assert.deepEqual(decodedUserInfo, userInfo);

      });
   });
});

suite("Frontend", function() {

   const axios = createAuthInitialiazedAxiosInstance();

   test("Should save tokens when received via headers", async () => {
      // request
      const { email, password } = user;
      const payload = { email, password };
      
      await axios.post('/api/login', payload);

      // check localStorage
      const json = localStorage.getItem(constants.LOCAL_STORAGE_KEY);
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

   test("Should sent refreshToken if accessToken has expired", async () => {
      // prepare
      const userInfo = { id: user.id }
      const accessTokenValidityPeriod = 1;

      const accessToken = generateToken({
         userInfo,
         secretKey,
         tokenValidityPeriod: accessTokenValidityPeriod,
      });

      const refreshToken = generateToken({
         userInfo,
         secretKey,
         tokenValidityPeriod: 20000,
         isRefreshToken: true
      })

      await delay(accessTokenValidityPeriod * 2);

      writeAuthTokensToLocalStorage({
         access_token: accessToken,
         refresh_token: refreshToken
      });

      // send request
      const res = await axios.get('/api/user-info');
      assert.equal(res.status, 200);

      // check headers
      assert.isUndefined(res.config.headers[constants.ACCESS_TOKEN_HEADER_NAME]);
      assert.equal(res.config.headers[constants.REFRESH_TOKEN_HEADER_NAME], refreshToken);

   });

   suite("utils", function () {
      test("getXxxToken()", () => {

         const access_token = casual.uuid;
         const refresh_token = casual.uuid;

         writeAuthTokensToLocalStorage({ refresh_token, access_token });

         const retrievedAccessToken = getAccessToken();
         const retrievedRefreshToken = getRefreshToken();

         assert.equal(retrievedAccessToken, access_token);
         assert.equal(retrievedRefreshToken, refresh_token);

      });

      test("isTokenValid()", async () => {
         // valid token
         const userInfo = { [casual.word]: casual.word };
         const secretKey = casual.uuid;

         const validToken = generateToken({
            userInfo,
            secretKey,
            tokenValidityPeriod: 3000,
            isRefreshToken: casual.coin_flip
         });

         assert.isTrue(isTokenValid(validToken));

         // expired token
         const expiredToken = generateToken({
            userInfo,
            secretKey,
            tokenValidityPeriod: 1,
            isRefreshToken: casual.coin_flip
         });

         await delay(100);

         assert.isFalse(isTokenValid(expiredToken));

      });

      test("logout()", async () => {
         localStorage.setItem(constants.LOCAL_STORAGE_KEY, JSON.stringify({
            access_token: "token",
            refresh_token: "refresh_token"
         }));

         assert.isNotNull(localStorage.getItem(constants.LOCAL_STORAGE_KEY));

         await logout();

         assert.isNull(localStorage.getItem(constants.LOCAL_STORAGE_KEY));
      });

   });

   
});