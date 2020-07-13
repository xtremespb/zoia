const Module = require('../../core/module.js');
const Router = require('co-router');
const config = require('../../core/config.js');
const fs = require('fs-extra');

module.exports = function(app) {
    const log = app.get('log');

    const restart = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        setTimeout(() => {
            process.exit(0);
        }, 3000);
        return res.send(JSON.stringify({
            status: 1
        }));
    };

    const settingsSave = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const data = req.body.config;
        if (!data || typeof data !== 'object') {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const settingsMerge = Object.assign(config.website, data);
            await fs.writeJson(`${__dirname}/../../etc/website.json`, settingsMerge, { spaces: '\t' });
            config.website = settingsMerge;
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const maintenance = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let enabled = req.body.enabled;
        if (!enabled || typeof enabled !== 'string') {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        enabled = enabled === 'true' ? true : false;
        try {
            config.website.maintenance = enabled;
            await fs.writeJson(`${__dirname}/../../etc/website.json`, config.website, { spaces: '\t' });
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    let router = Router();
    router.get('/restart', restart);
    router.post('/settings/save', settingsSave);
    router.post('/settings/maintenance', maintenance);
    return {
        routes: router
    };
};