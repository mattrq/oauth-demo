/* eslint-disable no-multi-str */
const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');

const moment = require('moment');

const publicKey = `-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEAj3T8KZ6o9OLSMKDH5Y2bTKE78RNGOZWcIAtKFdujB9HUUo9L9DKk
+ffQ4J6HrsZ2ZN8SeSFdm4iqZF1tJimR5PPXlCMC+OpQkE/oF/DJkJk2tb4hp6MB
nYN6KVrvzUdb3z7eSovsShlTg75eBRwabmuFsa4OSUg4uOAQOqsSO4LrIoRyWsAc
bamxBAVo9Ze+jd7Gk5KkEIKDuXq97eN2dvLxE88MRFMjusWRQWZOM2D2y3kGANQ+
WFCp/qBRtCfAGjKqn7Piy3qu0Z/Hs/rQC0hAPyZhPwthJvl4TXgrhxCgaBWmARPY
W5R3VtVThEGfTsc8jIUfRQ1NLnhX4Yte5QIDAQAB
-----END RSA PUBLIC KEY-----`;

const decodeJwt = require('../helpers/step7.jwt-decode-verify');

const handler = async request => {
  // Get the authorization header containing the Bearer token
  const { authorization } = request.headers;

  // Strip the "Bearer" sign from the token
  const token = authorization.replace(/^Bearer /, '');

  // Decode the Jwt and verify signature, if there is an issue send a bad request
  // See: resource-server/helpers/step7.jwt-decode-verify.js
  // Need to us let as we are defining within try catch block which I
  // only want it wrapped around the one line
  let jwt;
  try {
    jwt = decodeJwt(publicKey, token);
  } catch (e) {
    return Boom.badRequest(e.message);
  }

  // Check the JWT has not expired
  const now = moment();
  if (!jwt.claims.exp || moment.unix(jwt.claims.exp).isBefore(now)) {
    return Boom.badRequest('Token has expired');
  }

  // Check the JWT has started
  if (jwt.claims.nbf || moment.unix(jwt.claims.nbf).isAfter(now)) {
    return Boom.badRequest('Token not yet ready to be used');
  }

  // Check the scope
  if (
    !jwt.claims.scope ||
    !jwt.claims.scope.includes('resource:read')
  ) {
    return Boom.badRequest('Token not yet ready to be used');
  }

  return {
    secret: 'This is a secret from the resource server',
    // The JWT is not normally shared
    jwt,
  };

  // Go back to to file: client-server/routes/step3.callback.js
};

module.exports = {
  method: 'GET',
  path: '/content/{id}',
  handler,
  options: {
    auth: false,
    validate: {
      payload: false,
      query: false,
      params: Joi.object({
        id: Joi.string().required(),
      }),
      headers: Joi.object({
        authorization: Joi.string()
          .pattern(/^Bearer [.A-Za-z0-9_-]+$/)
          .required(),
      }).options({ allowUnknown: true }),
    },
  },
};
