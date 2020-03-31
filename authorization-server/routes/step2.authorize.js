const Joi = require('@hapi/joi');
const cryptoRandomString = require('crypto-random-string');

const application = require('../../shared/models/application');
const oAuthRequest = require('../../shared/models/oauth-request');

const handler = async (request, h) => {
  // Destruct some of the commonly used query parameters
  const {
    state,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    response_type: responseType,
  } = request.query;

  // Internal helper function to generate error URLs
  const generateInvalidRequest = reason => {
    // Create the URL back to the "client" server if the request is invalid
    const url = new URL(redirectUri);
    // Give the reasons the request failed
    url.searchParams.set('error', 'invalid_request');
    url.searchParams.set('error_description', reason);
    // Send the state check back
    url.searchParams.set('state', state);

    return url;
  };

  // ########[ Do Checks ]########

  // This end point only supports OAuth2 v2 Authorization Code flow
  // Hence we don't check the "response_type". But we do require in the validation above

  // Look up the client identifier in the list of registered applications
  // The defaults are set in "/authorization-server/data/applications.js"
  const app = await application.findById(clientId);
  if (!app) {
    return h
      .redirect(generateInvalidRequest('Invalid client_id'))
      .temporary();
  }

  // Here we check if the callback URL matches the one expected, not required as part of OAuth but a sensible check
  const normalizedRedirectUri = redirectUri.replace(/[?#].*$/, '');
  if (!app.redirectUris.includes(normalizedRedirectUri)) {
    return h
      .redirect(generateInvalidRequest('Invalid redirect'))
      .temporary();
  }

  // Check if the state has been used before
  const authRequest = oAuthRequest.findOne({ state });
  if (!authRequest) {
    return h
      .redirect(generateInvalidRequest('State used before'))
      .temporary();
  }

  // ########[ Generate View ]########

  // Create the URL back to the "client" server if the request is declined by adding parameters to the redirect_url
  const declineUrl = generateInvalidRequest('Declined');

  // Create the URL back to the "client" server if the request is accept by adding parameters to the redirect_url
  const acceptUrl = new URL(redirectUri);
  // Create a random token to validate later
  const code = cryptoRandomString({ length: 32 });

  // Store the random token and other information to be checked later
  oAuthRequest.create({
    state,
    clientId,
    responseType,
    redirectUri,
    code,
    scope: [scope],
    userId: request.auth.credentials.id,
  });

  // Send the token back to the "client" server to be used later to swap for the access token
  acceptUrl.searchParams.set('code', code);
  // Send the state check back
  acceptUrl.searchParams.set('state', state);

  const viewData = {
    declineUrl,
    acceptUrl,
    scope,
    name: request.auth.credentials.name,
    host: new URL(redirectUri).hostname,
  };
  return h.view('step2-authorize', viewData);

  // Next step go to file: /client-server/routes/step3.callback.js
};

module.exports = {
  method: 'GET',
  path: '/oauth/authorize',
  handler,
  options: {
    // Use a simple authentication
    auth: 'simple',
    // Validate the request
    validate: {
      payload: false,
      query: Joi.object({
        client_id: Joi.string().hex().length(24),
        redirect_uri: Joi.string()
          .uri({ scheme: [/https?/] })
          .required(),
        response_type: Joi.string().valid('code').required(),
        scope: Joi.string().valid('resource:read').required(),
        state: Joi.string().required(),
      }).required(),
    },
  },
};
