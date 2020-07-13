/* eslint max-len: 0 */

const path = require('path');
const Module = require('../../core/module.js');
const validation = new(require('../../core/validation.js'))();
const Router = require('co-router');
const ObjectID = require('mongodb').ObjectID;
const config = require('../../core/config.js');
const accountFields = require('./schemas/accountFields.js');
const newAccountFields = require('./schemas/newAccountFields.js');
const fs = require('fs');
const plugins = fs.readdirSync(`${__dirname}/plugins_hosting`);
for (let i in plugins) {
    plugins[i] = plugins[i].replace(/\.js$/, '');
}
let configModule;
try {
    configModule = require('./config/hosting.json');
} catch (e) {
    configModule = require('./config/hosting.dist.json');
}

module.exports = function(app) {
    const log = app.get('log');
    const db = app.get('db');
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const mailer = new(require('../../core/mailer.js'))(app);
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);

    const sortFields = ['username'];

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
                        { email: { $regex: search, $options: 'i' } }
                    ]
                };
            }
            const total = await db.collection('users').find(fquery).count();
            const items = await db.collection('users').find(fquery, { skip: skip, limit: limit, sort: sort }).toArray();
            if (total > 0) {
                let ids = [];
                for (let i in items) {
                    ids.push({ ref_id: String(items[i]._id) });
                    delete items[i].password;
                }
                const agr = await db.collection('hosting_transactions').aggregate([
                    { $match: { $or: ids } },
                    {
                        $group: {
                            _id: { ref_id: '$ref_id' },
                            total: {
                                $sum: '$sum'
                            }
                        }
                    }
                ]).toArray();
                let amtTransactions = {};
                for (let i in agr) {
                    amtTransactions[agr[i]._id.ref_id] = agr[i].total;
                }
                const accounts = await db.collection('hosting_accounts').find({ $or: ids }).toArray();
                let amtAccounts = {};
                if (accounts && accounts.length) {
                    for (let i in accounts) {
                        if (!amtAccounts[accounts[i].ref_id]) {
                            amtAccounts[accounts[i].ref_id] = 0;
                        }
                        amtAccounts[accounts[i].ref_id]++;
                    }
                }
                for (let i in items) {
                    items[i].accounts = amtAccounts[items[i]._id] || 0;
                    items[i].balance = amtTransactions[items[i]._id] || 0;
                }
            }
            let data = {
                status: 1,
                count: items.length,
                items: items,
                total: total
            };
            res.send(JSON.stringify(data));
        } catch (e) {
            log.error(e);
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
            const user = await db.collection('users').findOne({ _id: new ObjectID(id) });
            if (!user) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            delete user.password;
            const accounts = await db.collection('hosting_accounts').find({ ref_id: String(user._id) }, { sort: {}, projection: { id: 1, plugin: 1, preset: 1, days: 1 } }).toArray() || [];
            const transactions = await db.collection('hosting_transactions').find({ ref_id: String(user._id) }, { sort: { timestamp: -1 }, limit: 50, projection: { _id: 0, timestamp: 1, sum: 1 } }).toArray() || [];
            const ar = await db.collection('hosting_transactions').aggregate([
                { $match: { ref_id: String(user._id) } },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: '$sum'
                        }
                    }
                }
            ]).toArray() || [];
            const total = (ar && ar.length) ? ar[0].total : 0;
            user.balance = total || 0;
            user.accounts = accounts;
            user.transactions = transactions;
            user.total = total;
            res.send(JSON.stringify({
                status: 1,
                data: user
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const correction = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const id = req.query.id;
        const sum = req.query.sum;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/) ||
            !sum || typeof sum !== 'string' || !parseFloat(sum)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const user = await db.collection('users').findOne({ _id: new ObjectID(id) });
            if (!user) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            const timestamp = parseInt(Date.now() / 1000, 10);
            const insResult = await db.collection('hosting_transactions').insertOne({ ref_id: id, timestamp: timestamp, sum: parseFloat(sum) });
            if (!insResult || !insResult.result || !insResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            res.send(JSON.stringify({
                status: 1,
                timestamp: timestamp
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const accountLoad = async(req, res) => {
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
            const account = await db.collection('hosting_accounts').findOne({ _id: new ObjectID(id) });
            if (!account) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            account.account = account.id;
            res.send(JSON.stringify({
                status: 1,
                item: account
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const accountSave = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const fieldList = accountFields.getAccountFields();
        let fields = validation.checkRequest(req.body, fieldList);
        let fieldsFailed = validation.getCheckRequestFailedFields(fields);
        if (fieldsFailed.length > 0) {
            return res.send(JSON.stringify({
                status: 0,
                fields: fieldsFailed
            }));
        }
        if (plugins.indexOf(fields.plugin.value) < 0) {
            return res.send(JSON.stringify({
                status: 0,
                fields: ['plugin']
            }));
        }
        const id = req.body.id;
        const _id = req.body._id;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/) ||
            (_id && (typeof _id !== 'string' || !_id.match(/^[a-f0-9]{24}$/)))) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let presetFound;
        for (let i in configModule.presets) {
            if (configModule.presets[i].id === fields.preset.value) {
                presetFound = true;
            }
        }
        if (!presetFound) {
            return res.send(JSON.stringify({
                status: 0,
                fields: ['preset']
            }));
        }
        if (configModule.hosts.indexOf(fields.host.value) === -1) {
            return res.send(JSON.stringify({
                status: 0,
                fields: ['host']
            }));
        }
        try {
            const account = await db.collection('hosting_accounts').findOne({ id: fields.account.value });
            if ((!_id && account) || (_id && account && String(account._id) !== _id)) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: ['account'],
                    duplicate: true
                }));
            }

            const update = await db.collection('hosting_accounts').findAndModify(_id ? { _id: new ObjectID(_id) } : { id: fields.account.value }, [], { id: fields.account.value, ref_id: id, plugin: fields.plugin.value, preset: fields.preset.value, host: fields.host.value, locale: locale, days: parseInt(fields.days.value, 10) }, { new: true, upsert: true });
            if (!update || !update.value || !update.value._id) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let presetTitle = fields.preset.value;
            for (let i in configModule.presets) {
                if (configModule.presets[i].id === fields.preset.value) {
                    presetTitle = configModule.presets[i].titles[locale] || fields.preset.value;
                }
            }
            res.send(JSON.stringify({
                status: 1,
                _id: _id || update.value._id,
                account: fields.account.value,
                plugin: fields.plugin.value,
                preset: presetTitle,
                days: fields.days.value
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const accountDelete = async(req, res) => {
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
            const delResult = await db.collection('hosting_accounts').remove({ _id: new ObjectID(id) });
            if (!delResult || !delResult.result || !delResult.result.ok) {
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

    const accountCreate = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const fieldList = newAccountFields.getNewAccountFields();
        let fields = validation.checkRequest(req.body, fieldList);
        let fieldsFailed = validation.getCheckRequestFailedFields(fields);
        if (fieldsFailed.length > 0) {
            return res.send(JSON.stringify({
                status: 0,
                fields: fieldsFailed
            }));
        }
        let preset;
        let price;
        let presetTitle = '';
        for (let i in configModule.presets) {
            if (configModule.presets[i].id === fields.preset.value) {
                preset = fields.preset.value;
                price = configModule.presets[i].cost;
                presetTitle = configModule.presets[i].titles[locale] + ' (' + (configModule.currencyPosition === 'left' ? configModule.currency[locale] : '') + configModule.presets[i].cost + (configModule.currencyPosition === 'right' ? ' ' + configModule.currency[locale] : '') + ')';
                break;
            }
        }
        if (!preset) {
            return res.send(JSON.stringify({
                status: 0,
                fields: ['preset']
            }));
        }
        const hasUpperCase = /[A-Z]/.test(fields.password.value);
        const hasLowerCase = /[a-z]/.test(fields.password.value);
        const hasNumbers = /\d/.test(fields.password.value);
        const hasNonalphas = /\W/.test(fields.password.value);
        if (hasUpperCase + hasLowerCase + hasNumbers + hasNonalphas < 3) {
            return res.send(JSON.stringify({
                status: 0,
                fields: ['password'],
                error: i18n.get().__(locale, 'Password is too weak. Please use both lowercase and uppercase characters, numbers and special characters. Minimal length: 8')
            }));
        }
        try {
            const ag = await db.collection('hosting_transactions').aggregate([
                { $match: { ref_id: String(req.session.auth._id) } },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: '$sum'
                        }
                    }
                }
            ]).toArray();
            let funds = 0;
            if (ag && ag.length > 0) {
                funds = parseFloat(ag[0].total);
            }
            const cost = parseFloat(fields.months.value) * price;
            if (cost > funds) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: ['preset', 'months'],
                    error: i18n.get().__(locale, 'Insufficient funds')
                }));
            }
            const account = await db.collection('hosting_accounts').findOne({ id: fields.id.value });
            const Plugin = require(path.join(__dirname, 'plugins_hosting', configModule.defaultPlugin));
            const plugin = new Plugin(app);
            const accountAvailable = await plugin.check(fields.id.value, configModule.hosts[configModule.hosts.indexOf(configModule.defaultHost)], locale);
            if (account || accountAvailable !== true) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: ['id'],
                    error: i18n.get().__(locale, 'Account with such ID already exists')
                }));
            }
            const timestamp = parseInt(Date.now() / 1000, 10);
            const days = parseInt(fields.months.value, 10) * 30;
            const transactionSum = parseFloat(cost) * -1;
            const insTaskResult = await db.collection('hosting_tasks').insertOne({
                state: 1,
                id: fields.id.value,
                preset: presetTitle,
                presetID: preset,
                days: days,
                sum: transactionSum,
                timestamp: timestamp
            });
            if (!insTaskResult || !insTaskResult.result || !insTaskResult.result.ok || !insTaskResult.insertedId) {
                return res.send(JSON.stringify({
                    status: 1
                }));
            }
            const taskID = insTaskResult.insertedId;
            setTimeout(async function() {
                const createResult = await plugin.create(fields.id.value, configModule.hosts[configModule.hosts.indexOf(configModule.defaultHost)], preset, fields.password.value, locale);
                if (createResult === true) {
                    try {
                        let failed;
                        const insTransactionResult = await db.collection('hosting_transactions').insertOne({ ref_id: String(req.session.auth._id), timestamp: timestamp, sum: transactionSum });
                        if (!insTransactionResult || !insTransactionResult.result || !insTransactionResult.result.ok) {
                            failed = true;
                        }
                        if (!failed) {
                            const insAccountResult = await db.collection('hosting_accounts').insertOne({ ref_id: String(req.session.auth._id), plugin: configModule.defaultPlugin, preset: preset, days: days, id: fields.id.value, processing: true, locale: locale });
                            if (!insAccountResult || !insAccountResult.result || !insAccountResult.result.ok) {
                                failed = true;
                            }
                        }
                        const password = fields.password.value[0] + fields.password.value.replace(/./gm, '*').replace(/^./, '').replace(/.$/, '') + fields.password.value[fields.password.value.length - 1];
                        if (!failed) {
                            let mailHTML = await render.file('mail_account_new.html', {
                                i18n: i18n.get(),
                                locale: locale,
                                lang: JSON.stringify(i18n.get().locales[locale]),
                                config: config,
                                url: await plugin.getControlPanelURL(configModule.hosts[configModule.hosts.indexOf(configModule.defaultHost)]),
                                username: fields.id.value,
                                password: password,
                                days: days
                            });
                            await mailer.send(req, req.session.auth.email, i18n.get().__(locale, 'New Hosting Account'), mailHTML);
                        }
                        await db.collection('hosting_tasks').update({ _id: new ObjectID(taskID) }, { $set: { state: failed ? 0 : 2 } }, { upsert: true });
                    } catch (e) {
                        log.error(e);
                    }
                } else {
                    try {
                        await db.collection('hosting_tasks').update({ _id: new ObjectID(taskID) }, { $set: { state: 0 } }, { upsert: true });
                    } catch (e) {
                        log.error(e);
                    }
                }
            }, 0);
            return res.send(JSON.stringify({
                status: 1,
                taskID: taskID
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const accountCreateStatus = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
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
            const task = await db.collection('hosting_tasks').findOne({ _id: new ObjectID(id) });
            if (!task) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (task && task.state !== 1) {
                const delResult = await db.collection('hosting_tasks').remove({ _id: new ObjectID(id) });
                if (!delResult || !delResult.result || !delResult.result.ok) {
                    return res.send(JSON.stringify({
                        status: 0
                    }));
                }
            }
            res.send(JSON.stringify({
                status: 1,
                state: task.state || 0,
                id: task.id,
                preset: task.preset,
                presetID: task.presetID,
                days: task.days,
                sum: task.sum,
                timestamp: task.timestamp
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const accountExtend = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const id = req.body.id;
        const months = req.body.months;
        if (!id || typeof id !== 'string' || !id.match(/^[A-Za-z0-9_\-]+$/)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        if (!months || typeof months !== 'string' || !months.match(/^[0-9]{1,2}$/)) {
            return res.send(JSON.stringify({
                status: 0,
                fields: ['months']
            }));
        }
        const days = parseInt(months, 10) * 30;
        try {
            const account = await db.collection('hosting_accounts').findOne({ id: id });
            if (!account) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let preset;
            for (let i in configModule.presets) {
                if (configModule.presets[i].id === account.preset) {
                    preset = configModule.presets[i];
                }
            }
            if (!preset) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            const cost = parseFloat(preset.cost) * months;
            const ag = await db.collection('hosting_transactions').aggregate([
                { $match: { ref_id: String(req.session.auth._id) } },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: '$sum'
                        }
                    }
                }
            ]).toArray();
            let funds = 0;
            if (ag && ag.length > 0) {
                funds = parseFloat(ag[0].total);
            }
            if (cost > funds) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: ['months'],
                    error: i18n.get().__(locale, 'Insufficient funds')
                }));
            }
            const Plugin = require(path.join(__dirname, 'plugins_hosting', account.plugin));
            const plugin = new Plugin(app);
            const start = await plugin.start(account.id, account.host, locale);
            if (start !== true) {
                return res.send(JSON.stringify({
                    status: 0,
                    error: i18n.get().__(locale, 'Could not enable requested account') + ': ' + start
                }));
            }
            const update = await db.collection('hosting_accounts').findAndModify({ id: account.id }, [], { $inc: { days: days } }, { new: true, upsert: true });
            if (!update || !update.value || !update.value._id) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            const timestamp = parseInt(Date.now() / 1000, 10);
            const insResult = await db.collection('hosting_transactions').insertOne({ ref_id: account.ref_id, timestamp: timestamp, sum: (cost * -1) });
            if (!insResult || !insResult.result || !insResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let mailHTML = await render.file('mail_account_extend.html', {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                url: await plugin.getControlPanelURL(configModule.hosts[configModule.hosts.indexOf(configModule.defaultHost)]),
                username: account.id,
                days: days
            });
            await mailer.send(req, req.session.auth.email, i18n.get().__(locale, 'Prolongation of Account'), mailHTML);
            return res.send(JSON.stringify({
                status: 1,
                sum: cost,
                timestamp: timestamp,
                days: (parseInt(days, 10) + parseInt(account.days, 10))
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
    router.get('/load', load);
    router.get('/correction', correction);
    router.get('/account/load', accountLoad);
    router.post('/account/save', accountSave);
    router.get('/account/delete', accountDelete);
    router.post('/account/create', accountCreate);
    router.get('/account/create/status', accountCreateStatus);
    router.post('/account/extend', accountExtend);

    return {
        routes: router
    };
};