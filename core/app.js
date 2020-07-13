'use strict';

const path = require('path');
const fileUpload = require('express-fileupload');
const express = require('express');
const app = express().set('express', express);
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const winston = require('winston');

((async function init() {    
    try {
        const config = require(path.join(__dirname, 'config.js'));
        if (!config.log) {
            config.log = {};
        }
        const log = winston.createLogger({
            level: config.log.logLevel,
            format: winston.format.printf(info => {
                return new Date().toISOString() + ` [${info.level}] ${info.message}`;
            }),
            transports: [
                new winston.transports.File({
                    dirname: config.log.dirname || path.join(__dirname, '..', 'logs'),
                    filename: config.log.filename || 'main.log',
                    maxsize: config.log.maxsize || 1048576,
                    maxFiles: config.log.maxFiles || 10,
                    tailable: config.log.tailable || true,
                    timestamp: config.log.timestamp || false,
                    showLevel: config.log.showLevel || false,
                    meta: config.log.meta || false,
                    json: config.log.json || false
                })
            ]
        });
        if (!config.production) {
            log.add(new winston.transports.Console({ colorize: true }));
        }
        app.set('log', log);
        log.info('Starting Zoia version ' + config.version);
        app.set('trust proxy', config.trustProxy);
        app.disable('x-powered-by');
        // Init database
        const db = new(require(path.join(__dirname, 'database.js')))(app, config.mongo, config.session);
        await db.connect();
        app.set('db', db.get());
        app.set('bruteforceStore', db.bruteforceStore);
        // Init parsers and other stuff
        app.use(bodyParser.json(), bodyParser.urlencoded({ extended: true, limit: config.maxUploadSizeMB + 'mb' }), cookieParser(), fileUpload(), express.static(path.join(__dirname, '..', 'static')));
        // Load preroutes
        const preroutes = new(require(path.join(__dirname, 'preroutes.js')))(app);
        for (let key of Object.keys(preroutes)) {
            app.use(preroutes[key]);
        }
        // Load modules
        const modules = fs.readdirSync(path.join(__dirname, '..', 'modules'));
        app.set('modules', modules);
        let templateFilters = {};
        let backendModules = [];
        log.info('Loading ' + modules.length + ' module(s)...');
        for (let m in modules) {
            const moduleLoaded = require(path.join(__dirname, '..', 'modules', modules[m], 'module'))(app);
            if (moduleLoaded) {
                if (moduleLoaded.frontend) {
                    if (moduleLoaded.frontend.routes) {
                        app.use(moduleLoaded.frontend.prefix, moduleLoaded.frontend.routes);
                        if (config.i18n.detect.url) {
                            for (let i in config.i18n.locales) {
                                app.use('/' + config.i18n.locales[i] + moduleLoaded.frontend.prefix, moduleLoaded.frontend.routes);
                            }
                        }
                    }
                    if (moduleLoaded.frontend.filters) {
                        for (let f in moduleLoaded.frontend.filters) {
                            templateFilters[f] = moduleLoaded.frontend.filters[f];
                        }
                    }
                }
                if (moduleLoaded.backend && moduleLoaded.backend.routes) {
                    if (moduleLoaded.backend.info) {
                        backendModules.push(moduleLoaded.backend.info);
                    }
                    app.use(config.core.prefix.admin + moduleLoaded.backend.prefix, moduleLoaded.backend.routes);
                    if (config.i18n.detect.url) {
                        for (let i in config.i18n.locales) {
                            app.use('/' + config.i18n.locales[i] + config.core.prefix.admin +  moduleLoaded.backend.prefix, moduleLoaded.backend.routes);
                        }
                    }
                }
                if (moduleLoaded.api && moduleLoaded.api.routes) {
                    app.use('/api' + moduleLoaded.api.prefix, moduleLoaded.api.routes);
                }
            }
        }
        app.set('backendModules', backendModules);
        app.set('templateFilters', templateFilters);
        const errors = new(require(path.join(__dirname, 'errors.js')))(app);
        app.use(errors.notFound, errors.errorHandler);
        app.emit('zoiaStarted');
        log.info('Starting...');
    } catch (e) {
        // That's error
        console.log(e);
        process.exit(1);
    }
})());

module.exports = app;