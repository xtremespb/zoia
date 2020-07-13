const path = require('path');
const Module = require('../../core/module.js');
const validation = new(require('../../core/validation.js'))();
const Router = require('co-router');
const ObjectID = require('mongodb').ObjectID;
const usersFields = require('./schemas/usersFields.js');
const crypto = require('crypto');
const config = require('../../core/config.js');
const imageType = require('image-type');
const Jimp = require('jimp');
const fs = require('fs-extra');

let configModule;
try {
    configModule = require('./config/users.json');
} catch (e) {
    configModule = require('./config/users.dist.json');
}

module.exports = function(app) {
    const log = app.get('log');
    const db = app.get('db');
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const mailer = new(require('../../core/mailer.js'))(app);
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);

    const sortFields = ['username', 'email', 'status', 'groups'];

    const list = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || 'username';
        const sortDirection = (req.query.sortDirection === 'asc') ? 1 : -1;
        const sort = {};
        sort[sortField] = sortDirection;
        let skip = req.query.skip || 0;
        let limit = req.query.limit || 10;
        let search = req.query.search || '';
        if (typeof sortField !== 'string' || typeof skip !== 'string' || typeof limit !== 'string' || typeof search !== 'string') {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        skip = parseInt(skip, 10) || 0;
        limit = parseInt(limit, 10) || 0;
        search = search.trim();
        if (search.length < 3) {
            search = null;
        }
        let result = {
            status: 0
        };
        if (sortFields.indexOf(sortField) === -1) {
            result.failedField = 'sortField';
            return res.send(result);
        }
        let fquery = {};
        try {
            if (search) {
                fquery = {
                    $or: [
                        { username: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } },
                        { groups: { $regex: search, $options: 'i' } }
                    ]
                };
            }
            const total = await db.collection('users').find(fquery).count();
            const items = await db.collection('users').find(fquery, { skip: skip, limit: limit, sort: sort }).toArray();
            let data = {
                status: 1,
                count: items.length,
                total: total,
                items: items
            };
            res.send(JSON.stringify(data));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const load = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const id = req.query.id;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const item = await db.collection('users').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            return res.send(JSON.stringify({
                status: 1,
                item: {
                    _id: item._id,
                    username: item.username,
                    email: item.email,
                    status: item.status,
                    groups: item.groups
                }
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const save = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const id = req.body.id;
        if (id && (typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/))) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let output = {};
        const fieldList = usersFields.getUsersFields(id ? false : true, config.core && config.core.regexp && config.core.regexp.username ? JSON.stringify(config.core.regexp) : '{"username":"^[A-Za-z0-9_\\\\-]+$"}');
        let fields = validation.checkRequest(req, fieldList);
        let fieldsFailed = validation.getCheckRequestFailedFields(fields);
        if (fieldsFailed.length > 0) {
            output.status = 0;
            output.fields = fieldsFailed;
            return res.send(JSON.stringify(output));
        }
        try {
            if (id) {
                const user = await db.collection('users').findOne({ _id: new ObjectID(id) });
                if (user === null) {
                    output.status = -1;
                    output.fields = ['username'];
                    return res.send(JSON.stringify(output));
                }
                if (config.demo && user.username === 'admin') {
                    output.status = -3;
                    output.fields = ['username'];
                    return res.send(JSON.stringify(output));
                }
                if (fields.username.value !== user.username) {
                    const userDuplicate = await db.collection('users').findOne({ username: fields.username.value });
                    if (userDuplicate) {
                        output.status = -2;
                        output.fields = ['username'];
                        return res.send(JSON.stringify(output));
                    }
                }
            } else {
                const userDuplicate = await db.collection('users').findOne({ username: fields.username.value });
                if (userDuplicate) {
                    output.status = -2;
                    output.fields = ['username'];
                    return res.send(JSON.stringify(output));
                }
            }
            let update = {
                username: fields.username.value,
                email: fields.email.value,
                status: fields.status.value,
                groups: fields.groups.value
            };
            if (fields.password.value) {
                update.password = crypto.createHash('md5').update(config.salt + fields.password.value).digest('hex');
            }
            let what = id ? { _id: new ObjectID(id) } : { username: fields.username.value };
            if (!id) {
                update.timestamp = parseInt(Date.now() / 1000, 10);
            }
            let updResult = await db.collection('users').update(what, { $set: update }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                output.status = 0;
                return res.send(JSON.stringify(output));
            }
            output.status = 1;
            return res.send(JSON.stringify(output));
        } catch (e) {
            output.status = 0;
            log.error(e);
            res.send(JSON.stringify(output));
        }
    };

    const del = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let output = {};
        let ids = req.body['id'];
        if (!ids || (typeof ids !== 'object' && typeof ids !== 'string') || !ids.length) {
            output.status = -1;
            return res.send(JSON.stringify(output));
        }
        if (typeof ids === 'string') {
            const id = ids;
            ids = [];
            ids.push(id);
        }
        let did = [];
        for (let i in ids) {
            const id = ids[i];
            if (!id.match(/^[a-f0-9]{24}$/)) {
                output.status = -2;
                return res.send(JSON.stringify(output));
            }
            if (config.demo) {
                did.push({
                    $and: [
                        { _id: new ObjectID(id) }, { username: { $ne: 'admin' } }
                    ]
                });
            } else {
                did.push({ _id: new ObjectID(id) });
            }
        }
        try {
            const delResult = await db.collection('users').deleteMany({
                $or: did
            });
            if (!delResult || !delResult.result || !delResult.result.ok || delResult.result.n !== ids.length) {
                output.status = -3;
                return res.send(JSON.stringify(output));
            }
            output.status = 1;
            res.send(JSON.stringify(output));
        } catch (e) {
            output.status = 0;
            log.error(e);
            res.send(JSON.stringify(output));
        }
    };

    const _buf = (image) => {
        return new Promise(function(resolve) {
            image.getBuffer(Jimp.MIME_JPEG, function(err, buf) {
                resolve(buf);
            });
        });
    };

    const pictureUpload = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        if (!req.files || typeof req.files !== 'object' || !req.files['files[]'] || !req.files['files[]'].name || !req.files['files[]'].data ||
            !req.files['files[]'].data.length || req.files['files[]'].data.length > configModule.picture.maxSizeMB * 1048576) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        const file = req.files['files[]'];
        const dir = path.join(__dirname, 'static', 'pictures');
        try {
            let imgType = imageType(file.data);
            if (imgType && (imgType.ext === 'png' || imgType.ext === 'jpg' || imgType.ext === 'jpeg' || imgType.ext === 'bmp')) {
                try {
                    let img = await Jimp.read(file.data);
                    if (img) {
                        img.cover(configModule.picture.large.width, configModule.picture.large.height, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
                        img.quality(60);
                        let bufLarge = await _buf(img);
                        if (bufLarge) {
                            await fs.writeFile(path.join(dir, 'large_' + req.session.auth._id + '.jpg'), bufLarge);
                        }
                        img.cover(configModule.picture.small.width, configModule.picture.small.height, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
                        img.quality(60);
                        let bufSmall = await _buf(img);
                        if (bufSmall) {
                            await fs.writeFile(path.join(dir, 'small_' + req.session.auth._id + '.jpg'), bufSmall);
                        }
                    } else {
                        return res.send(JSON.stringify({
                            status: -5
                        }));
                    }
                    let updResult = await db.collection('users').update({ _id: new ObjectID(req.session.auth._id) }, { $set: { avatarSet: true } }, { upsert: true });
                    if (!updResult || !updResult.result || !updResult.result.ok) {
                        output.status = -6;
                        return res.send(JSON.stringify(output));
                    }
                    return res.send(JSON.stringify({
                        status: 1,
                        pictureURL: '/users/static/pictures/large_' + req.session.auth._id + '.jpg'
                    }));
                } catch (e) {
                    log.error(e);
                    return res.send(JSON.stringify({
                        status: -4
                    }));
                }
            } else {
                return res.send(JSON.stringify({
                    status: -6
                }));
            }
        } catch (e) {
            return res.send(JSON.stringify({
                status: -3
            }));
        }
    };

    const pictureDelete = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const large = path.join(__dirname, 'static', 'pictures', 'large_' + req.session.auth._id + '.jpg');
            const small = path.join(__dirname, 'static', 'pictures', 'small_' + req.session.auth._id + '.jpg');
            try {
                fs.remove(large);
            } catch (e) {
                // Ignore
            }
            try {
                fs.remove(small);
            } catch (e) {
                // Ignore
            }
            let updResult = await db.collection('users').update({ _id: new ObjectID(req.session.auth._id)}, { $set: { avatarSet: null } }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                output.status = -6;
                return res.send(JSON.stringify(output));
            }
            return res.send(JSON.stringify({
                status: 1,
                pictureURL: '/users/static/pictures/large_default.png'
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const removeSpecialCharacters = (str) => {
        const lower = str.toLowerCase();
        const upper = str.toUpperCase();
        let res = '';
        for (let i = 0; i < lower.length; ++i) {
            if (lower[i] !== upper[i] || lower[i].trim() === '' || lower[i] === '.' || lower[i].match(/[\u{0080}-\u{FFFF}]/gu)) {
                res += str[i];
            }
        }
        return res;
    };

    const profileCommonSave = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let realname = req.body.realname;
        if (realname && (typeof realname !== 'string' || realname.length > 48)) {
            return res.send(JSON.stringify({
                status: -2,
            }));
        }
        realname = realname.length ? realname : '';
        // realname = realname.replace(/[\n\r\t\"]+/gm, '');
        realname = removeSpecialCharacters(realname);
        try {
            let updResult = await db.collection('users').update({ _id: new ObjectID(req.session.auth._id) }, { $set: { realname: realname } }, { upsert: false });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: -1
            }));
        }
    };

    const changePassword = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const passwordCurrent = req.body.passwordCurrent;
        const passwordNew = req.body.passwordNew;
        if (!passwordCurrent || typeof passwordCurrent !== 'string' || passwordCurrent.length > 50 || passwordCurrent < 5 ||
            !passwordNew || typeof passwordNew !== 'string' || passwordNew.length > 50 || passwordNew < 8) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        const passwordCurrentHash = crypto.createHash('md5').update(config.salt + passwordCurrent).digest('hex');
        if (passwordCurrentHash !== req.session.auth.password) {
            return res.send(JSON.stringify({
                status: -3
            }));
        }
        const passwordNewHash = crypto.createHash('md5').update(config.salt + passwordNew).digest('hex');
        try {
            let updResult = await db.collection('users').update({ _id: new ObjectID(req.session.auth._id) }, { $set: { password: passwordNewHash } }, { upsert: false });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            req.session.auth = null;
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: -1
            }));
        }
    };

    const randomFixedInteger = (length) => {
        return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1));
    };

    const changeEmailStep1 = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const email = req.body.emailNew;
        const locale = req.session.currentLocale;
        if (!email || typeof email !== 'string' || email.length > 129 || email.length < 6 ||
            !email.match(/^(?:[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?(?:\.(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?)*$/) ||
            email === req.session.auth.email) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const code1 = randomFixedInteger(6);
            const code2 = randomFixedInteger(6);
            let updResult = await db.collection('users').update({ _id: new ObjectID(req.session.auth._id) }, {
                $set: {
                    emailChange: {
                        email: email.toLowerCase(),
                        code1: String(code1),
                        code2: String(code2),
                    },
                    emailChangeTry: 0
                }
            }, { upsert: false });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            let mailCode1 = await render.file('mail_code.html', {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                email: req.session.auth.email,
                code: code1
            });
            let mailCode2 = await render.file('mail_code.html', {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                email: email,
                code: code2
            });
            await mailer.send(req, req.session.auth.email, i18n.get().__(locale, 'Change E-Mail Address'), mailCode1);
            await mailer.send(req, email, i18n.get().__(locale, 'Change E-Mail Address'), mailCode2);
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: -1
            }));
        }
    };

    const changeEmailStep2 = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const code1 = req.body.code1;
        const code2 = req.body.code2;
        if (!code1 || typeof code1 !== 'string' || !code1.match(/^[0-9]{1,6}$/) ||
            !code2 || typeof code2 !== 'string' || !code2.match(/^[0-9]{1,6}$/)) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            if (req.session.auth.emailChangeTry && req.session.auth.emailChangeTry > 5) {
                req.session.auth = null;
                return res.send(JSON.stringify({
                    status: -4
                }));
            }
            if (!req.session.auth.emailChange || !req.session.auth.emailChange.email ||
                req.session.auth.emailChange.code1 !== code1 ||
                req.session.auth.emailChange.code2 !== code2) {
                let updResult = await db.collection('users').update({ _id: new ObjectID(req.session.auth._id) }, {
                    $inc: {
                        emailChangeTry: 1
                    }
                }, { upsert: false });
                if (!updResult || !updResult.result || !updResult.result.ok) {
                    return res.send(JSON.stringify({
                        status: -2
                    }));
                }
                return res.send(JSON.stringify({
                    status: -3
                }));
            }
            let updResult = await db.collection('users').update({ _id: new ObjectID(req.session.auth._id) }, {
                $set: {
                    email: req.session.auth.emailChange.email,
                    emailChange: null,
                    emailChangeTry: null
                }
            }, { upsert: false });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: -5
                }));
            }
            req.session.auth = null;
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: -1
            }));
        }
    };

    let router = Router();
    router.get('/list', list);
    router.get('/load', load);
    router.post('/save', save);
    router.post('/delete', del);
    router.post('/picture/upload', pictureUpload);
    router.post('/picture/delete', pictureDelete);
    router.post('/profile/common/save', profileCommonSave);
    router.post('/profile/password/save', changePassword);
    router.post('/profile/email/step1', changeEmailStep1);
    router.post('/profile/email/step2', changeEmailStep2);

    return {
        routes: router
    };
};