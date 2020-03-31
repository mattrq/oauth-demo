const HapiBasic = require('@hapi/basic');
const startServer = require('../shared/start-server');
const initDB = require('../shared/helpers/init-db');
const validate = require('../shared/helpers/validate-login');

startServer(8081, __dirname, async server => {
  await initDB();
  await server.register(HapiBasic);
  server.auth.strategy('simple', 'basic', { validate });
});
