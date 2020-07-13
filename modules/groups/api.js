const Module = require('../../core/module.js');
const validation = new(require('../../core/validation.js'))();
const Router = require('co-router');
const ObjectID = require('mongodb').ObjectID;
const groupsFields = require('./schemas/groupsFields.js');

module.exports = function(app) {
    const log = app.get('log');
    const db = app.get('db');

    const sortFields = ['groupname', 'status'];

    const list = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || 'groupname';
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
                        { groupname: { $regex: search, $options: 'i' } }
                    ]
                };
            }
            const total = await db.collection('groups').find(fquery).count();
            const items = await db.collection('groups').find(fquery, { skip: skip, limit: limit, sort: sort }).toArray();
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
            const item = await db.collection('groups').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            return res.send(JSON.stringify({
                status: 1,
                item: {
                    _id: item._id,
                    groupname: item.groupname,
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
        const fieldList = groupsFields.getGroupsFields(id ? false : true);
        let fields = validation.checkRequest(req, fieldList);
        let fieldsFailed = validation.getCheckRequestFailedFields(fields);
        if (fieldsFailed.length > 0) {
            output.status = 0;
            output.fields = fieldsFailed;
            return res.send(JSON.stringify(output));
        }
        try {
            if (id) {
                const group = await db.collection('groups').findOne({ _id: new ObjectID(id) });
                if (group === null) {
                    output.status = -1;
                    output.fields = ['groupname'];
                    return res.send(JSON.stringify(output));
                }
                if (fields.groupname.value !== group.groupname) {
                    const groupDuplicate = await db.collection('groups').findOne({ groupname: fields.groupname.value });
                    if (groupDuplicate) {
                        output.status = -2;
                        output.fields = ['groupname'];
                        return res.send(JSON.stringify(output));
                    }
                }
            } else {
                const groupDuplicate = await db.collection('groups').findOne({ groupname: fields.groupname.value });
                if (groupDuplicate) {
                    output.status = -2;
                    output.fields = ['groupname'];
                    return res.send(JSON.stringify(output));
                }
            }
            let update = {
                groupname: fields.groupname.value,
                status: fields.status.value
            };
            let what = id ? { _id: new ObjectID(id) } : { groupname: fields.groupname.value };
            let updResult = await db.collection('groups').update(what, { $set: update }, { upsert: true });
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
            const delResult = await db.collection('groups').deleteMany({
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

    let router = Router();
    router.get('/list', list);
    router.get('/load', load);
    router.post('/save', save);
    router.post('/delete', del);

    return {
        routes: router
    };
};