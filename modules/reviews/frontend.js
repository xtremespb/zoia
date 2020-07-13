const path = require('path');
const config = require('../../core/config.js');
const Router = require('co-router');
const fs = require('fs');

let templateList = 'frontend.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateList}`)){
    templateList = 'custom_' + templateList;
}

let configModule;
try {
    configModule = require('./config/reviews.json');
} catch (e) {
    configModule = require('./config/reviews.dist.json');
}

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const db = app.get('db');
    const renderReviews = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const renderRoot = new(require('../../core/render.js'))(`${__dirname}/../../views`, app);

    const list = async(req, res, next) => {
        let locale = config.i18n.locales[0];
        if (req.session && req.session.currentLocale) {
            locale = req.session.currentLocale;
        }
        let filters = app.get('templateFilters');
        renderRoot.setFilters(filters);
        let page = req.query.page;
        if (!page || typeof page !== 'string' || !parseInt(page, 10) || parseInt(page, 10) < 1) {
            page = 1;
        } else {
            page = parseInt(page, 10);
        }
        const skip = (page - 1) * configModule.itemsPerPage;
        try {
            const total = await db.collection('reviews').find({ status: '1' }).count();
            const items = await db.collection('reviews').find({ status: '1' }, { skip: skip, limit: configModule.itemsPerPage, sort: { timestamp: -1 } }).toArray();
            let nextpage = null;
            if (total - skip > configModule.itemsPerPage) {
                nextpage = page + 1;
            }
            let listHTML = await renderReviews.file(templateList, {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                total: total,
                nextpage: nextpage,
                items: items
            });
            let html = await renderRoot.template(req, i18n, locale, i18n.get().__(locale, 'Reviews'), {
                content: listHTML,
                extraCSS: config.production ? ['/reviews/static/css/frontend.min.css'] : ['/reviews/static/css/frontend.css'],
                extraJS: config.production ? ['/reviews/static/js/frontend.min.js'] : ['/reviews/static/js/frontend.js']
            });
            res.send(html);
        } catch (e) {
            return next();
        }
    };

    let router = Router();
    router.get('/', list);

    return {
        routes: router
    };
};