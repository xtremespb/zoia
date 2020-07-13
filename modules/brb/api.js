const Module = require('../../core/module.js');
const validation = new(require('../../core/validation.js'))();
const Router = require('co-router');
const ObjectID = require('mongodb').ObjectID;
const brbFields = require('./schemas/brbFields.js');
const rp = require('request-promise');
const moment = require('moment');

let configModule;
try {
    configModule = require('./config/brb.json');
} catch (e) {
    configModule = require('./config/brb.dist.json');
}

module.exports = function (app) {
    const log = app.get('log');
    const db = app.get('db');

    const sortFields = ['username', 'email', 'status', 'groups'];

    const list = async (req, res) => {
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
                    $or: [{
                            username: {
                                $regex: search,
                                $options: 'i'
                            }
                        },
                        {
                            email: {
                                $regex: search,
                                $options: 'i'
                            }
                        },
                        {
                            groups: {
                                $regex: search,
                                $options: 'i'
                            }
                        }
                    ]
                };
            }
            const total = await db.collection('users').find(fquery).count();
            const items = await db.collection('users').find(fquery, {
                skip: skip,
                limit: limit,
                sort: sort
            }).toArray();
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

    const load = async (req, res) => {
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
            const item = await db.collection('users').findOne({
                _id: new ObjectID(id)
            });
            if (!item) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            return res.send(JSON.stringify({
                status: 1,
                item: {
                    _id: item._id,
                    portfolioid: item.portfolioid
                }
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const save = async (req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const id = req.body.id;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let output = {};
        const fieldList = brbFields.getUsersFields();
        let fields = validation.checkRequest(req, fieldList);
        let fieldsFailed = validation.getCheckRequestFailedFields(fields);
        if (fieldsFailed.length > 0) {
            output.status = 0;
            output.fields = fieldsFailed;
            return res.send(JSON.stringify(output));
        }
        try {
            let updResult = await db.collection('users').update({
                _id: new ObjectID(id)
            }, {
                $set: {
                    portfolioid: fields.portfolioid.value
                }
            }, {
                upsert: true
            });
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

    const getChartData = async (req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        if (!req.session.auth.portfolioid) {
            return res.send(JSON.stringify({
                status: 0,
                error: 'No portfolio ID'
            }));
        }
        try {
            let apiChartData;
            const cache = await db.collection('brb_cache').findOne({
                pid: req.session.auth.portfolioid,
                request: 'getChartData'
            });
            if (cache) {
                apiChartData = typeof cache.data === 'string' ? JSON.parse(cache.data) : cache.data;
            } else {
                let response;
                try {
                    response = JSON.parse(await rp(`${configModule.api.url}/getChartData?id=${req.session.auth.portfolioid}`));
                } catch (e) {
                    return res.send(JSON.stringify({
                        status: 0
                    }));
                }
                if (!response || response.status !== 1) {
                    return res.send(JSON.stringify({
                        status: 0
                    }));
                }
                apiChartData = JSON.parse(response.chartData);
                for (let i in apiChartData) {
                    apiChartData[i].time_snap = moment(apiChartData[i].time_snap).unix();
                }
                apiChartData = Array.from(new Set(apiChartData));
                await db.collection('brb_cache').update({
                    pid: req.session.auth.portfolioid,
                    request: 'getChartData'
                }, {
                    pid: req.session.auth.portfolioid,
                    request: 'getChartData',
                    timestamp: new Date(),
                    data: apiChartData
                }, {
                    upsert: true
                });
            }
            return res.send(JSON.stringify({
                status: 1,
                chartData: apiChartData
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    let router = Router();
    router.get('/list', list);
    router.get('/load', load);
    router.post('/save', save);
    router.get('/getChartData', getChartData);

    return {
        routes: router
    };
};