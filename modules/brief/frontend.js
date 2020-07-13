const config = require('../../core/config.js');
const Router = require('co-router');
const fs = require('fs-extra');
const moment = require('moment');
const Module = require('../../core/module.js');
const ObjectID = require('mongodb').ObjectID;

let configModule;
try {
    configModule = require('./config/brief.json');
} catch (e) {
    configModule = require('./config/brief.dist.json');
}

let templateBriefForm = 'frontend.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateBriefForm}`)) {
    templateBriefForm = 'custom_' + templateBriefForm;
}

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const db = app.get('db');
    const log = app.get('log');
    const renderBrief = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const renderRoot = new(require('../../core/render.js'))(`${__dirname}/../../views`, app);

    const form = async(req, res, next) => {
        let filters = app.get('templateFilters');
        renderRoot.setFilters(filters);
        let locale = config.i18n.locales[0];
        if (req.session && req.session.currentLocale) {
            locale = req.session.currentLocale;
        }
        const uprefix = i18n.getLanguageURLPrefix(req);
        try {
            let briefHTML = await renderBrief.file(templateBriefForm, {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                configModule: configModule,
                config: config,
                auth: req.session.auth,
                uprefix: uprefix
            });
            let html = await renderRoot.template(req, i18n, locale, i18n.get().__(locale, 'Brief'), {
                content: briefHTML,
                extraCSS: config.production ? ['/brief/static/css/frontend.min.css'] : ['/brief/static/css/frontend.css'],
                extraJS: config.production ? ['/brief/static/js/frontend.min.js'] : ['/zoia/core/js/jquery.zoiaFormBuilder.js', '/brief/static/js/frontend.js']
            });
            res.send(html);
        } catch (e) {
            log.error(e);
            return next(e);
        }
    };

    app.use(configModule.prefix.brief + '/static', app.get('express').static(`${__dirname}/static`));
    let router = Router();
    router.get('/', form);

    return {
        routes: router
    };
};