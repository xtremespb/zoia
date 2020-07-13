const path = require('path');
const config = require(path.join(__dirname, 'config.js'));

module.exports = function(app) {
    const render = new(require(path.join(__dirname, 'render.js')))(path.join(__dirname, 'views'));
    const i18n = new(require(path.join(__dirname, 'i18n.js')))(path.join(__dirname, 'lang'), app);
    let errors = {
        notFound: async(req, res, next) => {
            let err = new Error();
            err.status = 404;
            next(err);
        },
        errorHandler: async(err, req, res, next) => {
            let locale = config.i18n.locales[0];
            if (req.session && req.session.currentLocale) {
                locale = req.session.currentLocale;
            }
            err.status = !err.status ? 500 : err.status;
            if (err.status === 404) {
                err.message = i18n.get().__(locale, 'Not found');
            }
            const html = await render.file('error.html', {
                locale: locale,
                i18n: i18n.get(),
                err: err,
                config: config
            });
            app.get('log').error('[' + err.status + '] ' + req.ip + ' ' + req.method + ' ' + req.url);
            if (config.log.stackTrace && err.status !== 404) {
                app.get('log').error(err.stack);
            }
            res.status(err.status).send(html);
            next();
        }
    };
    return errors;
};