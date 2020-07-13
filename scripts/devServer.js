/*
    This script is used as a HTTP server for development purposes.
    It servers two upstreams (API, Web), static directories and admin.html file for React.
    Please note: a server like NGINX is recommended for production.
*/
const Fastify = require('fastify');
const fastifyProxy = require('fastify-http-proxy');
const fastifyStatic = require('fastify-static');
const path = require('path');
const fs = require('fs-extra');
const pino = require('pino');
// Load Pino logger
const log = pino({
    level: 'info'
});
// Load configuration file for ports
const configSecure = require(path.resolve(`${__dirname}/../dist/etc/secure.json`));
// Load HTML file to serve as /admin route
// const adminHTML = fs.readFileSync(path.resolve(__dirname, '../dist/static/_admin/admin.html'), 'utf8');
// Init Fastify
const fastify = Fastify();
// Register proxy route for Web Server
fastify.register(fastifyProxy, {
    upstream: `http://${configSecure.apiServer.ip}:${configSecure.apiServer.port}`,
    prefix: '/api'
});
// Register proxy route for API Server
fastify.register(fastifyProxy, {
    upstream: `http://${configSecure.webServer.ip}:${configSecure.webServer.port}`,
    prefix: '/'
});
// Register static routes for every directory in dist/static
fs.readdirSync(path.resolve(__dirname, '../dist/static')).filter(f => fs.lstatSync(path.resolve(__dirname, `../dist/static/${f}`)).isDirectory()).map(dir => fastify.register(fastifyStatic, {
    root: path.resolve(__dirname, `../dist/static/${dir}`),
    prefix: `/${dir}`,
    decorateReply: false
}));
// Register custom static directory
fastify.register(fastifyStatic, {
    root: path.resolve(__dirname, `../static`),
    prefix: `/static`,
    decorateReply: false
});
// Serve /admin route with pre-loaded admin.html file
fastify.get('/admin*', (req, rep) => rep.code(200).type('text/html').send(fs.readFileSync(path.resolve(__dirname, '../dist/static/_admin/admin.html'), 'utf8')));
// Listen on port 80
fastify.listen(configSecure.httpDevServer.port, configSecure.httpDevServer.ip);
log.info(`HTTP Server is listening on http://${configSecure.httpDevServer.ip}:${configSecure.httpDevServer.port}`);
