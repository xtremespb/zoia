import path from 'path';
import fs from 'fs-extra';
import fastifyMongo from 'fastify-mongodb';
import fastifyURLData from 'fastify-url-data';
import fastifyCORS from 'fastify-cors';
import fastifyJWT from 'fastify-jwt';
import fastifyFormbody from 'fastify-formbody';
import fastifyMultipart from 'fastify-multipart';
import fastifyRateLimit from 'fastify-rate-limit';
import nodemailer from 'nodemailer';
import {
    MongoClient
} from 'mongodb';
import Pino from 'pino';
import Fastify from 'fastify';
import modules from '../build/modules.json';
import logger from '../lib/logger';
import loggerHelpers from '../lib/loggerHelpers';
import response from '../lib/response';
import auth from '../lib/auth';
import locale from '../lib/locale';
import email from '../lib/email';
import xxhash from '../lib/xxhash';

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
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        process.exit(1);
    }
    try {
        pino.info(`Starting`);
        // Create Fastify instance
        const fastify = Fastify({
            logger,
            trustProxy: secure.trustProxy
        });
        // Create Nodemailer instance
        const mailer = nodemailer.createTransport(secure.mailer);
        // Decorate Fastify with configuration and helpers
        fastify.decorate('zoiaConfig', config);
        fastify.decorate('zoiaConfigSecure', secure);
        fastify.decorateRequest('zoiaConfig', config);
        fastify.decorateRequest('zoiaConfigSecure', secure);
        fastify.decorate('zoiaMailer', mailer);
        fastify.decorateRequest('zoiaMailer', mailer);
        fastify.decorate('xxhash', data => xxhash(data, secure.randomInt));
        Object.keys(response).map(i => fastify.decorateReply(i, response[i]));
        Object.keys(loggerHelpers).map(i => fastify.decorateReply(i, loggerHelpers[i]));
        Object.keys(auth).map(i => fastify.decorateRequest(i, auth[i]));
        Object.keys(locale).map(i => fastify.decorateRequest(i, locale[i]));
        Object.keys(email).map(i => fastify.decorateReply(i, email[i]));
        // Create MongoDB client and connect
        const mongoClient = new MongoClient(secure.mongo.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await mongoClient.connect();
        // Register FormBody and Multipart
        fastify.register(fastifyFormbody);
        fastify.register(fastifyMultipart, {
            addToBody: true
        });
        // Register URL Data Processor
        fastify.register(fastifyURLData);
        // Regitser MongoDB for Fastify
        fastify.register(fastifyMongo, {
            client: mongoClient,
            database: secure.mongo.dbName
        }).register((ff, opts, next) => {
            ff.mongo.client.db(secure.mongo.dbName).on('close', () => {
                pino.error('Connection to MongoDB is broken');
                process.exit(1);
            });
            next();
        });
        // Register CORS
        fastify.register(fastifyCORS, {
            origin: secure.originCORS
        });
        // Register JWT
        fastify.register(fastifyJWT, {
            secret: secure.secret
        });
        // Register Redis instance (if defined in config)
        if (secure.redisEnabled && secure.redisConfig) {
            pino.info(`Loading Redis (ioredis) support`);
            const Redis = require('ioredis');
            const redis = new Redis(secure.redisConfig);
            redis.on('error', e => {
                pino.error(`Redis: ${e}`);
                process.exit(1);
            });
            if (secure.rateLimitOptionsAPI) {
                secure.rateLimitOptionsAPI.redis = redis;
            }
            fastify.decorate('redis', redis);
        }
        // Do we need to set rate limiting?
        if (secure.rateLimitOptionsAPI) {
            pino.info(`Setting Rate Limit configuration for API Services`);
            // const whitelist = [...secure.rateLimitOptionsAPI.whitelist, secure.webServer.ip];
            const whitelist = [];
            secure.rateLimitOptionsAPI.keyGenerator = req => fastify.xxhash(`${req.ip}${req.urlData().path}`);
            secure.rateLimitOptionsAPI.whitelist = req => whitelist.indexOf(req.ip) > -1;
            fastify.register(fastifyRateLimit, secure.rateLimitOptionsAPI);
        }
        // Load API modules
        await Promise.all(Object.keys(modules).map(async m => {
            try {
                const module = await import(`../../modules/${m}/api/index.js`);
                module.default(fastify);
                pino.info(`API Module loaded: ${m}`);
            } catch (e) {
                pino.info(`Cannot load API module: ${m}`);
            }
        }));
        // Listen on specified IP and port
        await fastify.listen(secure.apiServer.port, secure.apiServer.ip);
    } catch (e) {
        pino.error(e);
        process.exit(1);
    }
})();
