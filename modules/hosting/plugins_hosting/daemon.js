/* eslint no-unused-vars: 0 */

const rp = require('request-promise');
const path = require('path');

let configModule;
try {
    configModule = require(path.join(__dirname, '..', 'config', 'daemon.json'));
} catch (e) {
    configModule = require(path.join(__dirname, '..', 'config', 'daemon.dist.json'));
}

const process = async(id, host, locale, cmd) => {
    try {
        const url = configModule.url[host] + '?key=' + configModule.key + '&id=' + id + '&command=' + cmd;
        const response = await rp(url, { json: true, rejectUnauthorized: false });
        if (response && response.status === 1) {
            return true;
        }
        return response;
    } catch (e) {
        return false;
    }
};

module.exports = class HostingPlugin {
    constructor(app) {}
    async getControlPanelURL(host) {
        return '';
    }
    async check(id, host, locale) {
        return false;
    }
    async create(id, host, preset, password, locale) {
        return false;
    }
    async start(id, host, locale) {
        return await process(id, host, locale, 'start');
    }
    async stop(id, host, locale) {
        return await process(id, host, locale, 'stop');
    }
};