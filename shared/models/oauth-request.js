const { Schema, model, Types } = require('mongoose');
const moment = require('moment');

const schema = new Schema({
  code: { type: String, required: true, unique: true, index: true },
  clientId: {
    type: Types.ObjectId,
    required: true,
    ref: 'application',
  },
  response_type: {
    type: String,
    enum: ['authorization_code'],
    lowercase: true,
  },
  redirectUri: String,
  scope: [String],
  expiration: {
    type: Date,
    default: () => moment().add(10, 'minutes'),
  },
  userId: {
    type: Types.ObjectId,
    required: true,
    ref: 'user',
  },
});

schema.set('toJSON', { virtuals: true });

module.exports = model('auth-request', schema);
