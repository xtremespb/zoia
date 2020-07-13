const path = require('path');
const ObjectID = require('mongodb').ObjectID;
const config = require('./config.js');

module.exports = function(app) {
    const db = app.get('db');
    const log = app.get('log');
    const render = new(require(path.join(__dirname, 'render.js')))(path.join(__dirname, 'views'));
    const i18n = new(require(path.join(__dirname, 'i18n.js')))(path.join(__dirname, 'lang'), app);
    return {
        setLocale: async(req, res, next) => {
            if (req.session) {
                req.session.currentLocale = i18n.detectLanguage(req);
            }
            next();
        },
        logRequest: async(req, res, next) => {
            log.info(req.ip + ' ' + req.method + ' ' + req.url);
            next();
        },
        auth: async(req, res, next) => {
            try {
                if (db && req.session && req.session.auth && req.session.auth._id) {
                    let user = await db.collection('users').findOne({ _id: new ObjectID(req.session.auth._id) });
                    if (!user || user.status === '0') {
                        req.session.auth = undefined;
                    } else {
                        req.session.auth = user;
                    }
                }
            } catch (e) {
                log.error(e.message);
            }
            next();
        },
        maintenance: async(req, res, next) => {
            let locale = config.i18n.locales[0];
            if (req.session && req.session.currentLocale) {
                locale = req.session.currentLocale;
            }
            if (config.website.maintenance && !req.url.match(/^\/(admin|api)/) && !req.url.match(/\/(static)\//) && !req.url.match(/\/(auth)/)) {
                const html = await render.file('maintenance.html', {
                    locale: locale,
                    i18n: i18n.get(),
                    config: config
                });
                return res.send(html);
            }
            next();
        }
    };
};