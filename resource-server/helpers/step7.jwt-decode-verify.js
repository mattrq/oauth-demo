const crypto = require('crypto');

// Revert the changes to make the base64 string safe back to standard base 64
//  - Change "-"" to "+"
//  - Change "_" to "/"
//  - Add the "=" padding back
const base64UrlToBase64 = str => {
  const pad = 4 - (str.length % 4);
  return str
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(pad === 4 ? 0 : pad, '=');
};

// Convert base64Url string to Object
//  - Converts base64Url to base64
//  - Converts base64 to utf8 json string
//  - Converts json string to object
const base64UrlToObject = str =>
  JSON.parse(
    Buffer.from(base64UrlToBase64(str), 'base64').toString('utf8')
  );

// Checks the information in the JWT against the public key using RS512
//  - Rebuild the string to sign
//  - Run the HMAC verifier with the public key
const verifyJwt = (header, payload, signature, key) => {
  const verifierObject = crypto.createVerify('RSA-SHA512');
  // Rebuild the sting to be checked
  verifierObject.update(`${header}.${payload}`);
  // Verify the HMAC signature
  return verifierObject.verify(
    {
      key,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    },
    base64UrlToBase64(signature),
    'base64'
  );
};

// Parse the content of the token and throw an error if there is an issue validating it
const decodeJwt = (publicKey, token) => {
  // The JWT is made up of three parts separated by "."
  // 1. Header
  // 2. Payload
  // 3. Signature
  const [headerRaw, payloadRaw, signatureRaw] = token.split('.');

  // Decode the JWT Header and check the algorithm is one that is supported
  const header = base64UrlToObject(headerRaw);
  if (header.alg !== 'RS512') {
    throw new Error(
      `Signing algorithm not expected RS512, got ${header.alg}`
    );
  }

  const claims = base64UrlToObject(payloadRaw);

  // Check the signing of the JWT
  // See the "verifyJwt" defined above
  if (!verifyJwt(headerRaw, payloadRaw, signatureRaw, publicKey)) {
    throw new Error('Signature did not match');
  }

  return {
    header,
    claims,
  };
};

module.exports = decodeJwt;
