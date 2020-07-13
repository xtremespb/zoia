const moduleId = 'groups';
const config = require('../../core/config.js');
const moduleURL = config.core.prefix.admin + '/groups';
const Module = require('../../core/module.js');
const Router = require('co-router');

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const panel = new(require('../../core/panel.js'))(app);
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);

    const list = async(req, res, next) => {
        try {
            const uprefix = i18n.getLanguageURLPrefix(req);
            if (!Module.isAuthorizedAdmin(req)) {
                Module.logout(req);
                return res.redirect(303, (config.core.prefix.auth ? uprefix + config.core.prefix.auth : uprefix + '/auth') + '?redirect=' + uprefix + moduleURL + '&rnd=' + Math.random().toString().replace('.', ''));
            }
            const locale = req.session.currentLocale;
            let html = await render.file('groups.html', {
                i18n: i18n.get(),
                config: config,
                locale: locale,
                uprefix: uprefix,
                corePrefix: JSON.stringify(config.core.prefix),
                lang: JSON.stringify(i18n.get().locales[locale])
            });
            res.send(await panel.html(req, moduleId, i18n.get().__(locale, 'title'), html, config.production ? ['/groups/static/css/groups.min.css'] : ['/groups/static/css/groups.css'],
                config.production ? ['/groups/static/js/groups.min.js'] : ['/zoia/core/js/jquery.zoiaFormBuilder.js', '/zoia/core/js/jquery.zoiaTable.js', '/groups/static/js/groups.js']));
        } catch (e) {
            next(new Error(e.message));
        }
    };

    app.use('/groups/static', app.get('express').static(`${__dirname}/static`));

    let router = Router();
    router.get('/', list);
    return {
        routes: router,
        info: {
            id: moduleId,
            url: moduleURL,
            title: Module.getTitles(i18n),
            icon: 'users'
        }
    };
};