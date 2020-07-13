const path = require('path');
const config = require('../../core/config.js');
const Router = require('co-router');
const fs = require('fs');
const Module = require('../../core/module.js');

const moduleURL = '/customer';
let templateList = 'frontend.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateList}`)) {
    templateList = 'custom_' + templateList;
}

let configModule;
try {
    configModule = require('./config/hosting.json');
} catch (e) {
    configModule = require('./config/hosting.dist.json');
}

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const db = app.get('db');
    const renderHosting = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const renderRoot = new(require('../../core/render.js'))(`${__dirname}/../../views`, app);
    const log = app.get('log');

    const list = async(req, res, next) => {
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
        let presetTitles = {};
        let presetPrices = {};
        for (let i in configModule.presets) {
            let cost = (configModule.currencyPosition === 'left' ? configModule.currency[locale] : '') + configModule.presets[i].cost + (configModule.currencyPosition === 'right' ? ' ' + configModule.currency[locale] : '');
            presetTitles[configModule.presets[i].id] = configModule.presets[i].titles[locale] + '&nbsp;(' + cost + ')' || configModule.presets[i].id;
            presetPrices[configModule.presets[i].id] = configModule.presets[i].cost || 0;
        }
        let accounts = [];
        try {
            accounts = await db.collection('hosting_accounts').find({ ref_id: String(req.session.auth._id) }, { sort: {}, projection: { id: 1, preset: 1, days: 1 } }).toArray() || [];
        } catch (e) {
            log.error(e);
        }
        try {
            const transactions = await db.collection('hosting_transactions').find({ ref_id: String(req.session.auth._id) }, { sort: { timestamp: -1 }, limit: 50, projection: { _id: 0, timestamp: 1, sum: 1 } }).toArray() || [];
            const ar = await db.collection('hosting_transactions').aggregate([
                { $match: { ref_id: String(req.session.auth._id) } },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: '$sum'
                        }
                    }
                }
            ]).toArray();
            const totalFunds = ar.length > 0 ? ar[0].total : 0;
            let listHTML = await renderHosting.file(templateList, {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                configModule: configModule,
                configModuleJSON: JSON.stringify(configModule),
                accounts: accounts,
                presets: presetTitles,
                presetsJSON: JSON.stringify(presetTitles),
                prices: presetPrices,
                pricesJSON: JSON.stringify(presetPrices),
                totalFunds: totalFunds,
                transactions: transactions
            });
            let html = await renderRoot.template(req, i18n, locale, i18n.get().__(locale, 'Customer Accounts'), {
                content: listHTML,
                extraCSS: config.production ? ['/hosting/static/css/frontend.min.css'] : ['/hosting/static/css/frontend.css'],
                extraJS: config.production ? ['/hosting/static/js/frontend.min.js'] : ['/zoia/core/js/jquery.zoiaFormBuilder.js', '/hosting/static/js/frontend.js']
            });
            res.send(html);
        } catch (e) {
            log.error(e);
            return next();
        }
    };

    let router = Router();
    router.get('/', list);

    return {
        routes: router
    };
};