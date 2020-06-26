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
import Telegraf from "telegraf";
import Fastify from "fastify";
import {
    MongoClient
} from "mongodb";
import logger from "../../lib/logger";
import loggerHelpers from "../../lib/loggerHelpers";
import telegramHelpers from "../../lib/telegramHelpers";
import site from "../../lib/site";
import internalServerErrorHandler from "./internalServerErrorHandler";
import notFoundErrorHandler from "./notFoundErrorHandler";
import response from "../../lib/response";
import utils from "../../lib/utils";
import extendedValidation from "../../lib/extendedValidation";

(async () => {
    let buildJson;
    let config;
    let templates;
    let pino;
    let modules;
    let packageJson;
    const modulesConfig = {};
    try {
        buildJson = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/auto/build.json`));
        config = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`));
        pino = Pino({
            level: config.logLevel
        });
        pino.info(`Starting ZOIA ${buildJson.version} / ${buildJson.mode} (built at: ${buildJson.date})`);
        packageJson = fs.readJSONSync(path.resolve(`${__dirname}/../../package.json`));
        templates = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/auto/templates.json`));
        modules = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/auto/modules.json`));
        const defaultConfigs = [];
        pino.info(`Built-in templates: ${templates.available.join(", ")}`);
        modules.map(m => {
            try {
                modulesConfig[m.id] = require(`../../../modules/${m.id}/config.dist.json`);
            } catch (e) {
                pino.error(`Unable to load default config for ${m.id}`);
                process.exit(1);
            }
            try {
                modulesConfig[m.id] = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/modules/${m.id}.json`));
                m.admin = modulesConfig[m.id] && modulesConfig[m.id].routes && modulesConfig[m.id].routes.admin ? modulesConfig[m.id].routes.admin : undefined;
            } catch (e) {
                // Ignore
                defaultConfigs.push(m.id);
            }
        });
        if (defaultConfigs.length) {
            pino.warn(`Warning: using default configs for modules: ${[...new Set(defaultConfigs)].join(", ")}`);
        }
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
        fastify.decorate("ZoiaSite", site);
        fastify.decorateRequest("ZoiaSite", site);
        fastify.decorate("zoiaConfig", config);
        fastify.decorateRequest("zoiaConfig", config);
        fastify.decorate("zoiaTemplates", templates);
        fastify.decorateRequest("zoiaTemplates", templates);
        fastify.decorate("zoiaModules", modules);
        fastify.decorateRequest("zoiaModules", modules);
        fastify.decorate("zoiaModulesConfig", modulesConfig);
        fastify.decorateRequest("zoiaModulesConfig", modulesConfig);
        fastify.decorate("ExtendedValidation", extendedValidation);
        fastify.decorateRequest("ExtendedValidation", extendedValidation);
        fastify.decorate("zoiaPackageJson", packageJson);
        fastify.decorateRequest("zoiaPackageJson", packageJson);
        Object.keys(loggerHelpers).map(i => fastify.decorateReply(i, loggerHelpers[i]));
        Object.keys(loggerHelpers).map(i => fastify.decorate(i, loggerHelpers[i]));
        Object.keys(response).map(i => fastify.decorateReply(i, response[i]));
        Object.keys(utils).map(i => fastify.decorateReply(i, utils[i]));
        Object.keys(telegramHelpers).map(i => fastify.decorate(i, telegramHelpers[i]));
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
        // Load modules
        let moduleErrors;
        const modulesLoaded = [];
        // Load all web server modules
        await Promise.all(modules.map(async m => {
            try {
                const moduleWeb = await import(`../../../modules/${m.id}/web/index.js`);
                moduleWeb.default(fastify);
                modulesLoaded.push(m.id);
            } catch (e) {
                moduleErrors = true;
                pino.error(`Cannot load Web part for module: ${m.id}`);
                if (config.stackTrace && e.stack) {
                    pino.info(e.stack);
                }
            }
        }));
        // Load all API modules
        await Promise.all(modules.map(async m => {
            try {
                const moduleAPI = await import(`../../../modules/${m.id}/api/index.js`);
                moduleAPI.default(fastify);
                modulesLoaded.push(m.id);
            } catch (e) {
                moduleErrors = true;
                pino.error(`Cannot load API part for module: ${m.id}`);
                pino.info(e.stack);
            }
        }));
        // Create Telegraf instance if necessary
        if (config.telegram && config.telegram.enabled) {
            const bot = new Telegraf(config.telegram.token);
            fastify.decorate("telegramBot", bot);
            fastify.decorateRequest("telegramBot", bot);
            pino.info(`Launching Telegram bot`);
            // Load all Telegram Modules
            await Promise.all(modules.map(async m => {
                try {
                    const moduleTelegram = await import(`../../../modules/${m.id}/telegram/index.js`);
                    moduleTelegram.default(fastify);
                    modulesLoaded.push(m.id);
                } catch (e) {
                    moduleErrors = true;
                    pino.error(`Cannot load Telegram part for module: ${m.id}`);
                }
            }));
            bot.launch();
        }
        if (!moduleErrors) {
            pino.info(`Modules loaded: ${[...new Set(modulesLoaded)].join(", ")}`);
        }
        // Start server
        await fastify.listen(config.webServer.port, config.webServer.ip);
    } catch (e) {
        pino.error(e);
        process.exit(1);
    }
})();
