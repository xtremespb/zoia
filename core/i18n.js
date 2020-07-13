const path = require('path');
const config = require(path.join(__dirname, 'config.js'));

module.exports = class I18N {
    constructor(dir, app) {
        if (app) {
            this.app = app;
        }
        this.i18n = new(require(path.join(__dirname, 'modules', 'i18n.js')))({
            locales: config.i18n.locales,
            cookieName: config.i18n.cookieName,
            directory: dir,
            extension: '.json',
            devMode: config.i18n.dev
        });
    }
    detectLanguage(req) {
        if (!this.i18n || !req) {
            return;
        }
        let detected;
        if (config.i18n.detect.subdomain) {
            if (req.subdomains && req.subdomains.length > 0) {
                detected = req.subdomains[req.subdomains.length - 1];
            } else {
                detected = config.i18n.locales[0];
            }
        }
        if (!detected && config.i18n.detect.query) {
            if (req.query && req.query.lang && typeof req.query.lang === 'string' && req.query.lang.match(/^[a-z]{2}$/)) {
                detected = req.query.lang;
            }
        }
        if (!detected && config.i18n.detect.cookie) {
            this.i18n.setLocaleFromCookie(req);
            detected = this.i18n.getLocale();
        }
        if (!detected && config.i18n.detect.url) {
            /* eslint no-unused-vars: 0 */
            const [dummy, lng] = req.url.split(/\//);
            if (!req.url.match(/^\/(api)/) && !req.url.match(/\/(static)\//)) {
                if (lng && lng.match(/^[a-z]{2}$/) && config.i18n.locales.indexOf(lng) > -1) {
                    detected = lng;
                } else {
                    detected = config.i18n.locales[0];
                }
            } else if (req.session.currentLocale) {
                detected = req.session.currentLocale;
            }
        }
        if (!detected && req.session && req.session.currentLocale) {
            detected = req.session.currentLocale;
        }
        return detected || config.i18n.locales[0];
    }
    getLanguageURLPrefix(req) {
        if (!this.i18n || !req || !config.i18n.detect.url) {
            return '';
        }
        const locale = req.session.currentLocale;
        if (locale !== config.i18n.locales[0]) {
            return '/' + locale;
        }
        return '';
    }
    get() {
        return this.i18n;
    }
};