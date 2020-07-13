const config = require('../../core/config.js');

module.exports = function(app) {
    const db = app.get('db');

    const navigationAsync = async(req, prefix) => {
        if (!req) {
            return '';
        }
        let locale = config.i18n.locales[0];
        if (req.session && req.session.currentLocale) {
            locale = req.session.currentLocale;
        }
        let html = await db.collection('navigation').findOne({ name: 'navigation_html_' + prefix + '_' + locale });
        return html ? html.data : '';
    };

    const navigationDesktop = (data, callback) => {
        navigationAsync(data, 'd').then(function(html) {
            callback(null, html);
        });
    };

    const navigationMobile = (data, callback) => {
        navigationAsync(data, 'm').then(function(html) {
            callback(null, html);
        });
    };

    return {
        filters: {
            navigationDesktop: navigationDesktop,
            navigationMobile: navigationMobile
        }
    };
};