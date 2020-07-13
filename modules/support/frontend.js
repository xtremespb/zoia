const path = require('path');
const config = require('../../core/config.js');
const Router = require('co-router');
const fs = require('fs');
const Module = require('../../core/module.js');

let configModule;
try {
    configModule = require('./config/support.json');
} catch (e) {
    configModule = require('./config/support.dist.json');
}

const moduleURL = '/support';
let templateFrontend = 'frontend.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateFrontend}`)) {
    templateFrontend = 'custom_' + templateFrontend;
}

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const renderHosting = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const renderRoot = new(require('../../core/render.js'))(`${__dirname}/../../views`, app);
    const log = app.get('log');

    const frontend = async(req, res, next) => {
        const uprefix = i18n.getLanguageURLPrefix(req);
        if (!Module.isAuthorized(req)) {
            return res.redirect(303, (config.core.prefix.auth ? uprefix + config.core.prefix.auth : uprefix + '/auth') + '?redirect=' + uprefix + moduleURL + '&_=' + Math.random().toString().replace('.', ''));
        }
        let locale = config.i18n.locales[0];
        if (req.session && req.session.currentLocale) {
            locale = req.session.currentLocale;
        }
        let filters = app.get('templateFilters');
        renderRoot.setFilters(filters);
        try {
            let listHTML = await renderHosting.file(templateFrontend, {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                configModule: configModule,
                username: req.session.auth.username,
                uprefix: uprefix
            });
            let html = await renderRoot.template(req, i18n, locale, i18n.get().__(locale, 'Support'), {
                content: listHTML,
                extraCSS: config.production ? ['/support/static/css/frontend.min.css'] : ['/support/static/css/frontend.css'],
                extraJS: config.production ? ['/support/static/js/frontend.min.js'] : ['/zoia/core/js/jquery.zoiaTable.js', '/support/static/js/frontend.js']
            });
            res.send(html);
        } catch (e) {
            log.error(e);
            return next();
        }
    };

    let router = Router();
    router.get('/', frontend);

    return {
        routes: router
    };
};