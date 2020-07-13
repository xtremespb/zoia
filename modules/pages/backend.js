/* eslint max-len: 0 */

const moduleId = 'pages';
const config = require('../../core/config.js');
const moduleURL = config.core.prefix.admin + '/pages';
const Module = require('../../core/module.js');
const Router = require('co-router');

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
            const locale = req.session.currentLocale;
            let folders = await db.collection('pages_registry').findOne({ name: 'pagesFolders' });
            let templatesHash = {};
            let templates = typeof config.website.templates === 'object' ? config.website.templates : [config.website.templates];
            for (let i in templates) {
            	templatesHash[templates[i]] = templates[i];
            }
            let html = await render.file('pages.html', {
                i18n: i18n.get(),
                config: config,
                locale: locale,
                templates: JSON.stringify(templatesHash),
                lang: JSON.stringify(i18n.get().locales[locale]),
                langs: JSON.stringify(config.i18n.localeNames),
                uprefix: uprefix,
                rxp: config.core && config.core.regexp && config.core.regexp.pageID ? JSON.stringify(config.core.regexp) : '{"pageID":"^[A-Za-z0-9_\\\\-]+$", "pageFolder":"^[A-Za-z0-9_\\\\-]+$"}',
                corePrefix: JSON.stringify(config.core.prefix),
                folders: folders ? folders.data : JSON.stringify([{ id: '1', text: '/', parent: '#', type: 'root' }])
            });
            res.send(await panel.html(req, moduleId, i18n.get().__(locale, 'title'), html, config.production ? [config.codemirror ? '/zoia/3rdparty/codemirror/codemirror.min.css' : null, '/pages/static/css/pages.min.css'] : [config.codemirror ? '/zoia/3rdparty/codemirror/codemirror.min.css' : null, '/zoia/3rdparty/jstree/themes/default/style.min.css', '/pages/static/css/pages.css'],
                config.production ? [config.codemirror ? '/zoia/3rdparty/codemirror/codemirror.min.js' : '/zoia/3rdparty/ckeditor/ckeditor.js', config.codemirror ? null : '/zoia/3rdparty/ckeditor/adapters/jquery.js', '/pages/static/js/pages.min.js'] : [config.codemirror ? '/zoia/3rdparty/codemirror/codemirror.js' : '/zoia/3rdparty/ckeditor/ckeditor.js', config.codemirror ? '/zoia/3rdparty/codemirror/htmlmixed.js' : '/zoia/3rdparty/ckeditor/adapters/jquery.js',
                    '/zoia/core/js/jquery.zoiaFormBuilder.js', '/zoia/core/js/jquery.zoiaTable.js', '/zoia/3rdparty/jstree/jstree.min.js', '/pages/static/js/pages.js'
                ]));
        } catch (e) {
            next(new Error(e.message));
        }
    };

    const browse = async(req, res, next) => {
        try {
            const uprefix = i18n.getLanguageURLPrefix(req);
            if (!Module.isAuthorizedAdmin(req)) {
                Module.logout(req);
                return res.redirect(303, (config.core.prefix.auth ? uprefix + config.core.prefix.auth : uprefix + '/auth') + '?redirect=' + moduleURL + '&rnd=' + Math.random().toString().replace('.', ''));
            }
            const locale = req.session.currentLocale;
            let html = await render.file('browse.html', {
                i18n: i18n.get(),
                config: config,
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale])
            });
            res.send(html);
        } catch (e) {
            next(new Error(e.message));
        }
    };

    app.use('/pages/static', app.get('express').static(`${__dirname}/static`));

    let router = Router();
    router.get('/', list);
    router.get('/browse', browse);
    return {
        routes: router,
        info: {
            id: moduleId,
            url: moduleURL,
            title: Module.getTitles(i18n),
            icon: 'copy'
        }
    };
};