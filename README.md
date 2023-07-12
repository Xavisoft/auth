
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
// e.g user id, priviledges, e.t.c
// if you want to do asyncronous operations in this function
// you can make it return a promise (or just make it "async")
function getUserInfo(credentials) {

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
   route, // endpoint to use for login and refresh
   authenticator,
   ACCESS_TOKEN_VALIDITY_PERIOD, // in milliseconds
   REFRESH_TOKEN_VALIDITY_PERIOD, // in milliseconds
   SECRET_KEY, // the secret key for token signing and verification
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
If you are using axios, you can set it up to automatically capture access and refresh tokens, send the access token on each requests, and automatically refreshes the access token when it is about to expire. It achieves this by using axios *interceptors* internally.

```js
const axios = require('axios');
const init = require('@xavisoft/auth/frontend');

const instance = axios.createInstance();

init({
   axios: instance,
   refreshRoute // the endpoint to use for refreshing tokens, should match the route endpoint for login set on the backend
});

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
To refresh access token, send a `GET` request to the route endpoint. You will get the new refresh and access tokens in the headers.
