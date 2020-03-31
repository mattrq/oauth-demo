const mongoose = require('mongoose');

const connection = mongoose.connect('mongodb://db/auth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const hasConnection = async () => {
  if (connection.db) {
    return Promise.resolve(true);
  }
  return new Promise(resolve => connection.on('open', resolve(true)));
};

module.exports = hasConnection;
