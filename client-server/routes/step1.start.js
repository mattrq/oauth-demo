const cryptoRandomString = require('crypto-random-string');
const config = require('../config');

const handler = (request, h) => {
  // Get the pre agreed client id. Shared details for client-server are in /client-server/config.js
  const { clientId } = config;

  // This beings the start of the OAuth v2 Authorization Code flow
  // We assume there is no token to begin with
  // and we also assume that the application has been previously registered with the app

  // Build the URL to begin the process to grant access to the protected resource

  // Start with the path to the "authorization" server and path to authorize a request
  const authRequestUrl = new URL(
    'http://localhost:8081/oauth/authorize'
  );

  // The following set the parameters on the request url

  // Set the identifier for this application registered with the "authorization" server
  authRequestUrl.searchParams.set('client_id', clientId);

  // Set the url to return to on this "client" server
  authRequestUrl.searchParams.set(
    'redirect_uri',
    'http://localhost:8080/callback'
  );

  // Set the type of interaction that we are initiating with the "authorization" server
  authRequestUrl.searchParams.set('response_type', 'code');

  // Set what it is we are requesting permission for
  authRequestUrl.searchParams.set('scope', 'resource:read');

  // Set a random token to be used later
  const state = cryptoRandomString({ length: 20 });
  authRequestUrl.searchParams.set('state', state);

  // Finished setting the parameters

  // Remember the state for later using a browser session, only accessible to the client
  request.yar.set('state', state);

  // Show the a, which will display a link to use our built URL
  return h.view('step1-start', { authRequestUrl });

  // next step go to file: /authorization-server/routes/step2.authorize.js
};

module.exports = {
  method: 'GET',
  path: '/',
  handler,
  options: {
    validate: {
      payload: false,
      query: false,
    },
  },
};
