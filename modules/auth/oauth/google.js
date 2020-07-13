const Module = require('../../../core/module.js');
const config = require('../../../core/config.js');
const fs = require('fs');
const rp = require('request-promise');
const crypto = require('crypto');

let configPlugin;
try {
    configPlugin = require('../config/oauth.json');
} catch (e) {
    configPlugin = require('../config/oauth.dist.json');
}

let templateOAUTH = 'oauth.html';
if (fs.existsSync(`${__dirname}/../views/custom_${templateOAUTH}`)) {
    templatePaymentError = 'custom_' + templateOAUTH;
}

module.exports = function(app, router) {
    const db = app.get('db');
    const log = app.get('log');
    const i18n = new(require('../../../core/i18n.js'))(`${__dirname}/../lang`, app);
    const render = new(require('../../../core/render.js'))(`${__dirname}/../views`, app);

    const renderPage = async(req, res, msg) => {
        const locale = req.session.currentLocale;
        let templateHTML = await render.file(templateOAUTH, {
            i18n: i18n.get(),
            config: config,
            locale: locale,
            msg: msg
        });
        res.send(templateHTML);
    };

    const process = async(req, res) => {
        const locale = req.session.currentLocale;
        const code = req.query.code || req.body.code;
        if (!code || typeof code !== 'string' || code.length > 128) {
            return renderPage(req, res, i18n.get().__(locale, 'Invalid authorization code. Please close this window and try again.'));
        }
        try {
            const data1 = await rp({
                method: 'POST',
                uri: 'https://accounts.google.com/o/oauth2/token',
                form: {
                    code: code,
                    client_id: configPlugin.google.id,
                    client_secret: configPlugin.google.secret,
                    redirect_uri: `${config.website.protocol}://${config.website.url[locale]}${config.core.prefix.auth}/oauth/google`,
                    grant_type: 'authorization_code'
                },
                json: true
            });
            if (!data1 || !data1.access_token) {
                return renderPage(req, res, i18n.get().__(locale, 'Could not retreive your profile information.'));
            }
            const accessToken = data1.access_token;
            const response2 = await rp(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`);
            const data2 = JSON.parse(response2);
            if (!data2 || !data2.email) {
                return renderPage(req, res, i18n.get().__(locale, 'Could not retreive your profile information.'));
            }
            const email = data2.email;
            const username = email.substring(0, email.lastIndexOf("@")).replace(/[\W_\-]+/g, '');
            const firstName = data2.given_name;
            const lastName = data2.family_name;
            const passwordHash = crypto.createHash('md5').update(config.salt + Date.now() + Math.random()).digest('hex');
            const userDuplicate = await db.collection('users').findOne({ username: username });
            const user = await db.collection('users').findOne({ email: email });
            if (user) {
                req.session.auth = user;
            } else {
                const insResult = await db.collection('users').insertOne({
                    username: userDuplicate ? `google${Date.now()}` : username,
                    email: email,
                    password: passwordHash,
                    timestamp: parseInt(Date.now() / 1000, 10),
                    status: 1,
                    realname: `${firstName} ${lastName}`,
                    source: 'google'
                })
;                if (!insResult || !insResult.result || !insResult.result.ok) {
                    return renderPage(req, res, i18n.get().__(locale, 'Cannot register your account.'));
                }
                req.session.auth = insResult.ops[0];
            }
            return renderPage(req, res, `<script type="text/javascript">window.opener.location.reload();window.close();</script>`);
        } catch (e) {
            log.error(e);
            return renderPage(req, res, i18n.get().__(locale, 'Error while processing your authorization.'));
        }
    };

    router.all('/oauth/google', process);
};