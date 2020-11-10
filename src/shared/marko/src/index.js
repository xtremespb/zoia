import path from "path";
import fs from "fs-extra";
import fastifyMongo from "fastify-mongodb";
import fastifyURLData from "fastify-url-data";
import fastifyCORS from "fastify-cors";
import fastifyJWT from "fastify-jwt";
import fastifyFormbody from "fastify-formbody";
import fastifyCookie from "fastify-cookie";
import fastifyStatic from "fastify-static";
import Pino from "pino";
import Telegraf from "telegraf";
import Redis from "ioredis";
import Fastify from "fastify";
import {
    MongoClient
} from "mongodb";
import crypto from "crypto";
import template from "lodash/template";
import logger from "../../lib/logger";
import LoggerHelpers from "../../lib/loggerHelpers";
import telegramHelpers from "../../lib/telegramHelpers";
import site from "../../lib/site";
import internalServerErrorHandler from "./internalServerErrorHandler";
import notFoundErrorHandler from "./notFoundErrorHandler";
import Response from "../../lib/response";
import utils from "../../lib/utils";
import extendedValidation from "../../lib/extendedValidation";
import zoiaMultipart from "../../lib/zoiaMultipart";
import fastifyRateLimit from "../../lib/rateLimit";
import SocketIO from "../../lib/socketIO";

(async () => {
    let buildJson;
    let config;
    let templates;
    let pino;
    let modules;
    let packageJson;
    const mailTemplatesHTML = {};
    const mailTemplatesText = {};
    const mailTemplateComponentsHTML = {};
    const mailTemplateComponentsText = {};
    const modulesConfig = {};
    try {
        buildJson = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/build.json`));
        config = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`));
        config.secretInt = parseInt(crypto.createHash("md5").update(config.secret).digest("hex"), 16);
        pino = Pino({
            level: config.logLevel
        });
        pino.info(`Starting ZOIA ${buildJson.version} / ${buildJson.mode} (built at: ${buildJson.date})`);
        packageJson = fs.readJSONSync(path.resolve(`${__dirname}/../../package.json`));
        templates = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/templates.json`)).filter(t => config.templates.indexOf(t) > -1);
        modules = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/modules.json`));
        pino.info(`Available module(s): ${modules.map(m => m.id).join(", ")}`);
        const defaultConfigs = [];
        pino.info(`Available template(s): ${templates.join(", ")}`);
        await Promise.allSettled(Object.keys(config.languages).map(async language => {
            try {
                const mailTemplateFileHTML = fs.readFileSync(path.resolve(`${__dirname}/../../build/mail/templates/${language}_${config.email.template}.html`), "utf8");
                mailTemplatesHTML[language] = template(mailTemplateFileHTML);
                const mailTemplateFileText = fs.readFileSync(path.resolve(`${__dirname}/../../build/mail/templates/${language}_${config.email.template}.txt`), "utf8");
                mailTemplatesText[language] = template(mailTemplateFileText);
            } catch {
                // Ignore
            }
        }));
        const availableMailComponents = fs.readdirSync(path.resolve(`${__dirname}/../../build/mail/components/${config.email.template}`));
        availableMailComponents.map(c => {
            const mailTemplateComponentFileHTML = fs.readFileSync(path.resolve(`${__dirname}/../../build/mail/components/${config.email.template}/${c}/index.html`), "utf8");
            mailTemplateComponentsHTML[c] = template(mailTemplateComponentFileHTML);
            const mailTemplateComponentFileText = fs.readFileSync(path.resolve(`${__dirname}/../../build/mail/components/${config.email.template}/${c}/index.txt`), "utf8");
            mailTemplateComponentsText[c] = template(mailTemplateComponentFileText);
        });
        modules.map(m => {
            try {
                modulesConfig[m.id] = require(`../../../modules/${m.id}/config.dist.json`);
            } catch (e) {
                pino.error(`Fatal: unable to load default config for module: "${m.id}"`);
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
            pino.warn(`Warning: using default config(s) for: ${[...new Set(defaultConfigs)].join(", ")}`);
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Fatal: ${e}`);
        process.exit(1);
    }
    try {
        // Create Fastify instance
        const fastify = Fastify({
            logger,
            trustProxy: config.trustProxy,
            ignoreTrailingSlash: true
        });
        // Serve static routes
        if (config.serveStatic) {
            const staticFolders = ["zoia"];
            fastify.register(fastifyStatic, {
                root: path.resolve(__dirname, `../public/zoia`),
                prefix: `/zoia`
            });
            fs.readdirSync(path.resolve(__dirname, "../public")).filter(f => f !== "zoia" && fs.lstatSync(path.resolve(__dirname, `../public/${f}`)).isDirectory()).map(dir => {
                fastify.register(fastifyStatic, {
                    root: path.resolve(__dirname, `../public/${dir}`),
                    prefix: `/${dir}`,
                    decorateReply: false
                });
                staticFolders.push(dir);
            });
            pino.info(`Serving static folder(s): ${staticFolders.join(", ")}`);
        }
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
                pino.error("Fatal: connection to MongoDB is broken");
                process.exit(1);
            });
            pino.info(`Connected to Mongo Server: (${config.mongo.url}/${config.mongo.dbName})`);
            next();
        });
        // Redis
        if (config.redis && config.redis.enabled) {
            const redis = new Redis(config.redis);
            redis.on("error", e => {
                pino.error(`Fatal: Redis is failed (${e})`);
                process.exit(1);
            });
            fastify.decorate("redis", redis);
            fastify.decorateRequest("redis", redis);
            pino.info(`Connected to Redis Server (${config.redis.host}:${config.redis.port})`);
        }
        // Rate Limiting
        if (config.rateLimit && config.rateLimit.enabled) {
            fastify.register(fastifyRateLimit, config.rateLimit);
        }
        // Decorate Fastify with configuration and helpers
        fastify.decorate("ZoiaSite", site);
        fastify.decorateRequest("ZoiaSite", site);
        fastify.decorate("zoiaConfig", config);
        fastify.decorateRequest("zoiaConfig", config);
        fastify.decorate("zoiaTemplates", templates);
        fastify.decorateRequest("zoiaTemplates", templates);
        fastify.decorate("zoiaModules", modules.filter(m => config.modules.indexOf(m.id) > -1));
        fastify.decorateRequest("zoiaModules", modules);
        fastify.decorate("zoiaModulesConfig", modulesConfig);
        fastify.decorateRequest("zoiaModulesConfig", modulesConfig);
        fastify.decorate("ExtendedValidation", extendedValidation);
        fastify.decorateRequest("ExtendedValidation", extendedValidation);
        fastify.decorate("zoiaPackageJson", packageJson);
        fastify.decorateRequest("zoiaPackageJson", packageJson);
        fastify.decorate("zoiaBuildJson", buildJson);
        fastify.decorateRequest("zoiaBuildJson", buildJson);
        fastify.decorate("mailTemplatesHTML", mailTemplatesHTML);
        fastify.decorateRequest("mailTemplatesHTML", mailTemplatesHTML);
        fastify.decorate("mailTemplatesText", mailTemplatesText);
        fastify.decorateRequest("mailTemplatesText", mailTemplatesText);
        fastify.decorate("mailTemplateComponentsHTML", mailTemplateComponentsHTML);
        fastify.decorateRequest("mailTemplateComponentsHTML", mailTemplateComponentsHTML);
        fastify.decorate("mailTemplateComponentsText", mailTemplateComponentsText);
        fastify.decorateRequest("mailTemplateComponentsText", mailTemplateComponentsText);
        fastify.decorateReply("LoggerHelpers", LoggerHelpers);
        fastify.decorate("LoggerHelpers", LoggerHelpers);
        fastify.decorate("Response", Response);
        fastify.decorateReply("Response", Response);
        Object.keys(utils).map(i => fastify.decorateReply(i, utils[i]));
        Object.keys(telegramHelpers).map(i => fastify.decorate(i, telegramHelpers[i]));
        // Socket.IO
        const socketIO = new SocketIO(fastify);
        socketIO.setEvents();
        // Register FormBody and Multipart
        fastify.register(fastifyFormbody);
        fastify.register(zoiaMultipart);
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
        // Load modules
        let moduleErrors;
        const modulesLoaded = [];
        // Load all web server modules
        await Promise.all(modules.map(async m => {
            try {
                const moduleWeb = await import(`../../../modules/${m.id}/web/index.js`);
                if (config.modules.indexOf(m.id) === -1) {
                    return;
                }
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
                if (config.modules.indexOf(m.id) === -1) {
                    return;
                }
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
                    if (config.modules.indexOf(m.id) === -1) {
                        return;
                    }
                    moduleTelegram.default(fastify);
                    modulesLoaded.push(m.id);
                } catch (e) {
                    moduleErrors = true;
                    pino.error(`Cannot load Telegram part for module: ${m.id}`);
                }
            }));
            bot.launch();
        }
        // Load all Socket.io modules
        const socketIoModules = [];
        await Promise.all(modules.map(async m => {
            try {
                const moduleSocket = await import(`../../../modules/${m.id}/socket.io/index.js`);
                if (config.modules.indexOf(m.id) === -1) {
                    return;
                }
                socketIoModules.push(moduleSocket.default);
            } catch (e) {
                // Ignore
            }
        }));
        fastify.decorate("socketIoModules", socketIoModules);
        if (!moduleErrors) {
            pino.info(`Module(s) loaded: ${[...new Set(modulesLoaded)].join(", ")}`);
        }
        // Set handler for error 404
        fastify.setNotFoundHandler((req, rep) => notFoundErrorHandler(req, rep, fastify));
        // Set handler for error 500
        fastify.setErrorHandler((err, req, rep) => internalServerErrorHandler(err, req, rep, fastify));
        // Start Web Server
        await fastify.listen(config.webServer.port, config.webServer.ip);
    } catch (e) {
        pino.error(`Fatal: ${e}`);
        process.exit(1);
    }
})();
