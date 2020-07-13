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
        if (!code || typeof code !== 'string' || !code.match(/^[0-9a-f]{1,128}$/)) {
            return renderPage(req, res, i18n.get().__(locale, 'Invalid authorization code. Please close this window and try again.'));
        }
        try {
            const response1 = await rp(`https://oauth.vk.com/access_token?client_id=${configPlugin.vk.id}&client_secret=${configPlugin.vk.secret}&code=${code}&redirect_uri=${config.website.protocol}://${config.website.url[locale]}${config.core.prefix.auth}/oauth/vk`);
            const data1 = JSON.parse(response1);
            if (!data1 || !data1.email || !data1.user_id) {
                return renderPage(req, res, i18n.get().__(locale, 'Could not retreive your e-mail address.'));
            }
            const accessToken = data1.access_token;
            const userID = data1.user_id;
            const response2 = await rp(`https://api.vk.com/method/users.get?uids=${userID}&fields=first_name,last_name,email&access_token=${accessToken}&v=5.78`);
            const data2 = JSON.parse(response2);
            if (!data2 || !data2.response || !data2.response.length) {
                return renderPage(req, res, i18n.get().__(locale, 'Could not retreive your profile information.'));
            }
            const email = data1.email;
            const firstName = data2.response[0].first_name;
            const lastName = data2.response[0].last_name;
            const passwordHash = crypto.createHash('md5').update(config.salt + Date.now() + Math.random()).digest('hex');
            let username = email.substring(0, email.lastIndexOf("@")).replace(/[\W_\-]+/g, '');
            let userDuplicate = await db.collection('users').findOne({ username: username });
            if (userDuplicate) {
                username = String(userID);
                userDuplicate = await db.collection('users').findOne({ username: username });
            }
            const user = await db.collection('users').findOne({ email: email });
            if (user) {
                req.session.auth = user;
            } else {
                const insResult = await db.collection('users').insertOne({
                    username: userDuplicate ? `vk${Date.now()}` : username,
                    email: email,
                    password: passwordHash,
                    timestamp: parseInt(Date.now() / 1000, 10),
                    status: 1,
                    realname: `${firstName} ${lastName}`,
                    source: 'vk'
                });
                if (!insResult || !insResult.result || !insResult.result.ok) {
                    return renderPage(req, res, i18n.get().__(locale, 'Cannot register your account.'));
                }
                req.session.auth = insResult.ops[0];
            }
            return renderPage(req, res, `<script type="text/javascript">window.opener.location.reload();window.close();</script>`);
        } catch (e) {
            log.error(e);
            return renderPage(req, res, i18n.get().__(locale, 'Error while processing your authorization.'  + e));
        }
    };

    router.all('/oauth/vk', process);
};