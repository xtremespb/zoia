const path = require('path');
const config = require(path.join(__dirname, 'config.js'));
const nunjucks = require('nunjucks');
const fs = require('mz/fs');

module.exports = class Render {
    constructor(dir, app) {
        if (dir) {
            this.env = new nunjucks.Environment(new nunjucks.FileSystemLoader(dir, { watch: true, noCache: false }));
            this.env.opts.autoescape = false;
        }
        if (app) {
            this.app = app;
            this.log = app.get('log');
            this.i18n = new(require(path.join(__dirname, 'i18n.js')))(path.join(__dirname, 'lang'), app);
        }
    }
    setFilters(filters) {
        if (filters && this.env) {
            for (let n in filters) {
                try {
                    this.env.getFilter(n);
                } catch (e) {
                    this.env.addFilter(n, filters[n], true);
                }
            }
        }
    }
    _render(file, data) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.env.render(file, data, function(err, res) {
                if (err && that.log) {
                    that.log.error(err);
                    return reject(err);
                }
                resolve(res);
            });
        });
    }
    async file(file, data) {
        return await this._render(file, data);
    }
    async template(req, i18n, locale, pageTitle, data2, tpl) {
        let template = (tpl || config.website.templates[0]) + '_' + locale + '.html';
        try {
            await fs.access(path.join(__dirname, '..', 'views', template), fs.constants.F_OK);
        } catch (e) {
            template = (tpl || config.website.templates[0]) + '_' + config.i18n.locales[0] + '.html';
        }
        let admin = false;
        if (req && req.session && req.session.auth && req.session.auth.groups) {
            admin = req.session.auth.groups.split(',').indexOf('admin') > -1;
        }
        let data1 = {
            i18n: i18n.get(),
            i18nc: this.i18n.get(),
            req: req,
            admin: admin,
            auth: (req && req.session && req.session.auth) ? req.session.auth : false,
            locale: locale,
            uprefix: i18n.getLanguageURLPrefix(req),
            lang: JSON.stringify(i18n.get().locales[locale]),
            config: config,
            pageTitle: pageTitle
        };
        let data = Object.assign(data1, data2);
        return await this._render(template, data);
    }
};