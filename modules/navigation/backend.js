const moduleId = 'navigation';
const config = require('../../core/config.js');
const moduleURL = config.core.prefix.admin + '/navigation';
const Module = require('../../core/module.js');
const Router = require('co-router');

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const panel = new(require('../../core/panel.js'))(app);
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const db = app.get('db');

    const navigation = async(req, res, next) => {
        try {
            const uprefix = i18n.getLanguageURLPrefix(req);
            if (!Module.isAuthorizedAdmin(req)) {
                Module.logout(req);
                return res.redirect(303, (config.core.prefix.auth ? uprefix + config.core.prefix.auth : uprefix + '/auth') + '?redirect=' + uprefix + moduleURL + '&rnd=' + Math.random().toString().replace('.', ''));
            }
            const locale = req.session.currentLocale;
            let defaultFolders = {};
            for (let i in config.i18n.locales) {
                defaultFolders[config.i18n.locales[i]] = new Array({ id: 'j1_1', text: '/', data: null, parent: '#', type: 'root' });
            }
            let folders = await db.collection('navigation').findOne({ name: 'navigation' });
            let html = await render.file('navigation.html', {
                i18n: i18n.get(),
                config: config,
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                langs: JSON.stringify(config.i18n.localeNames),
                uprefix: uprefix,
                rxp: config.core && config.core.regexp && config.core.regexp.pageID ? JSON.stringify(config.core.regexp) : '{"pageID":"^[A-Za-z0-9_\\\\-]+$", "pageURL":"^[A-Za-z0-9_\-\/]+$"}',
                corePrefix: JSON.stringify(config.core.prefix),
                folders: folders ? folders.data : JSON.stringify(defaultFolders)
            });
            res.send(await panel.html(req, moduleId, i18n.get().__(locale, 'title'), html, config.production ? ['/navigation/static/css/navigation.min.css'] : ['/zoia/3rdparty/jstree/themes/default/style.min.css', '/navigation/static/css/navigation.css'],
                config.production ? ['/navigation/static/js/navigation.min.js'] : ['/zoia/core/js/jquery.zoiaFormBuilder.js', '/zoia/3rdparty/jstree/jstree.min.js', '/navigation/static/js/navigation.js']));
        } catch (e) {
            next(new Error(e.message));
        }
    };

    app.use('/navigation/static', app.get('express').static(`${__dirname}/static`));

    let router = Router();
    router.get('/', navigation);
    return {
        routes: router,
        info: {
            id: moduleId,
            url: moduleURL,
            title: Module.getTitles(i18n),
            icon: 'list'
        }
    };
};