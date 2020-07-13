const path = require('path');
const config = require('../../core/config.js');
const Router = require('co-router');
const fs = require('fs-extra');
const Module = require('../../core/module.js');
const rp = require('request-promise');
const moment = require('moment');

const moduleURL = '';
let templateList = 'frontend.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateList}`)) {
    templateList = 'custom_' + templateList;
}
let templateError = 'error.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateError}`)) {
    templateError = 'custom_' + templateError;
}
let configModule;
try {
    configModule = require('./config/brb.json');
} catch (e) {
    configModule = require('./config/brb.dist.json');
}

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const renderAccount = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const renderRoot = new(require('../../core/render.js'))(`${__dirname}/../../views`, app);
    const log = app.get('log');
    const db = app.get('db');

    const renderErrorHTML = async (req, res, locale, message) => {
        const listHTML = await renderAccount.file(templateError, {
            i18n: i18n.get(),
            locale: locale,
            message: message
        });
        const html = await renderRoot.template(req, i18n, locale, i18n.get().__(locale, 'Error'), {
            content: listHTML,
            extraCSS: config.production ? ['/brb/static/css/frontend.min.css'] : ['/brb/static/css/frontend.css'],
            extraJS: []
        });
        res.send(html);
    };

    const frontend = async (req, res, next) => {
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
        if (!req.session.auth.portfolioid) {
            return await renderErrorHTML(req, res, locale, i18n.get().__(locale, 'No assotiated portfolio ID for your account. Please contact support if you think that\'s wrong.'));
        }
        try {
            let apiInfo;
            let apiTickers;
            let apiChartData;
            const cache1 = await db.collection('brb_cache').findOne({
                pid: req.session.auth.portfolioid,
                request: 'getInfo'
            });
            if (cache1) {
                apiInfo = cache1.data;
            } else {
                let response;
                try {
                    response = JSON.parse(await rp(`${configModule.api.url}/getInfo?id=${req.session.auth.portfolioid}`));
                } catch (e) {
                    return await renderErrorHTML(req, res, locale, i18n.get().__(locale, 'Could not fetch information from API.'));
                }
                if (!response || response.status !== 1) {
                    return await renderErrorHTML(req, res, locale, i18n.get().__(locale, 'Could not fetch information from API.'));
                }
                apiInfo = response.data;
                await db.collection('brb_cache').update({
                    pid: req.session.auth.portfolioid,
                    request: 'getInfo'
                }, {
                    pid: req.session.auth.portfolioid,
                    request: 'getInfo',
                    timestamp: new Date(),
                    data: apiInfo
                }, {
                    upsert: true
                });
            }
            const cache2 = await db.collection('brb_cache').findOne({
                pid: req.session.auth.portfolioid,
                request: 'getTickers'
            });
            if (cache2) {
                apiTickers = cache2.data;
            } else {
                let response;
                try {
                    response = JSON.parse(await rp(`${configModule.api.url}/getTickers?id=${req.session.auth.portfolioid}`));
                } catch (e) {
                    // return await renderErrorHTML(req, res, locale, i18n.get().__(locale, 'Could not fetch information from API.'));
                    response = { status: 1 };
                }
                if (!response || response.status !== 1) {
                    return await renderErrorHTML(req, res, locale, i18n.get().__(locale, 'Could not fetch information from API.'));
                }
                apiTickers = response.tickerData || [];
                await db.collection('brb_cache').update({
                    pid: req.session.auth.portfolioid,
                    request: 'getTickers'
                }, {
                    pid: req.session.auth.portfolioid,
                    request: 'getTickers',
                    timestamp: new Date(),
                    data: apiTickers
                }, {
                    upsert: true
                });
            }

            let listHTML = await renderAccount.file(templateList, {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                configModule: configModule,
                frontend: req.session.auth,
                uprefix: uprefix,
                portfolioid: req.session.auth.portfolioid,
                apiInfo: apiInfo,
                apiInfoJSON: JSON.stringify(apiInfo),
                apiTickersJSON: JSON.stringify(apiTickers)
            });
            let html = await renderRoot.template(req, i18n, locale, i18n.get().__(locale, 'Your BRB Account'), {
                content: listHTML,
                extraCSS: config.production ? ['/brb/static/css/frontend.min.css'] : ['/brb/static/css/frontend.css'],
                extraJS: config.production ? ['/brb/static/js/frontend.min.js'] : ['/zoia/core/js/jquery.zoiaTable.js', '/zoia/3rdparty/moment/moment-with-locales.min.js', '/brb/static/js/frontend.js']
            });
            res.send(html);
        } catch (e) {
            log.error(e);
            return await renderErrorHTML(req, res, locale, e);
        }
    };

    let router = Router();
    router.get('/', frontend);

    return {
        routes: router
    };
};