const moduleId = 'hosting';
const config = require('../../core/config.js');
const moduleURL = config.core.prefix.admin + '/hosting';
const Module = require('../../core/module.js');
const Router = require('co-router');
const fs = require('fs');
const plugins = fs.readdirSync(`${__dirname}/plugins_hosting`);
for (let i in plugins) {
    plugins[i] = plugins[i].replace(/\.js$/, '');
}
let configModule;
try {
    configModule = require('./config/hosting.json');
} catch (e) {
    configModule = require('./config/hosting.dist.json');
}

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
            let html = await render.file('hosting.html', {
                i18n: i18n.get(),
                config: config,
                configModule: configModule,
                configModuleJSON: JSON.stringify(configModule),
                plugins: JSON.stringify(plugins),
                locale: locale,
                uprefix: uprefix,
                corePrefix: JSON.stringify(config.core.prefix),
                lang: JSON.stringify(i18n.get().locales[locale])
            });
            res.send(await panel.html(req, moduleId, i18n.get().__(locale, 'title'), html, config.production ? ['/hosting/static/css/hosting.min.css'] : ['/hosting/static/css/hosting.css'],
                config.production ? ['/hosting/static/js/hosting.min.js'] : ['/zoia/core/js/jquery.zoiaFormBuilder.js', '/zoia/core/js/jquery.zoiaTable.js', '/hosting/static/js/hosting.js']));
        } catch (e) {
            next(new Error(e.message));
        }
    };

    app.use('/hosting/static', app.get('express').static(`${__dirname}/static`));

    let router = Router();
    router.get('/', list);
    return {
        routes: router,
        info: {
            id: moduleId,
            url: moduleURL,
            title: Module.getTitles(i18n),
            icon: 'server'
        }
    };
};