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
import {
    Telegraf
} from "telegraf";
import Redis from "ioredis";
import Fastify from "fastify";
import {
    MongoClient
} from "mongodb";
import crypto from "crypto";
import template from "lodash/template";
import logger from "../../lib/logger";
import acl from "../../lib/acl";
import LoggerHelpers from "../../lib/loggerHelpers";
import telegramHelpers from "../../lib/telegramHelpers";
import site from "../../lib/site";
import internalServerErrorHandler from "./internalServerErrorHandler";
import notFoundErrorHandler from "./notFoundErrorHandler";
import maintenanceHandler from "./maintenanceHandler";
import globalPrehandler from "./globalPrehandler";
import Response from "../../lib/response";
import utils from "../../lib/utils";
import extendedValidation from "../../lib/extendedValidation";
import zoiaMultipart from "../../lib/zoiaMultipart";
import fastifyRateLimit from "../../lib/rateLimit";
import SocketIO from "../../lib/socketIO";
import Env from "../../lib/env";

(async () => {
    let buildJson;
    let config;
    let templates;
    let pino;
    let modules;
    let modulesMeta;
    let admin;
    let packageJson;
    let env;
    let mailTemplatesHTML = {};
    let mailTemplatesText = {};
    const mailTemplateComponentsHTML = {};
    const mailTemplateComponentsText = {};
    const modulesConfig = {};
    try {
        buildJson = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/build.json`));
        config = {
            ...fs.readJSONSync(path.resolve(`${__dirname}/../../etc/system.json`)),
            ...fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`))
        };
        env = new Env(config);
        config = env.process();
        config.secretInt = parseInt(crypto.createHash("md5").update(config.secret).digest("hex"), 16);
        config.modules = Array.from(new Set(["core", "users", "acl", ...config.modules]));
        pino = Pino({
            level: config.logLevel
        });
        pino.info(`Starting ZOIA (${config.id}) ${buildJson.version} / ${buildJson.mode} (built at: ${buildJson.date})`);
        packageJson = fs.readJSONSync(path.resolve(`${__dirname}/../../package.json`));
        templates = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/templates.json`)).filter(t => config.templates.indexOf(t) > -1);
        modules = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/modules.json`));
        modulesMeta = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/meta.json`));
        Object.keys(modulesMeta).map(m => {
            if (config.modules.indexOf(m) > -1) {
                config.modules = [...config.modules, ...modulesMeta[m]];
            }
        });
        admin = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/admin.json`));
        pino.info(`Compiled module(s): ${modules.map(m => m.id).join(", ")}`);
        const defaultConfigs = [];
        pino.info(`Compiled template(s): ${templates.join(", ")}`);
        try {
            const mailTemplateFileHTML = fs.readFileSync(path.resolve(`${__dirname}/../../build/mail/templates/${config.email.template}.html`), "utf8");
            mailTemplatesHTML = template(mailTemplateFileHTML);
            const mailTemplateFileText = fs.readFileSync(path.resolve(`${__dirname}/../../build/mail/templates/${config.email.template}.txt`), "utf8");
            mailTemplatesText = template(mailTemplateFileText);
        } catch {
            // Ignore
        }
        const availableMailComponents = fs.readdirSync(path.resolve(`${__dirname}/../../build/mail/components/${config.email.template}`));
        availableMailComponents.map(c => {
            const mailTemplateComponentFileHTML = fs.readFileSync(path.resolve(`${__dirname}/../../build/mail/components/${config.email.template}/${c}/index.html`), "utf8");
            mailTemplateComponentsHTML[c] = template(mailTemplateComponentFileHTML);
            const mailTemplateComponentFileText = fs.readFileSync(path.resolve(`${__dirname}/../../build/mail/components/${config.email.template}/${c}/index.txt`), "utf8");
            mailTemplateComponentsText[c] = template(mailTemplateComponentFileText);
        });
        modules.map(m => {
            const moduleDir = m.parentModule ? `${m.parentModule}/${m.id}` : m.id;
            try {
                modulesConfig[m.id] = require(`../../../modules/${moduleDir}/config.dist.json`);
            } catch (e) {
                pino.error(`Fatal: unable to load default config for module: "${m.id}"`);
                process.exit(1);
            }
            try {
                modulesConfig[m.id] = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/modules/${m.id}.json`));
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
        const mongoClient = new MongoClient(config.mongo.url, config.mongo.options || {
            useUnifiedTopology: true,
            connectTimeoutMS: 5000,
            keepAlive: true,
            useNewUrlParser: true
        });
        mongoClient.on("serverDescriptionChanged", e => {
            if (e && e.newDescription && e.newDescription.error) {
                pino.error("Fatal: connection to MongoDB is broken");
                process.exit(1);
            }
        });
        await mongoClient.connect();
        // Regitser MongoDB for Fastify
        fastify.register(fastifyMongo, {
            client: mongoClient,
            database: config.mongo.dbName
        }).register(async (ff, opts, next) => {
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
            // fastify.decorateRequest("redis", redis);
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
        fastify.decorate("zoiaTemplates", templates);
        const modulesFiltered = modules.filter(m => config.modules.indexOf(m.id) > -1);
        fastify.decorate("zoiaModules", modulesFiltered);
        const adminFiltered = admin.filter(m => config.modules.indexOf(m.id) > -1);
        fastify.decorate("zoiaAdmin", adminFiltered);
        fastify.decorate("zoiaModulesConfig", modulesConfig);
        fastify.decorate("ExtendedValidation", extendedValidation);
        fastify.decorateRequest("ExtendedValidation", extendedValidation);
        fastify.decorate("zoiaPackageJson", packageJson);
        fastify.decorateRequest("zoiaPackageJson", packageJson);
        fastify.decorate("zoiaBuildJson", buildJson);
        fastify.decorate("mailTemplatesHTML", mailTemplatesHTML);
        fastify.decorate("mailTemplatesText", mailTemplatesText);
        fastify.decorate("mailTemplateComponentsHTML", mailTemplateComponentsHTML);
        fastify.decorate("mailTemplateComponentsText", mailTemplateComponentsText);
        fastify.decorateReply("LoggerHelpers", LoggerHelpers);
        fastify.decorate("LoggerHelpers", LoggerHelpers);
        fastify.decorate("Response", Response);
        fastify.decorateReply("Response", Response);
        fastify.decorate("Acl", acl);
        fastify.decorateReply("Acl", acl);
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
                const moduleDir = m.parentModule ? `${m.parentModule}/${m.id}` : m.id;
                const moduleWeb = await import(`../../../modules/${moduleDir}/web/index.js`);
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
                const moduleDir = m.parentModule ? `${m.parentModule}/${m.id}` : m.id;
                const moduleAPI = await import(`../../../modules/${moduleDir}/api/index.js`);
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
            pino.info(`Launching Telegram bot`);
            // Load all Telegram Modules
            await Promise.all(modules.map(async m => {
                try {
                    const moduleDir = m.parentModule ? `${m.parentModule}/${m.id}` : m.id;
                    const moduleTelegram = await import(`../../../modules/${moduleDir}/telegram/index.js`);
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
                const moduleDir = m.parentModule ? `${m.parentModule}/${m.id}` : m.id;
                const moduleSocket = await import(`../../../modules/${moduleDir}/socket.io/index.js`);
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
        // Add global prehandler
        fastify.addHook("preHandler", async (req, rep) => {
            await globalPrehandler(req, rep, fastify);
        });
        // Set handler for error 404
        // fastify.setNotFoundHandler(async (req, rep) => notFoundErrorHandler(req, rep, fastify));
        fastify.setNotFoundHandler(async (req, rep) => {
            const data = await notFoundErrorHandler(req, rep, fastify);
            rep.send(data);
        });
        // Set handler for error 500
        fastify.setErrorHandler(async (err, req, rep) => {
            await internalServerErrorHandler(err, req, rep, fastify);
        });
        // Add an maintenance handler
        fastify.addHook("preHandler", async (req, rep) => {
            await maintenanceHandler(req, rep, fastify);
        });
        // Start Web Server
        await fastify.listen(config.webServer.port, config.webServer.ip);
    } catch (e) {
        pino.error(`Fatal: ${e}`);
        process.exit(1);
    }
})();
