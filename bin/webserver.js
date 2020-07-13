#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');

try {
    fs.accessSync(path.join(__dirname, '..', 'etc', 'config.json'), fs.constants.F_OK);
    fs.accessSync(path.join(__dirname, '..', 'etc', 'website.json'), fs.constants.F_OK);
} catch (e) {
    console.log('Error: no configuration files found in ./etc folder.');
    console.log('Please run "npm run zoia_config" before starting the Zoia Webserver.');
    process.exit();
}

const config = require(path.join(__dirname, '..', 'core', 'config.js'));
if (config.credentials && config.credentials.set && process.getuid && process.setuid) {
    process.setgid(config.credentials.group);
    process.setuid(config.credentials.user);
}
const app = require(path.join(__dirname, '..', 'core', 'app'));
const log = app.get('log');
const http = require('http');
const server = http.createServer(app);

const onListening = () => {
    let bind = typeof server.address() === 'string' ? 'pipe ' + server.address() : 'port ' + server.address().port;
    log.info('Listening on ' + bind);
};

const onError = (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    let bind = typeof config.port === 'string' ? 'Pipe ' + config.port : 'Port ' + config.port;
    switch (error.code) {
        case 'EACCES':
            log.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            log.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
};

app.on('zoiaStarted', () => {
    server.listen(config.port, config.ip);
    server.on('listening', onListening);
    server.on('error', onError);
});