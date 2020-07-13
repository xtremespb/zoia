const Module = require('../../core/module.js');
const validation = new(require('../../core/validation.js'))();
const Router = require('co-router');
const feedbackFields = require('./schemas/feedbackFields.js');
const config = require('../../core/config.js');
const ObjectID = require('mongodb').ObjectID;

module.exports = function(app) {
    const log = app.get('log');
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const mailer = new(require('../../core/mailer.js'))(app);
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);

    const postMessage = async(req, res) => {
        res.contentType('application/json');
        const locale = req.session.currentLocale;
        const fieldList = feedbackFields.getFeedbackFields();
        let fields = validation.checkRequest(req.body, fieldList);
        let fieldsFailed = validation.getCheckRequestFailedFields(fields);
        if (fieldsFailed.length > 0) {
            return res.send(JSON.stringify({
                status: 0,
                fields: fieldsFailed
            }));
        }
        if (!req.session || fields.captcha.value !== req.session.captcha) {
            req.session.captcha = null;
            return res.send(JSON.stringify({
                status: -3,
                fields: ['captcha']
            }));
        }
        req.session.captcha = Math.random().toString().substr(2, 4);
        try {
            let mailHTML = await render.file('mail_feedback.html', {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config.website.email.feedback,
                name: fields.name.value,
                email: fields.email.value,
                phone: fields.phone.value,
                message: fields.message.value
            });
            await mailer.send(req, config.website.email.feedback, i18n.get().__(locale, 'New Feedback Message'), mailHTML);
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    let router = Router();
    router.post('/post', postMessage);

    return {
        routes: router
    };
};