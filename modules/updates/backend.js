const moduleId = 'updates';
const path = require('path');
const config = require('../../core/config.js');
const moduleURL = config.core.prefix.admin + '/updates';
const Module = require('../../core/module.js');
const Router = require('co-router');

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const panel = new(require('../../core/panel.js'))(app);
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const updates = async(req, res, next) => {
        try {
            const uprefix = i18n.getLanguageURLPrefix(req);
            if (!Module.isAuthorizedAdmin(req)) {
                Module.logout(req);
                return res.redirect(303, (config.core.prefix.auth ? uprefix + config.core.prefix.auth : uprefix + '/auth') + '?redirect=' + uprefix + moduleURL + '&rnd=' + Math.random().toString().replace('.', ''));
            }
            const locale = req.session.currentLocale;
            let html = await render.file('updates.html', {
                i18n: i18n.get(),
                config: config,
                dirname: `${__dirname}/../..`,
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                corePrefix: JSON.stringify(config.core.prefix),
                uprefix: uprefix
            });
            res.send(await panel.html(req, moduleId, i18n.get().__(locale, 'title'), html, config.production ? ['/updates/static/css/updates.min.css'] : ['/updates/static/css/updates.css'],
                config.production ? ['/updates/static/js/updates.min.js'] : ['/updates/static/js/updates.js']));
        } catch (e) {
            next(new Error(e.message));
        }
    };
    app.use('/updates/static', app.get('express').static(`${__dirname}/static`));
    let router = Router();
    router.get('/', updates);
    return {
        routes: router,
        info: {
            id: moduleId,
            url: moduleURL,
            title: Module.getTitles(i18n),
            icon: 'refresh'
        }
    };
};