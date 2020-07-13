const path = require('path');
const Module = require('../../core/module.js');
const Router = require('co-router');
const config = require('../../core/config.js');
const rp = require('request-promise');
const fs = require('fs-extra');
const md5File = require('md5-file/promise');
const targz = require('tar');

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);

    const check = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const response = await rp('https://xtremespb.github.io/zoia/version.json');
            const data = JSON.parse(response);
            let update;
            const versionLocal = parseInt(config.version.replace(/\./g, ''), 10);
            const versionRemote = parseInt(data.code.replace(/\./g, ''), 10);
            if (versionRemote > versionLocal) {
                update = {
                    version: data.code,
                    changelog: data.changelog
                };
            }
            res.send(JSON.stringify({
                status: 1,
                update: update
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const download = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        let data;
        try {
            const response = await rp('https://xtremespb.github.io/zoia/version.json');
            data = JSON.parse(response);
            const buf = await rp({
                method: 'GET',
                url: data.url,
                encoding: null
            });
            await fs.writeFile(path.join(__dirname, '..', '..', 'temp', data.checksum + '.tar.gz'), buf);
            const md5 = await md5File(path.join(__dirname, '..', '..', 'temp', data.checksum + '.tar.gz'));
            if (md5 !== data.checksum) {
                return res.send(JSON.stringify({
                    status: 0,
                    error: i18n.get().__(locale, 'checksum failed')
                }));
            }
            res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            try {
                if (data) {
                    await fs.access(path.join(__dirname, '..', '..', 'temp', data.checksum + '.tar.gz'), fs.constants.F_OK);
                    await fs.remove(path.join(__dirname, '..', '..', 'temp', data.checksum + '.tar.gz'));
                }
            } catch (ex) {
                // Ignore
            }
            return res.send(JSON.stringify({
                status: 0,
                error: i18n.get().__(locale, 'could not download update file')
            }));
        }
    };

    const extract = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        let data;
        try {
            const response = await rp('https://xtremespb.github.io/zoia/version.json');
            data = JSON.parse(response);
            await targz.x({
                file: path.join(__dirname, '..', '..', 'temp', data.checksum + '.tar.gz'),
                C: path.join(__dirname, '..', '..')
            });
            await fs.access(path.join(__dirname, '..', '..', 'temp', data.checksum + '.tar.gz'), fs.constants.F_OK);
            await fs.remove(path.join(__dirname, '..', '..', 'temp', data.checksum + '.tar.gz'));
            res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            try {
                if (data) {
                    await fs.access(path.join(__dirname, '..', '..', 'temp', data.checksum + '.tar.gz'), fs.constants.F_OK);
                    await fs.remove(path.join(__dirname, '..', '..', 'temp', data.checksum + '.tar.gz'));
                }
            } catch (ex) {
                // Ignore
            }
            return res.send(JSON.stringify({
                status: 0,
                error: i18n.get().__(locale, 'could not extract update file')
            }));
        }
    };

    const restart = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        res.send(JSON.stringify({
            status: 1
        }));
        process.exit(0);
    };

    let router = Router();
    router.get('/check', check);
    router.get('/download', download);
    router.get('/extract', extract);
    router.get('/restart', restart);

    return {
        routes: router
    };
};