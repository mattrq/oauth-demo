const crypto = require('crypto');

// Make Base 64 url friendly
// By:
// Remove "="" (use for padding only)
// Change "+" to "-"
// Change "/" to "_"
const base64Url = str =>
  str.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

// Convert object to a encoded version
// The following transforms are applied:
//  - JSON version of the object
//  - base64 of the JSON
//  - convert none URL friendly chars "=" "/" "+"
const objectEncodeB64Url = obj =>
  base64Url(Buffer.from(JSON.stringify(obj)).toString('base64'));

// Sign a string with RSA SHA512
// Uses an appropriate paddling
const signRS512 = (privateKey, str) => {
  const signer = crypto.createSign('RSA-SHA512');
  signer.update(str);
  return signer.sign(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    },
    'base64'
  );
};

// Generate a JWT signed using RS512 from a payload
const generateJwtRS512 = (privateKey, payload) => {
  // Add the data for the header
  const header = {
    // Algorithm: Identify the signing algorithm, their are a limited set in JWT
    // In this case we are using a version which uses a Key Pair to allow verification. RSA with SHA512
    alg: 'RS512',
    // Type: Identifies the type, usually set too JTW
    typ: 'JWT',
  };

  // Create the Header, this is turned to JSON, then Base64, and then replace
  // none URL friendly chars "=" "/" "+"
  const encodedHeader = objectEncodeB64Url(header);

  // Create the encoded payload by applying the sames process as above
  const encodedPayload = objectEncodeB64Url(payload);

  // Join the encoded header and the encoded payload with a "." as separator
  const toSign = `${encodedHeader}.${encodedPayload}`;

  // Sign the combined header and payload using a private key
  const signature = signRS512(privateKey, toSign);

  // Add the signature as a URL safe Base 64 on to the end of the combined
  // header and payload with a "." as separator
  return `${toSign}.${base64Url(signature)}`;

  // Go back to to file: /client-server/routes/step3.callback.js
};

module.exports = generateJwtRS512;
