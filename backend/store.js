/**
 * @callback GetUserInfoCallback
 * @param {object} credentials Object containing login credentials
 * @returns {Promise<{
 * 	tokenPayload: object;
 * 	user: object;
 * }>?} Object containing user information and an object with a tokenPayload field used to generate tokens. If user is invalid, return null
 */

/**
 * @callback LoggerCallback
 * @param {...any} args 
 */

/** 
 * @typedef Authenticator
 * @property {GetUserInfoCallback} getUserInfo
 */

/**
 * @typedef Logger
 * @property {LoggerCallback} log
 * @property {LoggerCallback} error
 */

/**
 * @type {{
 *    initialized: boolean;
 *    secretKey: string;
 *    accessTokenValidityPeriod: number;
 *    refreshTokenValidityPeriod: number;
 *    authenticator: Authenticator;
 *    logger: Logger;
 * }}
 */
const store = {};

module.exports = store;