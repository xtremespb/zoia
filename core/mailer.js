const path = require('path');
const config = require(path.join(__dirname, 'config.js'));
const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');

module.exports = class Mailer {
    constructor(app, db) {
        this.transporter = nodemailer.createTransport(config.mailer);
        this.log = app ? app.get('log') : null;
        this.db = app ? app.get('db') : db;
        this.render = new(require(path.join(__dirname, 'render.js')))(path.join(__dirname, '..', 'views'));
        this.i18n = new(require(path.join(__dirname, 'i18n.js')))(path.join(__dirname, 'lang'), app);
    }
    async _send(mailOptions) {
        let that = this;
        return new Promise(function(resolve, reject) {
            that.transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(info.messageId);
                }
            });
        });
    }
    async send(req, to, subject, content) {
        const locale = req.session.currentLocale;
        let html = await this.render.file('mail.html', {
            i18n: this.i18n.get(),
            locale: locale,
            lang: JSON.stringify(this.i18n.get().locales[locale]),
            config: config,
            subject: subject,
            content: content
        });
        let plain = await this.render.file('mail.txt', {
            i18n: this.i18n.get(),
            locale: locale,
            lang: JSON.stringify(this.i18n.get().locales[locale]),
            config: config,
            subject: subject,
            content: htmlToText.fromString(content)
        });
        const mailOptions = {
            from: config.website.email.noreply,
            to: to,
            subject: subject,
            text: plain,
            html: html,
            attachments: [{
                filename: 'logo.png',
                path: path.join(__dirname, config.website.logo.mail ? config.website.logo.mail.path : config.website.logo.small.path),
                cid: 'ztSj5GyXAdxeH6VS'
            }]
        };
        if (config.mailer.delayed) {
            const insResult = await this.db.collection('mail').insertOne(mailOptions);
            if (!insResult || !insResult.result || !insResult.result.ok) {
                if (this.log) {
                    this.log.error(insResult.result);
                }
            } else {
                return insResult.insertedId;
            }
        } else {
            let result;
            try {
                result = await this._send(mailOptions);
            } catch (e) {
                if (this.log) {
                    this.log.error(e);
                }
            }
            return result;
        }
    }
};