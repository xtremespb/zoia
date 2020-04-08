import path from "path";
import fs from "fs-extra";
import fastifyMongo from "fastify-mongodb";
import fastifyURLData from "fastify-url-data";
import fastifyCORS from "fastify-cors";
import fastifyJWT from "fastify-jwt";
import fastifyFormbody from "fastify-formbody";
import fastifyMultipart from "fastify-multipart";
import fastifyCookie from "fastify-cookie";
import Pino from "pino";
import Fastify from "fastify";
import {
    MongoClient
} from "mongodb";
import logger from "../../lib/logger";
import loggerHelpers from "../../lib/loggerHelpers";
import site from "../../lib/site";
import internalServerErrorHandler from "./internalServerErrorHandler";
import notFoundErrorHandler from "./notFoundErrorHandler";
import modules from "../../../etc/modules.json";
import response from "../../lib/response";

(async () => {
    let config;
    let templates;
    let pino;
    try {
        config = await fs.readJSON(path.resolve(`${__dirname}/../../etc/zoia.json`));
        templates = await fs.readJSON(path.resolve(`${__dirname}/../../etc/templates.json`));
        pino = Pino({
            level: config.logLevel
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
            trustProxy: config.trustProxy,
            ignoreTrailingSlash: true
        });
        // Create MongoDB client and connect
        const mongoClient = new MongoClient(config.mongo.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await mongoClient.connect();
        // Regitser MongoDB for Fastify
        fastify.register(fastifyMongo, {
            client: mongoClient,
            database: config.mongo.dbName
        }).register((ff, opts, next) => {
            ff.mongo.client.db(config.mongo.dbName).on("close", () => {
                pino.error("Connection to MongoDB is broken");
                process.exit(1);
            });
            next();
        });
        // Decorate Fastify with configuration and helpers
        fastify.decorate("zoiaSite", site);
        fastify.decorateRequest("ZoiaSite", site);
        fastify.decorate("zoiaConfig", config);
        fastify.decorateRequest("zoiaConfig", config);
        fastify.decorate("zoiaTemplates", templates);
        fastify.decorateRequest("zoiaTemplates", templates);
        Object.keys(loggerHelpers).map(i => fastify.decorateReply(i, loggerHelpers[i]));
        Object.keys(response).map(i => fastify.decorateReply(i, response[i]));
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
            origin: config.originCORS
        });
        // Register JWT
        fastify.register(fastifyJWT, {
            secret: config.secret
        });
        // Set handler for error 404
        fastify.setNotFoundHandler((req, rep) => notFoundErrorHandler(req, rep));
        // Set handler for error 500
        fastify.setErrorHandler((err, req, rep) => internalServerErrorHandler(err, req, rep));
        // Load all web server modules
        await Promise.all(Object.keys(modules).map(async m => {
            try {
                const module = await import(`../../../modules/${m}/web/index.js`);
                module.default(fastify);
                pino.info(`Web Module loaded: ${m}`);
            } catch (e) {
                pino.info(`Cannot load module: ${m} (${e.message})`);
            }
        }));
        // Load all API modules
        await Promise.all(Object.keys(modules).map(async m => {
            try {
                const module = await import(`../../../modules/${m}/api/index.js`);
                module.default(fastify);
                pino.info(`API Module loaded: ${m}`);
            } catch (e) {
                pino.info(`Cannot load API module: ${m}`);
            }
        }));
        // Start server
        await fastify.listen(config.webServer.port, config.webServer.ip);
    } catch (e) {
        pino.error(e.message);
        process.exit(1);
    }
})();
