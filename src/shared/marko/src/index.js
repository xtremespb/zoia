import path from 'path';
import fs from 'fs-extra';
import fastifyURLData from 'fastify-url-data';
import fastifyCORS from 'fastify-cors';
import fastifyJWT from 'fastify-jwt';
import fastifyFormbody from 'fastify-formbody';
import fastifyMultipart from 'fastify-multipart';
import fastifyCookie from 'fastify-cookie';
import fastifyCaching from 'fastify-caching';
import fastifyRateLimit from 'fastify-rate-limit';
import Pino from 'pino';
import Fastify from 'fastify';
import logger from '../../lib/logger';
import modules from '../../build/modules.json';
import site from '../../lib/site';
import templates from '../../../../dist/etc/templates.json';
import i18n from '../utils/i18n-node';
import loggerHelpers from '../../lib/loggerHelpers';
import response from '../../lib/response';
import auth from '../../lib/auth';
import locale from '../../lib/locale';
import internalServerErrorHandler from './internalServerErrorHandler';
import notFoundErrorHandler from './notFoundErrorHandler';
import xxhash from '../../lib/xxhash';

(async () => {
    let secure;
    let config;
    let pino;
    try {
        secure = await fs.readJSON(path.resolve(`${__dirname}/../etc/secure.json`));
        config = await fs.readJSON(path.resolve(`${__dirname}/../static/etc/config.json`));
        pino = Pino({
            level: secure.loglevel
        });
        pino.info(`Starting`);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        process.exit(1);
    }
    try {
        // Create Fastify instance
        const fastify = Fastify({
            logger,
            trustProxy: secure.trustProxy,
            ignoreTrailingSlash: true
        });
        // Decorate Fastify with configuration and helpers
        fastify.decorate('zoiaConfig', config);
        fastify.decorate('zoiaConfigSecure', secure);
        fastify.decorateRequest('zoiaConfig', config);
        fastify.decorateRequest('zoiaConfigSecure', secure);
        fastify.decorate('xxhash', data => xxhash(data, secure.randomInt));
        Object.keys(response).map(i => fastify.decorateReply(i, response[i]));
        Object.keys(loggerHelpers).map(i => fastify.decorateReply(i, loggerHelpers[i]));
        Object.keys(auth).map(i => fastify.decorateRequest(i, auth[i]));
        Object.keys(locale).map(i => fastify.decorateRequest(i, locale[i]));
        Object.keys(site).map(i => fastify.decorateRequest(i, site[i]));
        // Register FormBody and Multipart
        fastify.register(fastifyFormbody);
        fastify.register(fastifyMultipart, {
            addToBody: true
        });
        // Register URL Data Processor
        fastify.register(fastifyURLData);
        // Register Cookie Processor
        fastify.register(fastifyCookie);
        // Register CORS
        fastify.register(fastifyCORS, {
            origin: secure.originCORS
        });
        // Register JWT
        fastify.register(fastifyJWT, {
            secret: secure.secret
        });
        // Register Fastify Caching
        fastify.register(
            fastifyCaching, {},
            err => {
                if (err) {
                    throw err;
                }
            }
        );
        // Register Redis instance (if defined in config)
        if (secure.redisEnabled && secure.redisConfig) {
            pino.info(`Loading Redis (ioredis) support`);
            const Redis = require('ioredis');
            const redis = new Redis(secure.redisConfig);
            redis.on('error', e => {
                pino.error(`Redis: ${e}`);
                process.exit(1);
            });
            if (secure.rateLimitOptionsWeb) {
                secure.rateLimitOptionsWeb.redis = redis;
            }
            fastify.decorate('redis', redis);
        }
        // Do we need to set rate limiting?
        if (secure.rateLimitOptionsWeb) {
            pino.info(`Applying Rate Limit configuration`);
            secure.rateLimitOptionsWeb.whitelistIP = secure.rateLimitOptionsWeb.whitelistIP || [];
            const error = new Error('Rate limit exceed');
            error.response = {
                data: {
                    statusCode: 429
                }
            };
            secure.rateLimitOptionsWeb.errorResponseBuilder = () => error;
            secure.rateLimitOptionsWeb.keyGenerator = req => fastify.xxhash(`${req.ip}${req.urlData().path}`);
            const whitelist = [...secure.rateLimitOptionsWeb.whitelist];
            secure.rateLimitOptionsWeb.whitelist = req => whitelist.indexOf(req.ip) > -1;
            fastify.register(fastifyRateLimit, secure.rateLimitOptionsWeb);
        }
        // Load all User Space modules
        await Promise.all(Object.keys(modules).map(async m => {
            try {
                const module = await import(`../../../modules/${m}/user/index.js`);
                module.default(fastify);
                pino.info(`Module loaded: ${m}`);
            } catch (e) {
                pino.info(`Cannot load module: ${m} (${e.message})`);
            }
        }));
        // Set handler for error 404
        fastify.setNotFoundHandler((req, rep) => notFoundErrorHandler(req, rep, i18n, templates));
        // Set handler for error 500
        fastify.setErrorHandler((err, req, rep) => internalServerErrorHandler(err, req, rep, i18n, templates, secure));
        // Listen on specified IP and port
        await fastify.listen(secure.webServer.port, secure.webServer.ip);
    } catch (e) {
        pino.error(e);
        process.exit(1);
    }
})();
