const moduleId = 'dashboard';
const path = require('path');
const config = require('../../core/config.js');
const moduleURL = config.core.prefix.admin;
const Module = require('../../core/module.js');
const Router = require('co-router');
const os = require('os');

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const panel = new(require('../../core/panel.js'))(app);
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const dashboard = async(req, res, next) => {
        try {
            const uprefix = i18n.getLanguageURLPrefix(req);
            if (!Module.isAuthorizedAdmin(req)) {
                Module.logout(req);
                return res.redirect(303, (config.core.prefix.auth ? uprefix + config.core.prefix.auth : uprefix + '/auth') + '?redirect=' + uprefix + moduleURL + '&rnd=' + Math.random().toString().replace('.', ''));
            }
            const locale = req.session.currentLocale;
            let html = await render.file('dashboard.html', {
                i18n: i18n.get(),
                config: config,
                locale: locale,
                uprefix: uprefix,
                langs: JSON.stringify(config.i18n.locales),
                maintenanceEnabled: config.website.maintenance,
                os: os
            });
            res.send(await panel.html(req, moduleId, i18n.get().__(locale, 'title'), html, config.production ? ['/dashboard/static/css/dashboard.min.css'] : ['/dashboard/static/css/dashboard.css'],
                config.production ? ['/dashboard/static/js/dashboard.min.js'] : ['/dashboard/static/js/dashboard.js']));
        } catch (e) {
            next(new Error(e.message));
        }
    };
    app.use('/dashboard/static', app.get('express').static(`${__dirname}/static`));
    let router = Router();
    router.get('/', dashboard);
    return {
        routes: router,
        info: {
            id: moduleId,
            url: moduleURL,
            title: Module.getTitles(i18n),
            icon: 'cog'
        }
    };
};