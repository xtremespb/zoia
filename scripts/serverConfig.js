/* eslint no-console:0 */
const fs = require('fs-extra');
const path = require('path');
const config = require('../dist/static/etc/config.json');
const secure = require('../dist/etc/secure.json');

const systemdAPI = fs.readFileSync(`${__dirname}/config-source/systemd-api.service`, 'utf8')
    .replace(/{siteid}/igm, config.id)
    .replace(/{user}/igm, secure.user)
    .replace(/{group}/igm, secure.group)
    .replace(/{path}/igm, path.resolve(`${__dirname}/../dist/bin/api.js`).replace(/\\/gm, '/'));
const systemdWeb = fs.readFileSync(`${__dirname}/config-source/systemd-web.service`, 'utf8')
    .replace(/{siteid}/igm, config.id)
    .replace(/{user}/igm, secure.user)
    .replace(/{group}/igm, secure.group)
    .replace(/{path}/igm, path.resolve(`${__dirname}/../dist/bin/web.js`).replace(/\\/gm, '/'));
const rsyslogAPI = fs.readFileSync(`${__dirname}/config-source/rsyslog.conf`, 'utf8')
    .replace(/{siteid}/igm, config.id)
    .replace(/{prefix}/igm, 'api')
    .replace(/{filename}/igm, `${config.id}_api.log`)
    .replace(/{path}/igm, path.resolve(`${__dirname}/../dist/logs`).replace(/\\/gm, '/'));
const rsyslogWeb = fs.readFileSync(`${__dirname}/config-source/rsyslog.conf`, 'utf8')
    .replace(/{siteid}/igm, config.id)
    .replace(/{prefix}/igm, 'web')
    .replace(/{filename}/igm, `${config.id}_web.log`)
    .replace(/{path}/igm, path.resolve(`${__dirname}/../dist/logs`).replace(/\\/gm, '/'));
const nginx = fs.readFileSync(`${__dirname}/config-source/nginx.conf`, 'utf8')
    .replace(/{siteid}/igm, config.id)
    .replace(/{webIP}/igm, secure.webServer.ip)
    .replace(/{webPort}/igm, secure.webServer.port)
    .replace(/{apiIP}/igm, secure.apiServer.ip)
    .replace(/{apiPort}/igm, secure.apiServer.port)
    .replace(/{serverName}/igm, secure.serverName)
    .replace(/{logPath}/igm, path.resolve(`${__dirname}/../dist/logs`).replace(/\\/gm, '/'))
    .replace(/{staticPath}/igm, path.resolve(`${__dirname}/../dist/static`).replace(/\\/gm, '/'))
    .replace(/{staticCustomPath}/igm, path.resolve(`${__dirname}/..`).replace(/\\/gm, '/'));
fs.ensureDirSync(`${__dirname}/../dist/server-configs/systemd`);
fs.ensureDirSync(`${__dirname}/../dist/server-configs/rsyslog.d`);
fs.ensureDirSync(`${__dirname}/../dist/server-configs/nginx`);
console.log(`Writing dist/server-configs/systemd/${config.id}_api.service...`);
fs.writeFileSync(`${__dirname}/../dist/server-configs/systemd/${config.id}_api.service`, systemdAPI);
console.log(`Writing dist/server-configs/systemd/${config.id}_web.service...`);
fs.writeFileSync(`${__dirname}/../dist/server-configs/systemd/${config.id}_web.service`, systemdWeb);
console.log(`Writing dist/server-configs/rsyslog.d/${config.id}_api.conf...`);
fs.writeFileSync(`${__dirname}/../dist/server-configs/rsyslog.d/${config.id}_web.conf`, rsyslogAPI);
console.log(`Writing dist/server-configs/rsyslog.d/${config.id}_web.conf...`);
fs.writeFileSync(`${__dirname}/../dist/server-configs/rsyslog.d/${config.id}_api.conf`, rsyslogWeb);
console.log(`Writing dist/server-configs/nginx/${config.id}.conf...`);
fs.writeFileSync(`${__dirname}/../dist/server-configs/nginx/${config.id}.conf`, nginx);
