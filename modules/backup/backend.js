const moduleId = 'backup';
const path = require('path');
const config = require('../../core/config.js');
const moduleURL = config.core.prefix.admin + '/backup';
const Module = require('../../core/module.js');
const Router = require('co-router');

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const panel = new(require('../../core/panel.js'))(app);
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const backup = async(req, res, next) => {
        try {
            const uprefix = i18n.getLanguageURLPrefix(req);
            if (!Module.isAuthorizedAdmin(req)) {
                Module.logout(req);
                return res.redirect(303, (config.core.prefix.auth ? uprefix + config.core.prefix.auth : uprefix + '/auth') + '?redirect=' + uprefix + moduleURL + '&rnd=' + Math.random().toString().replace('.', ''));
            }
            const locale = req.session.currentLocale;
            let html = await render.file('backup.html', {
                i18n: i18n.get(),
                config: config,
                locale: locale,
                uprefix: uprefix,
                lang: JSON.stringify(i18n.get().locales[locale]),
                modules: app.get('modules'),
                rnd: Date.now()
            });
            res.send(await panel.html(req, moduleId, i18n.get().__(locale, 'title'), html, config.production ? ['/backup/static/css/backup.min.css'] : ['/backup/static/css/backup.css'],
                config.production ? ['/backup/static/js/backup.min.js'] : ['/backup/static/js/backup.js']));
        } catch (e) {
            next(new Error(e.message));
        }
    };
    app.use('/backup/static', app.get('express').static(`${__dirname}/static`));
    let router = Router();
    router.get('/', backup);
    return {
        routes: router,
        info: {
            id: moduleId,
            url: moduleURL,
            title: Module.getTitles(i18n),
            icon: 'pull'
        }
    };
};