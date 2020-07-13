const path = require('path');
const config = require('../../core/config.js');
const Router = require('co-router');
const fs = require('fs-extra');
const Module = require('../../core/module.js');

const moduleURL = config.core.prefix.account;
let templateList = 'account.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateList}`)) {
    templateList = 'custom_' + templateList;
}
let configModule;
try {
    configModule = require('./config/users.json');
} catch (e) {
    configModule = require('./config/users.dist.json');
}

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const renderAccount = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const renderRoot = new(require('../../core/render.js'))(`${__dirname}/../../views`, app);
    const log = app.get('log');

    const account = async(req, res, next) => {
        const uprefix = i18n.getLanguageURLPrefix(req);
        if (!Module.isAuthorized(req)) {
            return res.redirect(303, (config.core.prefix.auth ? uprefix + config.core.prefix.auth : uprefix + '/auth') + '?redirect=' + uprefix + moduleURL + '&_=' + Math.random().toString().replace('.', ''));
        }        
        let pictureURL = '/users/static/pictures/large_' + req.session.auth._id + '.jpg';
        try {
            await fs.access(path.join(__dirname, 'static', 'pictures', 'large_' + req.session.auth._id + '.jpg'), fs.constants.F_OK);
        } catch (e) {
            pictureURL = '/users/static/pictures/large_default.png';
        }
        let locale = config.i18n.locales[0];
        if (req.session && req.session.currentLocale) {
            locale = req.session.currentLocale;
        }
        let filters = app.get('templateFilters');
        renderRoot.setFilters(filters);
        try {
            let listHTML = await renderAccount.file(templateList, {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                configModule: configModule,
                account: req.session.auth,
                isAdmin: Module.isAuthorizedAdmin(req) ? true : null,
                uprefix: uprefix,
                aprefix: config.core.prefix.auth,
                pictureURL: pictureURL
            });
            let html = await renderRoot.template(req, i18n, locale, i18n.get().__(locale, 'Your Account'), {
                content: listHTML,
                extraCSS: config.production ? ['/users/static/css/frontend.min.css'] : ['/users/static/css/frontend.css'],
                extraJS: config.production ? ['/users/static/js/frontend.min.js'] : ['/users/static/js/frontend.js']
            });
            res.send(html);
        } catch (e) {
            log.error(e);
            return next();
        }
    };

    let router = Router();
    router.get('/', account);

    return {
        routes: router
    };
};