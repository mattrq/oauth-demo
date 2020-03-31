const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const moment = require('moment');
const applications = require('../../shared/models/application');
const oAuthRequests = require('../../shared/models/oauth-request');
const config = require('../config');
const generateJwt = require('../helpers/step5.generate-jwt');

const handler = async request => {
  const {
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    client_secret: clientSecret,
  } = request.query;

  // Get the pre agreed client id. Shared details for client-server are in /authorization-server/config.js
  const { privateKey } = config;

  // ########[ Do Checks ]########

  // Look up code, automatic check
  const authReq = await oAuthRequests.findOne({ code });
  if (!authReq) {
    return Boom.badRequest('Request not found');
  }

  // Check the requests is in date
  const now = moment();
  if (now.isAfter(authReq.expiration)) {
    return Boom.badRequest('Request expired');
  }

  // Check the redirect URL matches the request
  if (authReq.redirectUri !== redirectUri) {
    return Boom.badRequest(
      `Redirect URI does not match, expected: "${authReq.redirectUri}" got "${redirectUri}"`
    );
  }

  // Check the client_id matches
  // eslint-disable-next-line eqeqeq
  if (authReq.clientId != clientId) {
    return Boom.badRequest(
      `Client ID does not match, expected: "${authReq.clientId}" got "${clientId}"`
    );
  }

  // Lookup the client
  const app = await applications.findById(clientId);
  if (!app) {
    return Boom.badRequest('No client');
  }

  // Check the secret matches
  // eslint-disable-next-line eqeqeq
  if (app.clientSecret != clientSecret) {
    return Boom.badRequest('Client Secret does not match');
  }

  // ########[ Generate Token ]########

  // Define the expiration of the access token 15 minutes
  const expiration = moment().add('15', 'minutes');

  const accessTokenPayload = {
    // Issued at: Identifies the time at which the JWT was as unix epoch
    iat: now.unix(),
    // TODO Issued at: Identifies the time at which the JWT was as unix epoch
    nft: now.unix(),
    // Expiration Time: Identifies the expiration time on and after which the JWT must not be accepted as unix epoch
    exp: expiration.unix(),
    // Audience:	Identifies the recipients that the JWT is intended for. Each principal intended to process the JWT must identify itself with a value in the audience claim. If the principal processing the claim does not identify itself with a value in the aud claim when this claim is present, then the JWT must be rejected.
    aud: new URL(redirectUri).origin,
    // Issuer: Identifies principal that issued the JWT.
    iss: request.url.origin,
    // Scope: Array of allowed access
    scope: authReq.scope,
    // Subject: Identifies the subject of the JWT
    sub: authReq.userId,
    // Application: The party to which the ID Token was issued
    azp: authReq.clientId,
  };

  return {
    // Create the JWT access token: See /authorization-server/helpers/step5.generate-jwt.js
    access_token: generateJwt(privateKey, accessTokenPayload),
    // Type of the token, in this case as "Bearer" token
    token_type: 'bearer',
    // Indicate the number of seconds until the token expires
    expires_in: expiration.diff(now, 'seconds'),
    // Indicate the scope of the access
    scope: authReq.scope,
    // Indicate the user ID of the user which authorized this token
    uid: authReq.userId,
  };

  // Go back to to file: /client-server/routes/step3.callback.js
};

module.exports = {
  method: 'GET',
  path: '/oauth/token',
  handler,
  options: {
    auth: false,
    validate: {
      payload: false,
      query: Joi.object({
        client_id: Joi.string().hex().length(24).required(),
        client_secret: Joi.string().required(),
        redirect_uri: Joi.string()
          .uri({ scheme: [/https?/] })
          .required(),
        grant_type: Joi.string()
          .valid('authorization_code')
          .required(),
        code: Joi.string().required(),
      }),
    },
  },
};
