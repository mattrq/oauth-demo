const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const Wreck = require('@hapi/wreck');
const config = require('../config');

const handler = async (request, h) => {
  const {
    code,
    error_description: errorDescription,
    state,
    error,
  } = request.query;

  // Get the pre agreed client id and secret. Shared details for client-server are in /client-server/config.js
  const { clientId, clientSecret } = config;

  // Check State matches the one we stored in the session
  if (state !== request.yar.get('state')) {
    return Boom.badRequest('State is not as expected');
  }

  // Check if this is an error, if so show the error
  if (error) {
    return Boom.badRequest(errorDescription);
  }

  // Fetch the OAuth Token using the code and our secret
  // This part is server to server, this means that the sessions/auth that the user logins in is not on this request
  const tokenRequestUrl = new URL(
    // Note this is a direct connection (server to server) and we are using docker
    // we need to use the internal docker DNS name for the auth server (this is defined in the docker-compose file)
    'http://authorization:8081/oauth/token'
  );

  // Pass back the redirect url to be validated
  tokenRequestUrl.searchParams.set(
    'redirect_uri',
    'http://localhost:8080/callback'
  );

  tokenRequestUrl.searchParams.set('code', code);
  tokenRequestUrl.searchParams.set(
    'grant_type',
    'authorization_code'
  );
  tokenRequestUrl.searchParams.set('client_id', clientId);
  tokenRequestUrl.searchParams.set('client_secret', clientSecret);

  // next step go to file: /authorization-server/routes/step4.get-token.js
  const { payload: accessDetails } = await Wreck.get(
    tokenRequestUrl,
    { json: true }
  );

  // Now we fetch the content from the resource server
  // The "access token" is added as a Bearer token
  // next step go to file: /resource-server/routes/step6.get-resource.js
  const { payload } = await Wreck.get(
    'http://resource:8082/content/123',
    {
      json: true,
      headers: {
        authorization: `Bearer ${accessDetails.access_token}`,
      },
    }
  );

  // Display content
  return h.view('step7-show-resource', {
    payload,
    accessDetails,
  });

  // Done!
};

module.exports = {
  method: 'GET',
  path: '/callback',
  handler,
  options: {
    auth: false,
    validate: {
      payload: false,
      query: Joi.object({
        state: Joi.string().hex().required(),
        error: Joi.string().valid('invalid_request'),
        error_description: Joi.string(),
        code: Joi.string(),
      })
        .oxor('error', 'code')
        .with('error', 'error_description')
        .without('code', 'error_description'),
    },
  },
};
