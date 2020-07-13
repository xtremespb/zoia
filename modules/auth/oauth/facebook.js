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
        if (!code || typeof code !== 'string' || code.length > 512) {
            return renderPage(req, res, i18n.get().__(locale, 'Invalid authorization code. Please close this window and try again.'));
        }
        try {
            const response1 = await rp(`https://graph.facebook.com/oauth/access_token?client_id=${configPlugin.facebook.id}&redirect_uri=${config.website.protocol}://${config.website.url[locale]}${config.core.prefix.auth}/oauth/facebook&client_secret=${configPlugin.facebook.secret}&code=${code}`);
            const data1 = JSON.parse(response1);
            if (!data1 || !data1.access_token) {
                return renderPage(req, res, i18n.get().__(locale, 'Could not retreive your profile information.'));
            }
            const accessToken = data1.access_token;
            const response2 = await rp(`https://graph.facebook.com/me?access_token=${accessToken}&fields=name,email`);            
            const data2 = JSON.parse(response2);
            if (!data2) {
                return renderPage(req, res, i18n.get().__(locale, 'Could not retreive your profile information.'));
            }
            const email = data2.email.replace(/\\u([\d\w]{4})/gi, (match, grp) => {
                return String.fromCharCode(parseInt(grp, 16));
            });
            const name = data2.name.replace(/\\u([\d\w]{4})/gi, (match, grp) => {
                return String.fromCharCode(parseInt(grp, 16));
            });;
            const passwordHash = crypto.createHash('md5').update(config.salt + Date.now() + Math.random()).digest('hex');
            let username = email.substring(0, email.lastIndexOf("@")).replace(/[\W_\-]+/g, '');
            let userDuplicate = await db.collection('users').findOne({ username: username });
            const user = await db.collection('users').findOne({ email: email });
            if (user) {
                req.session.auth = user;
            } else {
                const insResult = await db.collection('users').insertOne({
                    username: userDuplicate ? `fb${Date.now()}` : username,
                    email: email,
                    password: passwordHash,
                    timestamp: parseInt(Date.now() / 1000, 10),
                    status: 1,
                    realname: name,
                    source: 'facebook'
                });
                if (!insResult || !insResult.result || !insResult.result.ok) {
                    return renderPage(req, res, i18n.get().__(locale, 'Cannot register your account.'));
                }
                req.session.auth = insResult.ops[0];
            }
            return renderPage(req, res, `<script type="text/javascript">window.opener.location.reload();window.close();</script>`);
        } catch (e) {
            log.error(e);
            return renderPage(req, res, i18n.get().__(locale, 'Error while processing your authorization.' + e));
        }
    };

    router.all('/oauth/facebook', process);
};