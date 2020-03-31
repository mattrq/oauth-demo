/* eslint-disable no-console */
const isDev = process.env.NODE_ENV !== 'production';
const fs = require('fs');
const Hapi = require('@hapi/hapi');
const Vision = require('@hapi/vision');
const Yar = require('@hapi/yar');
const Handlebars = require('handlebars');
const Pino = require('hapi-pino');

const findRoutes = dir =>
  fs
    .readdirSync(dir)
    .filter(file => /\.js$/.test(file))
    .map(file => dir + file.slice(0, -3))
    // eslint-disable-next-line import/no-dynamic-require,global-require
    .map(file => require(file))
    .flat();

const registerRoutes = (server, dir) =>
  findRoutes(dir).forEach(route => server.route(route));

const startServer = async (
  port,
  baseDir,
  initFunction = () => {}
) => {
  const server = Hapi.server({ port });

  await server.register(Vision);

  await server.register({
    plugin: Yar,
    options: {
      cookieOptions: {
        password: 'the-password-must-be-at-least-32-characters-long', // TODO: Change this
        isSecure: !isDev, // never set to false in production
        isSameSite: 'Strict',
        isHttpOnly: true,
      },
    },
  });

  await initFunction(server, { isDev });

  Handlebars.registerHelper('json', data =>
    JSON.stringify(data, null, 4)
  );

  server.views({
    engines: {
      html: Handlebars,
    },
    relativeTo: baseDir,
    path: 'templates',
  });

  await server.register({
    plugin: Pino,
    options: {
      prettyPrint: isDev,
      // Redact Authorization headers, see https://getpino.io/#/docs/redaction
      redact: ['req.headers.authorization'],
    },
  });

  registerRoutes(server, `${baseDir}/routes/`);

  await server.start();

  console.log('Server running on %s', server.info.uri);

  return server;
};

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});

module.exports = startServer;
