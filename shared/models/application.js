const { Schema, model } = require('mongoose');

const schema = new Schema({
  name: String,
  clientSecret: { type: String, required: true },
  redirectUris: [{ type: String }],
});

module.exports = model('application', schema);
