const config = require('../../core/config.js');
const Router = require('co-router');
const fs = require('fs-extra');
const moment = require('moment');
const Module = require('../../core/module.js');
const ObjectID = require('mongodb').ObjectID;

let configModule;
try {
    configModule = require('./config/feedback.json');
} catch (e) {
    configModule = require('./config/feedback.dist.json');
}

let templateFeedbackForm = 'frontend.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateFeedbackForm}`)) {
    templateFeedbackForm = 'custom_' + templateFeedbackForm;
}

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const db = app.get('db');
    const log = app.get('log');
    const renderFeedback = new(require('../../core/render.js'))(`${__dirname}/views`, app);
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
            let feedbackHTML = await renderFeedback.file(templateFeedbackForm, {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                configModule: configModule,
                config: config,
                auth: req.session.auth,
                uprefix: uprefix
            });
            let html = await renderRoot.template(req, i18n, locale, i18n.get().__(locale, 'Feedback'), {
                content: feedbackHTML,
                extraCSS: config.production ? ['/feedback/static/css/frontend.min.css'] : ['/feedback/static/css/frontend.css'],
                extraJS: config.production ? ['/feedback/static/js/frontend.min.js'] : ['/zoia/core/js/jquery.zoiaFormBuilder.js', '/feedback/static/js/frontend.js']
            });
            res.send(html);
        } catch (e) {
            log.error(e);
            return next(e);
        }
    };

    app.use(configModule.prefix.feedback + '/static', app.get('express').static(`${__dirname}/static`));
    let router = Router();
    router.get('/', form);

    return {
        routes: router
    };
};