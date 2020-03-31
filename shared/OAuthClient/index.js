const cryptoRandomString = require('crypto-random-string');

const generateUrl = (authorizePath, base, params) => {
  const url = new URL(authorizePath, base);

  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(
      key.replace(/(_*[A-Z])/g, '_$1').toLowerCase(),
      value
    )
  );

  return url;
};

module.exports = ({
  clientId,
  clientSecret,
  base,
  authorizePath,
  tokenPath,
}) => ({
  // TODO: Replace with internal function for this
  generateState: () =>
    cryptoRandomString({ length: 20, type: 'url-safe' }),

  getAuthorizationURL: (scope, redirectUri, state) => {
    const params = {
      clientId,
      redirectUri,
      responseType: 'code',
      scope: Array.isArray(scope) ? scope.join(' ') : scope,
      state,
    };

    return generateUrl(authorizePath, base, params);
  },

  getOAuthAccessToken: (code, redirectUri) => {
    const params = {
      clientId,
      client_secret: clientSecret,
      redirectUri,
      grant_type: 'authorization_code',
      code,
    };

    return generateUrl(tokenPath, base, params);
  },
});
