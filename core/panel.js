const path = require('path');
const config = require(path.join(__dirname, 'config.js'));

module.exports = class Panel {
    constructor(app) {
        this.app = app;
        this.render = new(require(path.join(__dirname, 'render.js')))(path.join(__dirname, 'views'), app);
        this.i18n = new(require(path.join(__dirname, 'i18n.js')))(path.join(__dirname, 'lang'), app);
    }
    async html(req, id, title, data, extraCSS, extraJS) {
        const locale = req.session.currentLocale;
        const auth = req.session.auth;
        const uprefix = this.i18n.getLanguageURLPrefix(req);
        return await this.render.file('panel.html', {
            i18n: this.i18n.get(),
            locale: locale,
            config: config,
            data: data,
            moduleId: id,
            moduleName: title,
            modules: this.app.get('backendModules'),
            auth: auth,
            extraJS: extraJS,
            extraCSS: extraCSS,
            uprefix: uprefix,
            authPrefix: config.core.prefix.auth
        });
    }
};