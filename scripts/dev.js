/*
    This script is used as a HTTP server for development purposes.
    It servers two upstreams (API, Web), static directories and admin.html file for React.
    Please note: a server like NGINX is recommended for production.
*/
const Fastify = require("fastify");
const fastifyProxy = require("fastify-http-proxy");
const fastifyStatic = require("fastify-static");
const path = require("path");
const fs = require("fs-extra");
const pino = require("pino");
// Load Pino logger
const log = pino({
    level: "info"
});
// Load configuration file for ports
const config = require(path.resolve(`${__dirname}/../etc/zoia.json`));
// Init Fastify
const fastify = Fastify();
// Register proxy route for Web Server
fastify.register(fastifyProxy, {
    upstream: `http://${config.webServer.ip}:${config.webServer.port}`,
    prefix: "/"
});
// Register static routes for every directory in build/public
fs.readdirSync(path.resolve(__dirname, "../build/public")).filter(f => fs.lstatSync(path.resolve(__dirname, `../build/public/${f}`)).isDirectory()).map(dir => fastify.register(fastifyStatic, {
    root: path.resolve(__dirname, `../build/public/${dir}`),
    prefix: `/${dir}`,
    decorateReply: false
}));
// Listen on port 8080
fastify.listen(config.devServer.port, config.devServer.ip);
log.info(`HTTP Server is listening on http://${config.devServer.ip}:${config.devServer.port}`);
