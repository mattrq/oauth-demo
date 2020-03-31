const bcrypt = require('bcrypt');
const user = require('../models/user');

module.exports = async (request, username, password) => {
  const u = await user.findOne({ username });

  if (!u) {
    return { credentials: null, isValid: false };
  }

  const isValid = await bcrypt.compare(password, u.password);
  // eslint-disable-next-line no-underscore-dangle
  const credentials = { id: u._id, name: u.name };

  return { isValid, credentials };
};
