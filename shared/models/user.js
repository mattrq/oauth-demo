const { Schema, model } = require('mongoose');

const schema = new Schema({
  username: { type: String, required: true, index: true },
  password: String,
  email: String,
  name: String,
});

module.exports = model('user', schema);
