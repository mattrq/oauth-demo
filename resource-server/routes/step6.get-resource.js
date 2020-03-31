/* eslint-disable no-multi-str */
const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const crypto = require('crypto');
const moment = require('moment');

const publicKey =
  '-----BEGIN RSA PUBLIC KEY-----\n\
MIGJAoGBAMx6iQz6+tf2dZizcQ8lhZA6OcjXqy6i5f+yfUC1HztLkjHB8EeROfJz\n\
FDpXk97CDpAnIGSeBxi8fuFCHcXijnnC6umPMULF6EXuyY4conF1jgIEFUmFWpP3\n\
IQaki8Y8xofjutj7IC4LhcSo9tdOnw9FjWkGZ7nfrYYjLEZF9QcNAgMBAAE=\n\
-----END RSA PUBLIC KEY-----';

const base64UrlToBase64 = str => {
  const pad = 4 - (str.length % 4);
  return str
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(pad === 4 ? 0 : pad, '=');
};

const base64UrlToObject = str =>
  JSON.parse(
    Buffer.from(base64UrlToBase64(str), 'base64').toString('utf8')
  );

const verifyJwt = (header, payload, signature, key) => {
  const verifierObject = crypto.createVerify('RSA-SHA512');
  verifierObject.update(`${header}.${payload}`);
  return verifierObject.verify(
    {
      key,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    },
    base64UrlToBase64(signature),
    'base64'
  );
};

const handler = async request => {
  const { authorization } = request.headers;
  const token = authorization.replace(/^Bearer /, '');

  // The JWT is made up of three parts
  const [jwtHeaderRaw, jwtPayloadRaw, jwtSignature] = token.split(
    '.'
  );

  const jwtHeader = base64UrlToObject(jwtHeaderRaw);
  if (jwtHeader.alg !== 'RS512') {
    return Boom.badRequest(
      `Signing algorithm not expected RS512, got ${jwtHeader.alg}`
    );
  }

  if (
    !verifyJwt(jwtHeaderRaw, jwtPayloadRaw, jwtSignature, publicKey)
  ) {
    return Boom.badRequest('Signature did not match');
  }

  const now = moment();
  const jwtPayload = base64UrlToObject(jwtPayloadRaw);
  if (moment.unix(jwtPayload.exp).isBefore(now)) {
    return Boom.badRequest('Token has expired');
  }

  if (moment.unix(jwtPayload.nbf).isAfter(now)) {
    return Boom.badRequest('Token not yet ready to be used');
  }

  return {
    secret: 'This is a secret',
    jwt: { header: jwtHeader, payload: jwtPayload },
  };

  // Go back to to file: /client-server/routes/step3.callback.js
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
        authorization: Joi.string().required(),
      }).options({ allowUnknown: true }),
    },
  },
};
