/* eslint max-len: 0 */
const moduleId = 'blog';
const path = require('path');
const config = require('../../core/config.js');
let configModule;
try {
    configModule = require('./config/blog.json');
} catch (e) {
    configModule = require('./config/blog.dist.json');
}
const moduleURL = config.core.prefix.admin + configModule.prefix.blog;

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
            let folders = await db.collection('blog_registry').findOne({ name: 'blogFolders' });
            let templatesHash = {};
            let templates = typeof config.website.templates === 'object' ? config.website.templates : [config.website.templates];
            for (let i in templates) {
                templatesHash[templates[i]] = templates[i];
            }
            let html = await render.file('blog.html', {
                i18n: i18n.get(),
                config: config,
                locale: locale,
                templates: JSON.stringify(templatesHash),
                lang: JSON.stringify(i18n.get().locales[locale]),
                langs: JSON.stringify(config.i18n.localeNames),
                uprefix: uprefix,
                corePrefix: JSON.stringify(config.core.prefix),
                folders: folders ? folders.data : JSON.stringify([{ id: '1', text: '/', parent: '#', type: 'root' }])
            });
            res.send(await panel.html(req, moduleId, i18n.get().__(locale, 'title'), html, config.production ? [config.codemirror ? '/zoia/3rdparty/codemirror/codemirror.min.css' : null, '/blog/static/css/blog.min.css'] : [config.codemirror ? '/zoia/3rdparty/codemirror/codemirror.css' : null, '/blog/static/css/blog.css'],
                config.production ? [config.codemirror ? '/zoia/3rdparty/codemirror/codemirror.min.js' : '/zoia/3rdparty/ckeditor/ckeditor.js', config.codemirror ? null : '/zoia/3rdparty/ckeditor/adapters/jquery.js', '/blog/static/js/blog.min.js'] : [config.codemirror ? '/zoia/3rdparty/codemirror/codemirror.min.js' : '/zoia/3rdparty/ckeditor/ckeditor.js', config.codemirror ? '/zoia/3rdparty/codemirror/htmlmixed.js' : '/zoia/3rdparty/ckeditor/adapters/jquery.js',
                    '/zoia/core/js/jquery.zoiaFormBuilder.js', '/zoia/core/js/jquery.zoiaTable.js', '/zoia/3rdparty/jstree/jstree.min.js', '/blog/static/js/tags-input.js', '/zoia/3rdparty/moment/moment-with-locales.min.js', '/blog/static/js/blog.js'
                ]));
        } catch (e) {
            next(new Error(e.message));
        }
    };

    app.use('/blog/static', app.get('express').static(`${__dirname}/static`));

    let router = Router();
    router.get('/', list);
    return {
        routes: router,
        info: {
            id: moduleId,
            url: moduleURL,
            title: Module.getTitles(i18n),
            icon: 'pencil'
        }
    };
};