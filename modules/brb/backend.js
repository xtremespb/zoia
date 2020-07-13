const moduleId = 'brb';
const path = require('path');
const config = require('../../core/config.js');
const moduleURL = config.core.prefix.admin + '/brb';
const Module = require('../../core/module.js');
const Router = require('co-router');

let configModule;
try {
    configModule = require('./config/brb.json');
} catch (e) {
    configModule = require('./config/brb.dist.json');
}

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const panel = new(require('../../core/panel.js'))(app);
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const db = app.get('db');

    const list = async(req, res, next) => {
        try {
            const uprefix = i18n.getLanguageURLPrefix(req);
            if (!Module.isAuthorizedAdmin(req)) {
                Module.logout(req);
                return res.redirect(303, (config.core.prefix.auth ? uprefix + config.core.prefix.auth : uprefix + '/auth') + '?redirect=' + uprefix + moduleURL + '&rnd=' + Math.random().toString().replace('.', ''));
            }
            let groups = [];
            try {
                const groupsData = await db.collection('groups').find().toArray();
                for (let i in groupsData) {
                    groups.push(groupsData[i].groupname);
                }
            } catch (e) {
                // Ignore
            }
            const locale = req.session.currentLocale;
            let html = await render.file('brb.html', {
                i18n: i18n.get(),
                config: config,
                locale: locale,
                groups: JSON.stringify(groups),
                uprefix: uprefix,
                rxp: config.core && config.core.regexp && config.core.regexp.username ? JSON.stringify(config.core.regexp) : '{"username":"^[A-Za-z0-9_\\\\-]+$"}',
                corePrefix: JSON.stringify(config.core.prefix),
                lang: JSON.stringify(i18n.get().locales[locale])
            });
            res.send(await panel.html(req, moduleId, i18n.get().__(locale, 'title'), html, config.production ? ['/brb/static/css/brb.min.css'] : ['/brb/static/css/brb.css'],
                config.production ? ['/brb/static/js/brb.min.js'] : ['/zoia/core/js/jquery.zoiaFormBuilder.js', '/zoia/core/js/jquery.zoiaTable.js', '/brb/static/js/brb.js']));
        } catch (e) {
            next(new Error(e.message));
        }
    };

    app.use('/brb/static', app.get('express').static(`${__dirname}/static`));

    let router = Router();
    router.get('/', list);
    return {
        routes: router,
        info: {
            id: moduleId,
            url: moduleURL,
            title: Module.getTitles(i18n),
            icon: 'credit-card'
        }
    };
};