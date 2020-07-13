const path = require('path');
const Module = require('../../core/module.js');
const validation = new(require('../../core/validation.js'))();
const Router = require('co-router');
const ObjectID = require('mongodb').ObjectID;
const reviewsFields = require('./schemas/reviewsFields.js');

module.exports = function(app) {
    const log = app.get('log');
    const db = app.get('db');
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);

    const sortFields = ['name', 'status', 'timestamp'];

    const list = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || 'name';
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
                        { name: { $regex: search, $options: 'i' } }
                    ]
                };
            }
            const total = await db.collection('reviews').find(fquery).count();
            const items = await db.collection('reviews').find(fquery, { skip: skip, limit: limit, sort: sort }).toArray();
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
                status: 0
            }));
        }
        try {
            const item = await db.collection('reviews').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            return res.send(JSON.stringify({
                status: 1,
                item: {
                    _id: item._id,
                    name: item.name,
                    text: item.text,
                    status: item.status
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
        const fieldList = reviewsFields.getReviewsFields(id ? false : true);
        let fields = validation.checkRequest(req, fieldList);
        let fieldsFailed = validation.getCheckRequestFailedFields(fields);
        if (fieldsFailed.length > 0) {
            output.status = 0;
            output.fields = fieldsFailed;
            return res.send(JSON.stringify(output));
        }
        fields.text.value = fields.text.value && typeof fields.text.value === 'string' ? fields.text.value.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/\"/g, '&quot;') : '';
        try {
            let update = {
                name: fields.name.value,
                text: fields.text.value,
                status: fields.status.value
            };
            if (id) {
                update.timestamp = parseInt(Date.now() / 1000, 10);
            }
            let what = id ? { _id: new ObjectID(id) } : { name: '' };
            let updResult = await db.collection('reviews').update(what, { $set: update }, { upsert: true });
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
            did.push({ _id: new ObjectID(id) });
        }
        try {
            const delResult = await db.collection('reviews').deleteMany({
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

    const add = async(req, res) => {
        res.contentType('application/json');
        const locale = req.session.currentLocale;
        const name = req.body.name;
        if (!name || typeof name !== 'string' || !name.match(/^[^<>'\"/;`%]*$/) || name.length > 60) {
            return res.send(JSON.stringify({
                status: 0,
                field: 'name',
                error: i18n.get().__(locale, 'Name is missing or contains invalid characters')
            }));
        }
        let text = req.body.text;
        if (!text || typeof text !== 'string' || text.length > 2048) {
            return res.send(JSON.stringify({
                status: 0,
                field: 'text',
                error: i18n.get().__(locale, 'Text is missing or is too long')
            }));
        }
        text = text.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/\"/g, '&quot;');
        const captcha = req.body.captcha;
        if (!captcha || typeof captcha !== 'string' || !captcha.match(/^[0-9]{4}$/) ||
            !req.session || captcha !== req.session.captcha) {
            req.session.captcha = null;
            return res.send(JSON.stringify({
                status: 0,
                field: 'captcha',
                error: i18n.get().__(locale, 'Invalid captcha')
            }));
        }
        try {
            const what = {
                name: name,
                text: text,
                status: 0,
                timestamp: parseInt(Date.now() / 1000, 10)
            };
            let insResult = await db.collection('reviews').insert(what);
            if (!insResult || !insResult.result || !insResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    let router = Router();
    router.get('/list', list);
    router.get('/load', load);
    router.post('/save', save);
    router.post('/delete', del);
    router.post('/add', add);

    return {
        routes: router
    };
};