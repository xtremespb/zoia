/* eslint max-len: 0 */

const path = require('path');
const Module = require('../../core/module.js');
const Router = require('co-router');
const crypto = require('crypto');
const config = require('../../core/config.js');
const fs = require('fs-extra');

let configModule;
try {
    configModule = require('./config/support.json');
} catch (e) {
    configModule = require('./config/support.dist.json');
}

module.exports = function(app) {
    const log = app.get('log');
    const db = app.get('db');
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const mailer = new(require('../../core/mailer.js'))(app);
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const security = new(require('../../core/security.js'))(app);

    const sortFields = ['_id', 'status', 'timestamp', 'username', 'title', 'priority'];

    const list = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || 'timestamp';
        const sortDirection = (req.query.sortDirection === 'asc') ? 1 : -1;
        const sort = {
            unreadSupport: -1
        };
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
                        { specialist: { $regex: search, $options: 'i' } },
                        { title: { $regex: search, $options: 'i' } }
                    ]
                };
                if (search.match(/^[0-9]+$/)) {
                    fquery.$or.push({ _id: parseInt(search, 10) });
                }
            }
            const total = await db.collection('support').find(fquery).count();
            const items = await db.collection('support').find(fquery, { skip: skip, limit: limit, sort: sort, projection: { _id: 1, timestamp: 1, title: 1, username: 1, status: 1, priority: 1, specialist: 1, unreadSupport: 1 } }).toArray();
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

    const frontendList = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || 'timestamp';
        const sortDirection = (req.query.sortDirection === 'asc') ? 1 : -1;
        const sort = {
            unreadUser: -1
        };
        sort[sortField] = sortDirection;
        let skip = req.query.skip || 0;
        let limit = req.query.limit || 10;
        if (typeof sortField !== 'string' || typeof skip !== 'string' || typeof limit !== 'string') {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        skip = parseInt(skip, 10) || 0;
        limit = parseInt(limit, 10) || 0;
        let result = {
            status: 0
        };
        if (sortFields.indexOf(sortField) === -1) {
            result.failedField = 'sortField';
            return res.send(result);
        }
        let fquery = {
            username: req.session.auth.username
        };
        try {
            const total = await db.collection('support').find(fquery).count();
            const items = await db.collection('support').find(fquery, { skip: skip, limit: limit, sort: sort, projection: { _id: 1, timestamp: 1, title: 1, username: 1, status: 1, priority: 1, unreadUser: 1 } }).toArray();
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

    const loadRequest = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const id = req.query.id;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const data = await db.collection('support').findOne({ _id: parseInt(id, 10) });
            if (!data) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (!data.specialist) {
                let updResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: { specialist: req.session.auth.username } }, { upsert: false });
                if (!updResult || !updResult.result || !updResult.result.ok) {
                    return res.send(JSON.stringify({
                        status: 0
                    }));
                }
                data.specialist = req.session.auth.username;
            }
            let updUnreadResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: { unreadSupport: false } }, { upsert: false });
            if (!updUnreadResult || !updUnreadResult.result || !updUnreadResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            // data.title = data.title.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;');
            if (data.messages) {
                for (let i in data.messages) {
                    data.messages[i].message = data.messages[i].message.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;');
                }
            }
            res.send(JSON.stringify({
                status: 1,
                data: data
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const deleteRequest = async(req, res) => {
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
            if (!id.match(/^[0-9]{1,9999999999999}$/)) {
                output.status = -2;
                return res.send(JSON.stringify(output));
            }
            did.push({ _id: parseInt(id, 10) });
            try {
                await fs.remove(path.join(__dirname, 'storage', String(id)));
            } catch (e) {
                log.error(e);
            }
        }
        try {
            const delResult = await db.collection('support').deleteMany({
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

    const saveMessage = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const id = req.body.id;
        const msgId = req.body.msgId;
        const msg = req.body.msg;
        const uprefix = i18n.getLanguageURLPrefix(req);
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/) ||
            (msgId && (typeof msgId !== 'string' || !msgId.match(/^[0-9]+$/))) ||
            !msg || typeof id !== 'string' || msg.lentgh > 4096) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const data = await db.collection('support').findOne({ _id: parseInt(id, 10) });
            if (!data) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            const user = await db.collection('users').findOne({ username: data.username });
            if (!user) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let messages = data.messages || [];
            let message;
            if (msgId) {
                for (let i in messages) {
                    if (parseInt(messages[i].id, 10) === parseInt(msgId, 10)) {
                        messages[i].message = msg;
                        message = messages[i];
                        break;
                    }
                }
                if (!message) {
                    return res.send(JSON.stringify({
                        status: 0
                    }));
                }
            } else {
                message = {
                    username: req.session.auth.username,
                    id: Math.floor(new Date().valueOf() * Math.random()),
                    timestamp: parseInt(Date.now() / 1000, 10),
                    message: msg
                };
                messages.push(message);
            }
            let setData = { messages: messages };
            if (!msgId) {
                setData.unreadUser = true;
            }
            let updResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: setData }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (!data.unreadUser && !msgId && user.email) {
                let mailHTMLUser = await render.file('mail_newmessage_user.html', {
                    i18n: i18n.get(),
                    locale: locale,
                    lang: JSON.stringify(i18n.get().locales[locale]),
                    config: config,
                    url: config.website.protocol + '://' + config.website.url[locale] + uprefix + '/support?action=view&id=' + id,
                    id: id,
                    title: data.title.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;'),
                    message: msg.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;').replace(/\n/gm, '<br>')
                });
                await mailer.send(req, user.email, i18n.get().__(locale, 'Support Ticket Reply'), mailHTMLUser);
            }
            res.send(JSON.stringify({
                status: 1,
                message: message
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const requestPickupRelease = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const pickup = req.body.pickup ? true : false;
        const id = req.body.id;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            let updResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: { specialist: pickup ? req.session.auth.username : '' } }, { upsert: false });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            res.send(JSON.stringify({
                status: 1,
                specialist: pickup ? req.session.auth.username : ''
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const saveRequestCommon = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const id = req.body.id;
        const title = req.body.title;
        const status = req.body.status;
        const priority = req.body.priority;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/) ||
            !status || (status !== '0' && status !== '1' && status !== '2') ||
            !priority || (priority !== '0' && priority !== '1' && priority !== '2' && priority !== '3') ||
            !title || typeof title !== 'string' || title.lentgh > 512) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            let updResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: { title: title, status: parseInt(status, 10), priority: parseInt(priority, 10) } }, { upsert: false });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            res.send(JSON.stringify({
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

    const deleteMessage = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const id = req.body.id;
        const msgId = req.body.msgId;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/) ||
            !msgId || typeof msgId !== 'string' || !msgId.match(/^[0-9]+$/)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const data = await db.collection('support').findOne({ _id: parseInt(id, 10) });
            if (!data) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let messages = data.messages || [];
            let num;
            for (let i in messages) {
                if (parseInt(messages[i].id, 10) === parseInt(msgId, 10)) {
                    num = i;
                    break;
                }
            }
            if (!num) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            messages.splice(num, 1);
            let updResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: { messages: messages } }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            res.send(JSON.stringify({
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

    const attachmentUpload = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const id = req.body.id;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/) ||
            !req.files || typeof req.files !== 'object' || !req.files['files[]'] || !req.files['files[]'].name || !req.files['files[]'].data ||
            !req.files['files[]'].data.length || req.files['files[]'].data.length > configModule.maxAttachmentSizeMB * 1048576) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const file = req.files['files[]'];
        const filename = Module.sanitizeFilename(file.name);
        const dir = path.join(__dirname, 'storage', id);
        try {
            const data = await db.collection('support').findOne({ _id: parseInt(id, 10) });
            if (!data) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (data.files) {
                let found;
                for (let i in data.files) {
                    if (data.files[i].filename === filename) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    return res.send(JSON.stringify({
                        status: 0,
                        error: i18n.get().__(locale, 'File with such name already exists.')
                    }));
                }
            }
            const filenameHash = crypto.createHash('md5').update(String(Date.now()) + filename).digest('hex');
            await fs.ensureDir(dir);
            await fs.writeFile(path.join(__dirname, dir, filenameHash), req.files['files[]'].data);
            if (!data.files) {
                data.files = [];
            }
            const fid = crypto.createHash('md5').update(config.salt + String(Date.now())).digest('hex');
            data.files.push({
                id: fid,
                filename: filename,
                source: filenameHash,
                mime: req.files['files[]'].mimetype,
                encoding: req.files['files[]'].encoding,
                ext: path.extname(filename)
            });
            let updResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: { files: data.files } }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            res.send(JSON.stringify({
                files: data.files,
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

    const attachmentDownload = async(req, res, next) => {
        if (!Module.isAuthorized(req)) {
            return next();
        }
        const id = req.query.id;
        const fid = req.query.fid;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/) ||
            !fid || typeof fid !== 'string' || !fid.match(/^[a-f0-9]{32}$/)) {
            return next();
        }
        try {
            const data = await db.collection('support').findOne({ _id: parseInt(id, 10) });
            if (!data || (data.username !== req.session.auth.username && !Module.isAuthorizedAdmin(req))) {
                return next();
            }
            let file;
            if (data.files) {
                for (let i in data.files) {
                    if (data.files[i].id === fid) {
                        file = data.files[i];
                    }
                }
            }
            if (!file) {
                return next();
            }
            res.download(path.join(__dirname, 'storage', String(id), file.source), file.filename);
        } catch (e) {
            log.error(e);
            return next();
        }
    };

    const deleteAttachment = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const id = req.body.id;
        const fid = req.body.fid;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/) ||
            !fid || typeof fid !== 'string' || !fid.match(/^[a-f0-9]{32}$/)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const data = await db.collection('support').findOne({ _id: parseInt(id, 10) });
            if (!data) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let files = data.files || [];
            let num;
            let source;
            for (let i in files) {
                if (files[i].id === fid) {
                    num = i;
                    source = files[i].source;
                    break;
                }
            }
            if (!num) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            await fs.unlink(path.join(__dirname, 'storage', String(data._id), source));
            files.splice(num, 1);
            let updResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: { files: files } }, { upsert: false });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            res.send(JSON.stringify({
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

    const frontendCreateRequest = async(req, res) => {
        res.contentType('application/json');
        const locale = req.session.currentLocale;
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const title = req.body.title;
        const message = req.body.message;
        const priority = req.body.priority;
        const uprefix = i18n.getLanguageURLPrefix(req);
        if (!priority || (priority !== '0' && priority !== '1' && priority !== '2' && priority !== '3') ||
            !title || typeof title !== 'string' || title.lentgh < 2 || title.lentgh > 128 ||
            !message || typeof message !== 'string' || message.lentgh < 2 || message.lentgh > 4096) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const allowed = await security.checkActionInterval(req, 'createSupportRequest', 10);
            if (!allowed) {
                return res.send(JSON.stringify({
                    status: 0,
                    error: i18n.get().__(locale, 'Please wait some time before you create another ticket')
                }));
            }
            const incr = await db.collection('support_counters').findAndModify({ _id: 'requests' }, [], { $inc: { seq: 1 } }, { new: true, upsert: true });
            if (!incr || !incr.value || !incr.value.seq) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            const id = incr.value.seq;
            const timestamp = parseInt(Date.now() / 1000, 10);
            let updResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: { title: title, status: 0, priority: parseInt(priority, 10), messages: [{ username: req.session.auth.username, id: Math.floor(new Date().valueOf() * Math.random()), timestamp: timestamp, message: message }], unreadUser: false, unreadSupport: true, timestamp: timestamp, username: req.session.auth.username } }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let mailHTMLUser = await render.file('mail_newticket_user.html', {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                url: config.website.protocol + '://' + config.website.url[locale] + uprefix + '/support?action=view&id=' + id,
                id: id
            });
            let mailHTMLAdmin = await render.file('mail_newticket_admin.html', {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                id: id,
                title: title.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;'),
                username: req.session.auth.username
            });
            await mailer.send(req, req.session.auth.email, i18n.get().__(locale, 'New Support Ticket'), mailHTMLUser);
            await mailer.send(req, config.website.email.feedback, i18n.get().__(locale, 'New Support Ticket'), mailHTMLAdmin);
            res.send(JSON.stringify({
                status: 1,
                id: id
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const frontendLoadRequest = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const id = req.query.id;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const data = await db.collection('support').findOne({ _id: parseInt(id, 10) });
            if (!data || data.username !== req.session.auth.username) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            data.title = data.title.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;');
            if (data.messages) {
                for (let i in data.messages) {
                    data.messages[i].message = data.messages[i].message.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;');
                }
            }
            let updResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: { unreadUser: false } }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            res.send(JSON.stringify({
                status: 1,
                data: data
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const frontendAttachmentUpload = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const id = req.body.id;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/) ||
            !req.files || typeof req.files !== 'object' || !req.files['files[]'] || !req.files['files[]'].name || !req.files['files[]'].data ||
            !req.files['files[]'].data.length || req.files['files[]'].data.length > configModule.maxAttachmentSizeMB * 1048576) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const file = req.files['files[]'];
        const filename = Module.sanitizeFilename(file.name);
        const dir = path.join(__dirname, 'storage', id);
        try {
            const data = await db.collection('support').findOne({ _id: parseInt(id, 10) });
            if (!data || (!data.username !== req.session.auth.username && !Module.isAuthorizedAdmin(req))) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (data.files) {
                let found;
                for (let i in data.files) {
                    if (data.files[i].filename === filename) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    return res.send(JSON.stringify({
                        status: 0,
                        error: i18n.get().__(locale, 'File with such name already exists.')
                    }));
                }
                if (configModule.maxAttachmentCount && data.files.length > configModule.maxAttachmentCount) {
                    return res.send(JSON.stringify({
                        status: 0,
                        files: data.files,
                        error: i18n.get().__(locale, 'Too many files for this ticket.')
                    }));
                }
            }
            const filenameHash = crypto.createHash('md5').update(String(Date.now()) + filename).digest('hex');
            await fs.ensureDir(dir);
            await fs.writeFile(path.join(__dirname, dir, filenameHash), req.files['files[]'].data);
            if (!data.files) {
                data.files = [];
            }
            const fid = crypto.createHash('md5').update(config.salt + String(Date.now())).digest('hex');
            data.files.push({
                id: fid,
                filename: filename,
                source: filenameHash,
                mime: req.files['files[]'].mimetype,
                encoding: req.files['files[]'].encoding,
                ext: path.extname(filename)
            });
            let updResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: { files: data.files } }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            res.send(JSON.stringify({
                files: data.files,
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

    const frontendDeleteAttachment = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const id = req.body.id;
        const fid = req.body.fid;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/) ||
            !fid || typeof fid !== 'string' || !fid.match(/^[a-f0-9]{32}$/)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const data = await db.collection('support').findOne({ _id: parseInt(id, 10) });
            if (!data || (!data.username !== req.session.auth.username && !Module.isAuthorizedAdmin(req))) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let files = data.files || [];
            let num;
            let source;
            for (let i in files) {
                if (files[i].id === fid) {
                    num = i;
                    source = files[i].source;
                    break;
                }
            }
            if (!num) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            await fs.unlink(path.join(__dirname, 'storage', String(data._id), source));
            files.splice(num, 1);
            let updResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: { files: files } }, { upsert: false });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            res.send(JSON.stringify({
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

    const frontendSaveMessage = async(req, res) => {
        res.contentType('application/json');
        const locale = req.session.currentLocale;
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const id = req.body.id;
        const msg = req.body.message;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/) ||
            !msg || typeof id !== 'string' || msg.length < 2 || msg.lentgh > 4096) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const allowed = await security.checkActionInterval(req, 'createSupportMessage', 5);
            if (!allowed) {
                return res.send(JSON.stringify({
                    status: 0,
                    error: i18n.get().__(locale, 'Please wait some time before you create another message')
                }));
            }
            const data = await db.collection('support').findOne({ _id: parseInt(id, 10) });
            if (!data || (data.username !== req.session.auth.username && !Module.isAuthorizedAdmin(req))) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            let messages = data.messages || [];
            const message = {
                username: req.session.auth.username,
                id: Math.floor(new Date().valueOf() * Math.random()),
                timestamp: parseInt(Date.now() / 1000, 10),
                message: msg
            };
            messages.push(message);
            let updResult = await db.collection('support').update({ _id: parseInt(id, 10) }, { $set: { messages: messages, unreadSupport: true } }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: -3
                }));
            }
            if (!data.unreadSupport) {
                let mailHTMLAdmin = await render.file('mail_newmessage_admin.html', {
                    i18n: i18n.get(),
                    locale: locale,
                    lang: JSON.stringify(i18n.get().locales[locale]),
                    config: config,
                    id: id,
                    title: data.title.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;'),
                    message: msg.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;').replace(/\n/gm, '<br>')
                });
                await mailer.send(req, config.website.email.feedback, i18n.get().__(locale, 'Support Ticket Reply'), mailHTMLAdmin);
            }
            res.send(JSON.stringify({
                status: 1,
                message: message
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
    router.get('/list', list);
    router.get('/frontend/list', frontendList);
    router.get('/request/load', loadRequest);
    router.post('/request/message/edit', saveMessage);
    router.post('/request/common/save', saveRequestCommon);
    router.post('/request/message/delete', deleteMessage);
    router.post('/request/attachment/delete', deleteAttachment);
    router.post('/request/upload', attachmentUpload);
    router.get('/download', attachmentDownload);
    router.post('/request/delete', deleteRequest);
    router.post('/frontend/create', frontendCreateRequest);
    router.get('/frontend/load', frontendLoadRequest);
    router.post('/frontend/upload', frontendAttachmentUpload);
    router.post('/frontend/attachment/delete', frontendDeleteAttachment);
    router.post('/frontend/message', frontendSaveMessage);
    router.post('/request/pickup', requestPickupRelease);

    return {
        routes: router
    };
};