const path = require('path');
const config = require('../../core/config.js');
const fs = require('fs');

let templateSwitcherDesktop = 'switcher_desktop.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateSwitcherDesktop}`)) {
    templateSwitcherDesktop = 'custom_' + templateSwitcherDesktop;
}
let templateSwitcherMobile = 'switcher_mobile.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateSwitcherMobile}`)) {
    templateSwitcherMobile = 'custom_' + templateSwitcherMobile;
}

module.exports = function(app) {
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/../../core/lang`, app);

    const switcherAsync = async(req, type, mobile) => {
        if (!req) {
            return '';
        }
        let locale = config.i18n.locales[0];
        if (req.session && req.session.currentLocale) {
            locale = req.session.currentLocale;
        }
        const roum = req.originalUrl.match(/^\/([a-z]{2})(\/|$)/);
        let langUrls = {};
        if (roum) {
            const rlng = roum[1];
            for (let i = 0; i < config.i18n.locales.length; i++) {
                const lng = config.i18n.locales[i];
                if (i === 0) {
                    const expr = new RegExp('^\/' + rlng);
                    langUrls[lng] = req.originalUrl.replace(expr, '');
                    continue;
                }
                langUrls[lng] = req.originalUrl.replace(rlng, lng);
            }
        } else {
            for (let i = 0; i < config.i18n.locales.length; i++) {
                const lng = config.i18n.locales[i];
                if (i === 0) {
                    langUrls[lng] = req.originalUrl;
                } else {
                    langUrls[lng] = '/' + lng + req.originalUrl;
                }
            }
        }
        let html = await render.file(mobile ? templateSwitcherMobile : templateSwitcherDesktop, {
            locale: locale,
            locales: config.i18n.locales,
            names: config.i18n.localeNames,
            type: type,
            urls: config.website.url,
            originalUrl: req.originalUrl || '',
            protocol: config.website.protocol,
            langUrls: langUrls,
            uprefix: i18n.getLanguageURLPrefix(req)
        });
        return html;
    };

    const switcherDesktopQuery = (data, callback) => {
        switcherAsync(data, 'query').then(function(html) {
            callback(null, html);
        });
    };

    const switcherDesktopSubdomain = (data, callback) => {
        switcherAsync(data, 'subdomain').then(function(html) {
            callback(null, html);
        });
    };

    const switcherDesktopURL = (data, callback) => {
        switcherAsync(data, 'url').then(function(html) {
            callback(null, html);
        });
    };

    const switcherMobileQuery = (data, callback) => {
        switcherAsync(data, 'query', true).then(function(html) {
            callback(null, html);
        });
    };

    const switcherMobileSubdomain = (data, callback) => {
        switcherAsync(data, 'subdomain', true).then(function(html) {
            callback(null, html);
        });
    };

    const switcherMobileURL = (data, callback) => {
        switcherAsync(data, 'url', true).then(function(html) {
            callback(null, html);
        });
    };

    return {
        filters: {
            switcherDesktopQuery: switcherDesktopQuery,
            switcherDesktopSubdomain: switcherDesktopSubdomain,
            switcherDesktopURL: switcherDesktopURL,
            switcherMobileQuery: switcherMobileQuery,
            switcherMobileSubdomain: switcherMobileSubdomain,
            switcherMobileURL: switcherMobileURL
        }
    };
};