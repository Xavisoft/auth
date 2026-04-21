
# @xavisoft/auth
## Installation
```bash
npm i @xavisoft/auth --registry=https://verdaccio.xavisoft.co.zw
```

## Overview 
This package is a JWT based auth middleware for `express` and `axios`. It provides `login` and `refresh` endpoints out of the box. It also automatically sends an *access token* with each request, and handles all the token decoding for you.

## Usage
### Backend
#### Setting up middleware
You first need to create an `authenticator` object, as show below:

```js
// this function takes user credentials as an object
// and verify them
// if correct it should return the user information
// the developer wants store in the token
// (user id, priviledges, e.t.c) and the profile
// information (full name, email, etc) to send back to
// the client, otherwise it should return null
// if you want to do asyncronous operations in this function
// you can make it return a promise (or just make it "async")
async function getUserInfo(credentials) {
	if (/* credentials are correct */) {
      return {
         tokenPayload: { /* user info to encode into the JWT */ },
         user: { /* user profile to return to the client */ }
      }
   }
}

const authenticator = {
   getUserInfo,
}
```

Then add the attach the auth middleware on your express app as shown below:

```js
const express = require('express');
const { init } = require('@xavisoft/auth/backend');

const app = express();

// other middlewares ...

init({
   app,
   route, // endpoint to use for login
   authenticator,
   accessTokenValidityPeriod, // in milliseconds (default: 30 minutes)
   refreshTokenValidityPeriod, // in milliseconds (default: 7 days)
   secretKey, // the secret key for token signing and verification
   logger // optional logger for debugging
})

// other middlewares and routes ...

```

#### Authentication and Authorization
When a user logs in, you should send the credentials via a POST request to the endpoint you provided above.

When subsequent requests are sent after a successful login, they will be accompanied by a *JWT access token* in the headers (provided you set up your front-end, see instuctions [here](#frontend)).
All middlewares and routes that comes after the auth middleware will have access to the auth information via `req.auth.user` object. This object will contain the information returned by `authenticator.getUserInfo()` during login. If `req.auth` is not available, it indicates that either the token is invalid, expired or it wasn't sent at all.

```js
app.get('/user-info', (req, res) => {

   // auth
   if (!req.auth)
      return res.sendStatus(401);

   const userId = req.auth.user.id;

   // logic to fetch user info using userId goes here

});
```

### Frontend
#### Using axios
If you are using axios, you can set it up to automatically capture access and refresh tokens, send the access token on each requests, and automatically refreshes the access token when it expires. It achieves this by using axios *interceptors* internally.

##### Initializing
```js
const axios = require('axios');
const init = require('@xavisoft/auth/frontend');

const instance = axios.create();

init({
   axios: instance,
   refreshRoute: 'refresh-endpoint' // the endpoint to use for refreshing tokens, should match the route endpoint for login set on the backend
});
```

##### Check if authenticated
When your app loads, before you ask the user to login, check if the user is authenticated

```js
const { isAuthenticated } = require('@xavisoft/auth/frontend/utils');

// check if authenticated (i.e. the tokens are not expired)
const authenticated = await isAuthenticated();
if (authenticated) {
   // fetch profile
   // redirect to dashboard
}

```

##### Logout
```js
const { logout } = require('@xavisoft/auth/frontend/utils');

await logout();
```

#### Using other libraries
If you are using another HTTP client other than `axios`, you can manually capture and refresh tokens.

##### Capturing tokens
When you send a request to the login endpoint, if the login is successful, you get the following headers in your response:
- `openstack-xavisoft-access-token`
- `openstack-xavisoft-refresh-token`

When you do a refresh you also get the same tokens. You can store these values as you see fit.

#### Sending access token
To authenticate a request, you need to send the `openstack-xavisoft-access-token` header with each request.

#### Refreshing access token
To refresh an access token, send the refresh token on any endpoint, then check the response headers for the new tokens
