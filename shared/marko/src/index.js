import path from "path";
import fs from "fs-extra";
import fastifyURLData from "fastify-url-data";
import fastifyCORS from "fastify-cors";
import fastifyJWT from "fastify-jwt";
import fastifyFormbody from "fastify-formbody";
import fastifyMultipart from "fastify-multipart";
import fastifyCookie from "fastify-cookie";
import Pino from "pino";
import Fastify from "fastify";
import logger from "../../lib/logger";
import loggerHelpers from '../../lib/loggerHelpers';
import site from "../../lib/site";
import internalServerErrorHandler from "./internalServerErrorHandler";
import notFoundErrorHandler from "./notFoundErrorHandler";

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
        // Decorate Fastify with configuration and helpers
        fastify.decorate("zoiaSite", site);
        fastify.decorateRequest("zoiaSite", site);
        fastify.decorate("zoiaConfig", config);
        fastify.decorateRequest("zoiaConfig", config);
        fastify.decorate("zoiaTemplates", templates);
        fastify.decorateRequest("zoiaTemplates", templates);
        Object.keys(loggerHelpers).map(i => fastify.decorateReply(i, loggerHelpers[i]));
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
        // Start server
        await fastify.listen(config.webServer.port, config.webServer.ip);
    } catch (e) {
        pino.error(e.message);
        process.exit(1);
    }
})();
