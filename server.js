'use strict';

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

require('dotenv').config();

var routes = require('./src/config/routes');

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT,
        host: 'localhost',
        routes: {
            cors: {
                origin: ['http://localhost:5173'],
                headers: ['Authorization', 'Accept', 'Content-Type'],
                additionalHeaders: ['access-control-allow-origin']
            }
        }
    });

    await server.register(Jwt);

    server.auth.strategy('jwt', 'jwt', {
        keys: process.env.JWTSECRET,
        verify: {
            aud: false,
            iss: false,
            sub: false,
            maxAgeSec: 14400
        },
        validate: async (artifacts, request, h) => {
            const isValid = !!artifacts.decoded.payload;
            return { isValid, credentials: artifacts.decoded.payload };
        }
    });

    server.auth.default('jwt');

    server.route(routes);

    await server.start();
    console.log('Server running on', server.info.uri);
};


process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
