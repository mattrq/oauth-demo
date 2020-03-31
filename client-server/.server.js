const startServer = require('../shared/start-server');
const hapiDevErrors = require('hapi-dev-errors');

startServer(8080, __dirname, async (server, options) => {
  if (options.isDev) {
    await server.register({
      plugin: hapiDevErrors,
      options: {
        showErrors: true,
      },
    });
  }
});
