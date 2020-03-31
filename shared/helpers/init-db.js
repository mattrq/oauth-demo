const mongoose = require('mongoose');
const hasConnection = require('./db');
const application = require('../models/application');
const applicationData = require('../data/applications');
const user = require('../models/user');
const userData = require('../data/users');
const oAuthRequest = require('../models/oauth-request');

module.exports = async (reset = true) => {
  await hasConnection();

  const knownCollections = [application, user, oAuthRequest].map(
    c => c.collection.collectionName
  );

  const collectionsToDrop = Object.values(
    mongoose.connection.collections
  )
    .map(collection => collection.collectionName)
    .filter(collection => !knownCollections.includes(collection));

  await Promise.all(
    Object.keys(collectionsToDrop).map(async collection =>
      mongoose.connection.dropCollection(collection)
    )
  );

  if (reset) {
    await application.deleteMany({});
    await user.deleteMany({});
    await oAuthRequest.deleteMany({});
  }

  if ((await application.countDocuments()) === 0) {
    await application.insertMany(applicationData);
  }

  if ((await user.countDocuments()) === 0) {
    await user.insertMany(userData);
  }
};
