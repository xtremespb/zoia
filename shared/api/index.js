import path from "path";
import fs from "fs-extra";
import fastifyMongo from "fastify-mongodb";
import fastifyURLData from "fastify-url-data";
import fastifyCORS from "fastify-cors";
import fastifyJWT from "fastify-jwt";
import fastifyFormbody from "fastify-formbody";
import fastifyMultipart from "fastify-multipart";
import nodemailer from "nodemailer";
import {
    MongoClient
} from "mongodb";
import Pino from "pino";
import Fastify from "fastify";

import logger from "../lib/logger";

(async () => {
    let config;
    let pino;
    try {
        config = await fs.readJSON(path.resolve(`${__dirname}/../../etc/zoia.json`));
        pino = Pino({
            level: config.logLevel
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
            trustProxy: config.trustProxy
        });
        // Create Nodemailer instance
        const mailer = nodemailer.createTransport(config.mailer);
        // Decorate Fastify with configuration and helpers
        fastify.decorate("zoiaConfig", config);
        fastify.decorateRequest("zoiaConfig", config);
        fastify.decorate("zoiaMailer", mailer);
        fastify.decorateRequest("zoiaMailer", mailer);
        // Create MongoDB client and connect
        const mongoClient = new MongoClient(config.mongo.url, {
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
            database: config.mongo.dbName
        }).register((ff, opts, next) => {
            ff.mongo.client.db(config.mongo.dbName).on("close", () => {
                pino.error("Connection to MongoDB is broken");
                process.exit(1);
            });
            next();
        });
        // Register CORS
        fastify.register(fastifyCORS, {
            origin: config.originCORS
        });
        // Register JWT
        fastify.register(fastifyJWT, {
            secret: config.secret
        });
        // Listen on specified IP and port
        await fastify.listen(config.apiServer.port, config.apiServer.ip);
    } catch (e) {
        pino.error(e);
        process.exit(1);
    }
})();
