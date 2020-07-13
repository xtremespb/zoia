const path = require('path');
const Module = require('../../core/module.js');
const validation = new(require('../../core/validation.js'))();
const Router = require('co-router');
const ObjectID = require('mongodb').ObjectID;
const warehouseFields = require('./schemas/warehouseFields.js');
const settingsFields = require('./schemas/settingsFields.js');
const propertyFields = require('./schemas/propertyFields.js');
const deliveryFields = require('./schemas/deliveryFields.js');
const collectionFields = require('./schemas/collectionFields.js');
const variantFields = require('./schemas/variantFields.js');
const config = require('../../core/config.js');
const fs = require('fs-extra');
const Jimp = require('jimp');
const imageType = require('image-type');
const csv = require('csvtojson');

let configModule;
try {
    configModule = require('./config/catalog.json');
} catch (e) {
    configModule = require('./config/catalog.dist.json');
}

let jsonAddress;
try {
    jsonAddress = require('./config/address.json');
} catch (e) {
    jsonAddress = require('./config/address.dist.json');
}

const _getJsonAddressById = (id) => {
    for (let i in jsonAddress) {
        if (jsonAddress[i].id === id) {
            return jsonAddress[i];
        }
    }
};

const _getJsonAddressSelectDataByValue = (locale) => {
    let data = {};
    for (let i in jsonAddress) {
        if (jsonAddress[i].type === 'select') {
            data[jsonAddress[i].id] = {};
            for (let j in jsonAddress[i].values) {
                data[jsonAddress[i].id][jsonAddress[i].values[j].value] = jsonAddress[i].values[j].lang[locale];
            }
        }
    }
    return data;
};

const _processTemplate = (s, d) => {
    for (let p in d) {
        s = s.replace(new RegExp('{' + p + '}', 'g'), d[p]);
    }
    s = s.replace(new RegExp('({([^}]+)})', 'ig'), '');
    return s;
};

module.exports = function(app) {
    const log = app.get('log');
    const db = app.get('db');
    const sortFields = ['sku', 'folder', 'title', 'status', 'price'];
    const sortOrderFields = ['_id', 'date', 'username', 'status', 'cost'];
    const sortOrdersFields = ['_id', 'date', 'status'];
    const sortPropertyFields = ['pid', 'title'];
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const mailer = new(require('../../core/mailer.js'))(app);

    const _loadSettings = async(locale) => {
        const dataSettings = await db.collection('warehouse_registry').findOne({ name: 'warehouseSettings' });
        let settings = {
            currency: '',
            weight: ''
        };
        if (dataSettings && dataSettings.data) {
            try {
                let settingsParsed = JSON.parse(dataSettings.data);
                for (let i in settingsParsed) {
                    for (let p in settingsParsed[i]) {
                        if (settingsParsed[i][p].p === locale) {
                            settings[i] = settingsParsed[i][p].v;
                        }
                    }
                }
            } catch (e) {
                // Ignore
            }
        }
        return settings;
    };

    const list = async(req, res) => {
        const locale = req.session.currentLocale;
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || 'sku';
        const sortDirection = (req.query.sortDirection === 'asc') ? 1 : -1;
        const sort = {};
        sort[sortField] = sortDirection;
        if (sortField === 'title') {
            sort[locale + '.title'] = sortDirection;
        }
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
                        { sku: { $regex: search, $options: 'i' } }
                    ]
                };
                let tfq = {};
                tfq[locale + '.title'] = { $regex: search, $options: 'i' };
                fquery.$or.push(tfq);
            }
            let ffields = { _id: 1, folder: 1, sku: 1, status: 1, price: 1 };
            ffields[locale + '.title'] = 1;
            fquery.status = { $ne: 'temp' };
            const total = await db.collection('warehouse').find(fquery).count();
            const items = await db.collection('warehouse').find(fquery, { skip: skip, limit: limit, sort: sort, projection: ffields }).toArray();
            for (let i in items) {
                if (items[i][locale]) {
                    items[i].title = items[i][locale].title;
                    delete items[i][locale].title;
                    delete items[i][locale];
                }
            }
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

    const listProperties = async(req, res) => {
        const locale = req.session.currentLocale;
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || 'title';
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
        if (sortPropertyFields.indexOf(sortField) === -1) {
            result.failedField = 'sortField';
            return res.send(result);
        }
        let fquery = {};
        try {
            if (search) {
                fquery = {
                    $or: [
                        { pid: { $regex: search, $options: 'i' } }
                    ]
                };
                let tfq = {};
                tfq['title.' + locale] = { $regex: search, $options: 'i' };
                fquery.$or.push(tfq);
            }
            let ffields = { _id: 1, pid: 1, title: 1, type: 1 };
            const total = await db.collection('warehouse_properties').find(fquery).count();
            const items = await db.collection('warehouse_properties').find(fquery, { skip: skip, limit: limit, sort: sort, projection: ffields }).toArray();
            for (let i in items) {
                if (items[i].title[locale]) {
                    items[i].title = items[i].title[locale];
                } else {
                    items[i].title = '';
                }
            }
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

    const listVariants = async(req, res) => {
        const locale = req.session.currentLocale;
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || 'title';
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
        if (sortPropertyFields.indexOf(sortField) === -1) {
            result.failedField = 'sortField';
            return res.send(result);
        }
        let fquery = {};
        try {
            if (search) {
                fquery = {
                    $or: [
                        { pid: { $regex: search, $options: 'i' } }
                    ]
                };
                let tfq = {};
                tfq['title.' + locale] = { $regex: search, $options: 'i' };
                fquery.$or.push(tfq);
            }

            let ffields = { _id: 1, pid: 1, title: 1 };
            const total = await db.collection('warehouse_variants').find(fquery).count();
            const items = await db.collection('warehouse_variants').find(fquery, { skip: skip, limit: limit, sort: sort, projection: ffields }).toArray();
            for (let i in items) {
                if (items[i].title[locale]) {
                    items[i].title = items[i].title[locale];
                } else {
                    items[i].title = '';
                }
            }
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

    const listDelivery = async(req, res) => {
        const locale = req.session.currentLocale;
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || 'title';
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
        if (sortPropertyFields.indexOf(sortField) === -1) {
            result.failedField = 'sortField';
            return res.send(result);
        }
        let fquery = {};
        try {
            if (search) {
                fquery = {
                    $or: [
                        { pid: { $regex: search, $options: 'i' } }
                    ]
                };
                let tfq = {};
                tfq['title.' + locale] = { $regex: search, $options: 'i' };
                fquery.$or.push(tfq);
            }

            let ffields = { _id: 1, pid: 1, title: 1 };
            const total = await db.collection('warehouse_delivery').find(fquery).count();
            const items = await db.collection('warehouse_delivery').find(fquery, { skip: skip, limit: limit, sort: sort, projection: ffields }).toArray();
            for (let i in items) {
                if (items[i].title[locale]) {
                    items[i].title = items[i].title[locale];
                } else {
                    items[i].title = '';
                }
            }
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

    const listCollections = async(req, res) => {
        const locale = req.session.currentLocale;
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || 'title';
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
        if (sortPropertyFields.indexOf(sortField) === -1) {
            result.failedField = 'sortField';
            return res.send(result);
        }
        let fquery = {};
        try {
            if (search) {
                fquery = {};
                let tfq = {};
                tfq['title.' + locale] = { $regex: search, $options: 'i' };
                fquery.$or = [];
                fquery.$or.push(tfq);
            }
            let ffields = { _id: 1, title: 1 };
            const total = await db.collection('warehouse_collections').find(fquery).count();
            const items = await db.collection('warehouse_collections').find(fquery, { skip: skip, limit: limit, sort: sort, projection: ffields }).toArray();
            for (let i in items) {
                if (items[i].title[locale]) {
                    items[i].title = items[i].title[locale];
                } else {
                    items[i].title = '';
                }
            }
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

    const listVariantsCollections = async(req, res) => {
        const locale = req.session.currentLocale;
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || 'title';
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
        if (sortPropertyFields.indexOf(sortField) === -1) {
            result.failedField = 'sortField';
            return res.send(result);
        }
        let fquery = {};
        try {
            if (search) {
                fquery = {};
                let tfq = {};
                tfq['title.' + locale] = { $regex: search, $options: 'i' };
                fquery.$or = [];
                fquery.$or.push(tfq);
            }
            let ffields = { _id: 1, title: 1 };
            const total = await db.collection('warehouse_variants_collections').find(fquery).count();
            const items = await db.collection('warehouse_variants_collections').find(fquery, { skip: skip, limit: limit, sort: sort, projection: ffields }).toArray();
            for (let i in items) {
                if (items[i].title[locale]) {
                    items[i].title = items[i].title[locale];
                } else {
                    items[i].title = '';
                }
            }
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
        const locale = req.session.currentLocale;
        const id = req.query.id;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const settingsData = await _loadSettings(locale);
            const item = await db.collection('warehouse').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let propertiesQuery = [];
            for (let i in item[locale].properties) {
                propertiesQuery.push({
                    pid: { $eq: item[locale].properties[i].d }
                });
            }
            let propertiesData = {};
            let propertiesType = {};
            if (propertiesQuery.length > 0) {
                const properties = await db.collection('warehouse_properties').find({ $or: propertiesQuery }).toArray();
                for (let p in properties) {
                    for (let i in item[locale].properties) {
                        if (item[locale].properties[i].d === properties[p].pid) {
                            propertiesData[properties[p].pid] = properties[p].title[locale];
                            const type = parseInt(properties[p].type, 10) || null;
                            propertiesType[properties[p].pid] = type === 2 || type === 3 ? settingsData.currency : undefined;
                        }
                    }
                }
            }
            for (let i in config.i18n.locales) {
                let lng = config.i18n.locales[i];
                for (let p in propertiesData) {
                    for (let j in item[lng].properties) {
                        if (p === item[lng].properties[j].d) {
                            item[lng].properties[j].p = propertiesData[p];
                            item[lng].properties[j].t = propertiesType[p];
                        }
                    }
                }
            }
            let variantsQuery = [];
            for (let i in item.variants) {
                variantsQuery.push({
                    pid: { $eq: item.variants[i].d }
                });
            }
            let variantsData = {};
            if (variantsQuery.length > 0) {
                const variants = await db.collection('warehouse_variants').find({ $or: variantsQuery }).toArray();
                for (let p in variants) {
                    for (let i in item.variants) {
                        if (item.variants[i].d === variants[p].pid) {
                            variantsData[variants[p].pid] = variants[p].title[locale];
                        }
                    }
                }
            }
            for (let p in variantsData) {
                for (let j in item.variants) {
                    if (p === item.variants[j].d) {
                        item.variants[j].p = variantsData[p];
                    }
                }
            }
            return res.send(JSON.stringify({
                status: 1,
                item: item
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const loadProperty = async(req, res) => {
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
            const item = await db.collection('warehouse_properties').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let title = [];
            for (let i in item.title) {
                title.push({
                    p: i,
                    v: item.title[i]
                });
            }
            item.title = title;
            return res.send(JSON.stringify({
                status: 1,
                item: item
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const loadVariant = async(req, res) => {
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
            const item = await db.collection('warehouse_variants').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let title = [];
            for (let i in item.title) {
                title.push({
                    p: i,
                    v: item.title[i]
                });
            }
            item.title = title;
            return res.send(JSON.stringify({
                status: 1,
                item: item
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const loadDelivery = async(req, res) => {
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
            const item = await db.collection('warehouse_delivery').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let title = [];
            for (let i in item.title) {
                title.push({
                    p: i,
                    v: item.title[i]
                });
            }
            item.title = title;
            return res.send(JSON.stringify({
                status: 1,
                item: item
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const loadAddress = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const item = await db.collection('warehouse_registry').findOne({ name: 'warehouse_address' });
            const template = await db.collection('warehouse_registry').findOne({ name: 'warehouse_address_template' });
            if (!item || !item.data) {
                return res.send(JSON.stringify({
                    status: 1,
                    item: {
                        name: 'warehouse_address',
                        data: []
                    },
                    template: {
                        name: 'warehouse_address_template',
                        data: ''
                    }
                }));
            }
            return res.send(JSON.stringify({
                status: 1,
                item: item,
                template: template
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const loadCollection = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const id = req.query.id;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const item = await db.collection('warehouse_collections').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            let title = [];
            for (let i in item.title) {
                title.push({
                    p: i,
                    v: item.title[i]
                });
            }
            item.title = title;
            let propertiesQuery = [];
            for (let i in item.properties) {
                propertiesQuery.push({
                    pid: { $eq: item.properties[i] }
                });
            }
            let propertiesData = {};
            if (propertiesQuery.length > 0) {
                const properties = await db.collection('warehouse_properties').find({ $or: propertiesQuery }).toArray();
                for (let i in item.properties) {
                    for (let p in properties) {
                        if (properties[p].pid === item.properties[i]) {
                            propertiesData[properties[p].pid] = properties[p].title[locale];
                        }
                    }
                }
            }
            item.properties = propertiesData;
            return res.send(JSON.stringify({
                status: 1,
                item: item
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: -3,
                error: e.message
            }));
        }
    };

    const loadVariantCollection = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const id = req.query.id;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const item = await db.collection('warehouse_variants_collections').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            let title = [];
            for (let i in item.title) {
                title.push({
                    p: i,
                    v: item.title[i]
                });
            }
            item.title = title;
            let propertiesQuery = [];
            for (let i in item.properties) {
                propertiesQuery.push({
                    pid: { $eq: item.properties[i] }
                });
            }
            let propertiesData = {};
            if (propertiesQuery.length > 0) {
                const properties = await db.collection('warehouse_variants').find({ $or: propertiesQuery }).toArray();
                for (let i in item.properties) {
                    for (let p in properties) {
                        if (properties[p].pid === item.properties[i]) {
                            propertiesData[properties[p].pid] = properties[p].title[locale];
                        }
                    }
                }
            }
            item.properties = propertiesData;
            return res.send(JSON.stringify({
                status: 1,
                item: item
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: -3,
                error: e.message
            }));
        }
    };

    const loadCollectionData = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const id = req.query.id;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const item = await db.collection('warehouse_collections').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            let propertiesQuery = [];
            for (let i in item.properties) {
                propertiesQuery.push({
                    pid: { $eq: item.properties[i] }
                });
            }
            let propertiesData = {};
            if (propertiesQuery.length > 0) {
                const properties = await db.collection('warehouse_properties').find({ $or: propertiesQuery }).toArray();
                for (let i in item.properties) {
                    for (let p in properties) {
                        if (properties[p].pid === item.properties[i]) {
                            propertiesData[properties[p].pid] = {
                                title: properties[p].title[locale],
                                type: parseInt(properties[p].type, 10)
                            };
                        }
                    }
                }
            }
            return res.send(JSON.stringify({
                status: 1,
                items: propertiesData
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: -3,
                error: e.message
            }));
        }
    };

    const loadVariantCollectionData = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const id = req.query.id;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const item = await db.collection('warehouse_variants_collections').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            let propertiesQuery = [];
            for (let i in item.properties) {
                propertiesQuery.push({
                    pid: { $eq: item.properties[i] }
                });
            }
            let propertiesData = {};
            if (propertiesQuery.length > 0) {
                const properties = await db.collection('warehouse_variants').find({ $or: propertiesQuery }).toArray();
                for (let i in item.properties) {
                    for (let p in properties) {
                        if (properties[p].pid === item.properties[i]) {
                            propertiesData[properties[p].pid] = properties[p].title[locale];
                        }
                    }
                }
            }
            return res.send(JSON.stringify({
                status: 1,
                items: propertiesData
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: -3,
                error: e.message
            }));
        }
    };

    const loadVariantData = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const id = req.query.id;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const item = await db.collection('warehouse_variants').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            let propertiesQuery = [];
            for (let i in item.properties) {
                propertiesQuery.push({
                    pid: { $eq: item.properties[i] }
                });
            }
            let propertiesData = {};
            if (propertiesQuery.length > 0) {
                const properties = await db.collection('warehouse_variants').find({ $or: propertiesQuery }).toArray();
                for (let i in item.properties) {
                    for (let p in properties) {
                        if (properties[p].pid === item.properties[i]) {
                            propertiesData[properties[p].pid] = properties[p].title[locale];
                        }
                    }
                }
            }
            return res.send(JSON.stringify({
                status: 1,
                items: propertiesData
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: -3,
                error: e.message
            }));
        }
    };

    const folders = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const data = req.body.folders;
        if (data && typeof data !== 'object') {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const json = JSON.stringify(data);
            const updResult = await db.collection('warehouse_registry').update({ name: 'warehouseFolders' }, { name: 'warehouseFolders', data: json }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const settings = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        try {
            const fieldList = settingsFields.getSettingsFields();
            let fields = validation.checkRequest(req.body, fieldList);
            let fieldsFailed = validation.getCheckRequestFailedFields(fields);
            if (fieldsFailed.length > 0) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (fields.currency && fields.currency.value === '') {
                fields.currency.value = [];
            }
            if (fields.weight && fields.weight.value === '') {
                fields.weight.value = [];
            }
            const data = {
                currency: fields.currency.value,
                weight: fields.weight.value
            };
            const json = JSON.stringify(data);
            const updResult = await db.collection('warehouse_registry').update({ name: 'warehouseSettings' }, { name: 'warehouseSettings', data: json }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            const settingsDataDB = await db.collection('warehouse_registry').findOne({ name: 'warehouseSettings' });
            const settingsDB = await _loadSettings(locale);
            return res.send(JSON.stringify({
                status: 1,
                settings: JSON.stringify(settingsDB),
                settingsData: settingsDataDB ? settingsDataDB.data : JSON.stringify({})
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const saveProperty = async(req, res) => {
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
        try {
            const fieldList = propertyFields.getPropertyFields();
            let fields = validation.checkRequest(req.body, fieldList);
            let fieldsFailed = validation.getCheckRequestFailedFields(fields);
            if (fieldsFailed.length > 0) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: fieldsFailed
                }));
            }
            if (fields.title && fields.title.value === '') {
                fields.title.value = [];
            }
            const data = {
                pid: fields.pid.value,
                type: fields.type.value,
                title: {}
            };
            for (let i in fields.title.value) {
                let item = fields.title.value[i];
                data.title[item.p] = item.v;
            }
            if (id) {
                let item = await db.collection('warehouse_properties').findOne({ _id: new ObjectID(id) });
                if (!item) {
                    return res.send(JSON.stringify({
                        status: -1,
                        fields: fieldsFailed
                    }));
                }
                let duplicate = await db.collection('warehouse_properties').findOne({ pid: data.pid });
                if (duplicate && JSON.stringify(duplicate._id) !== JSON.stringify(item._id)) {
                    return res.send(JSON.stringify({
                        status: -2,
                        fields: fieldsFailed
                    }));
                }
            } else {
                let duplicate = await db.collection('warehouse_properties').findOne({ pid: data.pid });
                if (duplicate) {
                    return res.send(JSON.stringify({
                        status: -2,
                        fields: fieldsFailed
                    }));
                }
            }
            let what = id ? { _id: new ObjectID(id) } : { pid: data.pid };
            let updResult = await db.collection('warehouse_properties').update(what, { $set: data }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: fieldsFailed
                }));
            }
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const saveVariant = async(req, res) => {
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
        try {
            const fieldList = variantFields.getVariantFields();
            let fields = validation.checkRequest(req.body, fieldList);
            let fieldsFailed = validation.getCheckRequestFailedFields(fields);
            if (fieldsFailed.length > 0) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: fieldsFailed
                }));
            }
            if (fields.title && fields.title.value === '') {
                fields.title.value = [];
            }
            const data = {
                pid: fields.pid.value,
                title: {}
            };
            for (let i in fields.title.value) {
                let item = fields.title.value[i];
                data.title[item.p] = item.v;
            }
            if (id) {
                let item = await db.collection('warehouse_variants').findOne({ _id: new ObjectID(id) });
                if (!item) {
                    return res.send(JSON.stringify({
                        status: -1,
                        fields: fieldsFailed
                    }));
                }
                let duplicate = await db.collection('warehouse_variants').findOne({ pid: data.pid });
                if (duplicate && JSON.stringify(duplicate._id) !== JSON.stringify(item._id)) {
                    return res.send(JSON.stringify({
                        status: -2,
                        fields: fieldsFailed
                    }));
                }
            } else {
                let duplicate = await db.collection('warehouse_variants').findOne({ pid: data.pid });
                if (duplicate) {
                    return res.send(JSON.stringify({
                        status: -2,
                        fields: fieldsFailed
                    }));
                }
            }
            let what = id ? { _id: new ObjectID(id) } : { pid: data.pid };
            let updResult = await db.collection('warehouse_variants').update(what, { $set: data }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: fieldsFailed
                }));
            }
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const saveDelivery = async(req, res) => {
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
        try {
            const fieldList = deliveryFields.getDeliveryFields();
            let fields = validation.checkRequest(req.body, fieldList);
            let fieldsFailed = validation.getCheckRequestFailedFields(fields);
            if (fieldsFailed.length > 0) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: fieldsFailed
                }));
            }
            if (fields.title && fields.title.value === '') {
                fields.title.value = [];
            }
            const data = {
                pid: fields.pid.value,
                cost: fields.cost ? fields.cost.value : null,
                cost_weight: fields.cost_weight ? fields.cost_weight.value : null,
                delivery: fields.delivery.value,
                status: fields.status.value,
                title: {}
            };
            for (let i in fields.title.value) {
                let item = fields.title.value[i];
                data.title[item.p] = item.v;
            }
            if (id) {
                let item = await db.collection('warehouse_delivery').findOne({ _id: new ObjectID(id) });
                if (!item) {
                    return res.send(JSON.stringify({
                        status: -1,
                        fields: fieldsFailed
                    }));
                }
                let duplicate = await db.collection('warehouse_delivery').findOne({ pid: data.pid });
                if (duplicate && JSON.stringify(duplicate._id) !== JSON.stringify(item._id)) {
                    return res.send(JSON.stringify({
                        status: -2,
                        fields: fieldsFailed
                    }));
                }
            } else {
                let duplicate = await db.collection('warehouse_delivery').findOne({ pid: data.pid });
                if (duplicate) {
                    return res.send(JSON.stringify({
                        status: -2,
                        fields: fieldsFailed
                    }));
                }
            }
            let what = id ? { _id: new ObjectID(id) } : { pid: data.pid };
            let updResult = await db.collection('warehouse_delivery').update(what, { $set: data }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: fieldsFailed
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

    const saveAddress = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const properties = req.body.properties;
        const template = req.body.template;
        if (properties && (typeof properties !== 'object' || !(properties instanceof Array)) ||
            (template && typeof template !== 'string')) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            let updResult1 = await db.collection('warehouse_registry').update({ name: 'warehouse_address' }, { $set: { data: properties } }, { upsert: true });
            let updResult2 = await db.collection('warehouse_registry').update({ name: 'warehouse_address_template' }, { $set: { data: template } }, { upsert: true });
            if (!updResult1 || !updResult1.result || !updResult1.result.ok ||
                !updResult2 || !updResult2.result || !updResult2.result.ok) {
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

    const saveCollection = async(req, res) => {
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
        try {
            const fieldList = collectionFields.getCollectionFields();
            let fields = validation.checkRequest(req.body, fieldList);
            let fieldsFailed = validation.getCheckRequestFailedFields(fields);
            if (fieldsFailed.length > 0) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: fieldsFailed
                }));
            }
            if (fields.title && fields.title.value === '') {
                fields.title.value = [];
            }
            const data = {
                title: {}
            };
            for (let i in fields.title.value) {
                let item = fields.title.value[i];
                data.title[item.p] = item.v;
            }
            let what = id ? { _id: new ObjectID(id) } : data;
            const propertiesData = req.body.properties;
            data.properties = [];
            if (propertiesData && typeof propertiesData === 'object' && propertiesData instanceof Array) {
                for (let i in propertiesData) {
                    if (propertiesData[i] && typeof propertiesData[i] === 'string' && propertiesData[i].match(/^[A-Za-z0-9_\-]+$/)) {
                        data.properties.push(propertiesData[i]);
                    }
                }
            }
            let updResult = await db.collection('warehouse_collections').update(what, { $set: data }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: fieldsFailed
                }));
            }
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const saveVariantCollection = async(req, res) => {
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
        try {
            const fieldList = collectionFields.getCollectionFields();
            let fields = validation.checkRequest(req.body, fieldList);
            let fieldsFailed = validation.getCheckRequestFailedFields(fields);
            if (fieldsFailed.length > 0) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: fieldsFailed
                }));
            }
            if (fields.title && fields.title.value === '') {
                fields.title.value = [];
            }
            const data = {
                title: {}
            };
            for (let i in fields.title.value) {
                let item = fields.title.value[i];
                data.title[item.p] = item.v;
            }
            let what = id ? { _id: new ObjectID(id) } : data;
            const propertiesData = req.body.properties;
            data.properties = [];
            if (propertiesData && typeof propertiesData === 'object' && propertiesData instanceof Array) {
                for (let i in propertiesData) {
                    if (propertiesData[i] && typeof propertiesData[i] === 'string' && propertiesData[i].match(/^[A-Za-z0-9_\-]+$/)) {
                        data.properties.push(propertiesData[i]);
                    }
                }
            }
            let updResult = await db.collection('warehouse_variants_collections').update(what, { $set: data }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0,
                    fields: fieldsFailed
                }));
            }
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
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
        const fieldList = warehouseFields.getWarehouseFields();
        let output = {};
        let data = {};
        try {
            for (let i in config.i18n.locales) {
                let lng = config.i18n.locales[i];
                data[lng] = {};
                if (req.body[lng]) {
                    let fields = validation.checkRequest(req.body[lng], fieldList);
                    let fieldsFailed = validation.getCheckRequestFailedFields(fields);
                    if (fieldsFailed.length > 0) {
                        output.status = 0;
                        output.fields = fieldsFailed;
                        return res.send(JSON.stringify(output));
                    }
                    if (fields.properties && fields.properties.value === '') {
                        fields.properties.value = [];
                    }
                    for (let p in fields.properties.value) {
                        delete fields.properties.value[p].p;
                        delete fields.properties.value[p].t;
                        if (!fields.properties.value[p].d || typeof fields.properties.value[p].d !== 'string' || !fields.properties.value[p].d.match(/^[A-Za-z0-9_\-]+$/)) {
                            throw new Error('Invalid property ID');
                        }
                        if (fields.properties.value[p].v && typeof fields.properties.value[p].v === 'string') {
                            fields.properties.value[p].v = fields.properties.value[p].v.replace(/\&/gm, '&amp;').replace(/\"/gm, '&quot;').replace(/\'/gm, '&apos;').replace(/\</gm, '&lt;').replace(/\>/gm, '&gt;');
                        }
                    }
                    if (fields.variants && fields.variants.value === '') {
                        fields.variants.value = [];
                    }
                    for (let p in fields.variants.value) {
                        delete fields.variants.value[p].p;
                        delete fields.variants.value[p].t;
                        if (!fields.variants.value[p].d || typeof fields.variants.value[p].d !== 'string' || !fields.variants.value[p].d.match(/^[A-Za-z0-9_\-]+$/)) {
                            throw new Error('Invalid property ID');
                        }
                        if (fields.variants.value[p].v && typeof fields.variants.value[p].v === 'string') {
                            fields.variants.value[p].v = fields.variants.value[p].v.replace(/\&/gm, '&amp;').replace(/\"/gm, '&quot;').replace(/\'/gm, '&apos;').replace(/\</gm, '&lt;').replace(/\>/gm, '&gt;');
                        }
                    }
                    data[lng] = {
                        title: fields.title.value,
                        keywords: (fields.keywords ? fields.keywords.value : ''),
                        description: (fields.description ? fields.description.value : ''),
                        content: (fields.content ? fields.content.value : ''),
                        properties: fields.properties.value
                    };
                    data.folder = fields.folder.value;
                    data.images = fields.images.value ? JSON.parse(fields.images.value) : [];
                    data.url = fields.url.value;
                    data.sku = fields.sku.value;
                    data.weight = fields.weight.value;
                    data.amount = fields.amount.value ? parseInt(fields.amount.value, 10) : 0;
                    data.price = parseFloat(fields.price.value);
                    data.status = fields.status.value;
                    data.pinned = fields.pinned.value;
                    data.variants = fields.variants.value;
                }
            }
            if (id) {
                let item = await db.collection('warehouse').findOne({ _id: new ObjectID(id) });
                if (!item) {
                    output.status = -1;
                    output.fields = ['sku'];
                    return res.send(JSON.stringify(output));
                }
                let duplicate = await db.collection('warehouse').findOne({ sku: data.sku });
                if (duplicate && JSON.stringify(duplicate._id) !== JSON.stringify(item._id)) {
                    output.status = -2;
                    output.fields = ['sku'];
                    return res.send(JSON.stringify(output));
                }
            } else {
                let duplicate = await db.collection('warehouse').findOne({ sku: data.sku });
                if (duplicate) {
                    output.status = -2;
                    output.fields = ['sku'];
                    return res.send(JSON.stringify(output));
                }
            }
            let what = id ? { _id: new ObjectID(id) } : { sku: data.sku, folder: data.folder };
            let updResult = await db.collection('warehouse').update(what, { $set: data }, { upsert: true });
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

    const saveImages = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const items = req.body['items'] || [];
        const id = req.body['id'];
        let output = {};
        if (!items || typeof items !== 'object' || !id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            output.status = -1;
            return res.send(JSON.stringify(output));
        }
        for (let i in items) {
            const item = items[i];
            if (!item.id || typeof item.id !== 'string' || !item.id.match(/^[0-9]{13}$/) ||
                !item.ext || typeof item.ext !== 'string' || !item.ext.match(/^[a-z]+$/)) {
                output.status = -2;
                return res.send(JSON.stringify(output));
            }
        }
        try {
            let updResult = await db.collection('warehouse').update({ _id: new ObjectID(id) }, { $set: { images: items } }, { upsert: true });
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

    const create = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let output = {};
        let data = {
            status: 'temp'
        };
        try {
            const insResult = await db.collection('warehouse').insertOne(data);
            if (!insResult || !insResult.result || !insResult.result.ok) {
                output.status = 0;
                return res.send(JSON.stringify(output));
            }
            output.id = insResult.insertedId;
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
                did.push({ _id: new ObjectID(id), url: { $ne: '' } });
            } else {
                did.push({ _id: new ObjectID(id) });
            }
        }
        try {
            const delResult = await db.collection('warehouse').deleteMany({
                $or: did
            });
            if (!delResult || !delResult.result || !delResult.result.ok || delResult.result.n !== ids.length) {
                output.status = -3;
                return res.send(JSON.stringify(output));
            }
            for (let i in ids) {
                const id = ids[i];
                try {
                    await fs.remove(path.join(__dirname, 'static', 'images', id));
                } catch (e) {
                    // Ignore
                }
            }
            output.status = 1;
            res.send(JSON.stringify(output));
        } catch (e) {
            output.status = 0;
            log.error(e);
            res.send(JSON.stringify(output));
        }
    };

    const delProperty = async(req, res) => {
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
                did.push({ _id: new ObjectID(id), url: { $ne: '' } });
            } else {
                did.push({ _id: new ObjectID(id) });
            }
        }
        try {
            const delResult = await db.collection('warehouse_properties').deleteMany({
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

    const delVariant = async(req, res) => {
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
                did.push({ _id: new ObjectID(id), url: { $ne: '' } });
            } else {
                did.push({ _id: new ObjectID(id) });
            }
        }
        try {
            const delResult = await db.collection('warehouse_variants').deleteMany({
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

    const delCollection = async(req, res) => {
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
                did.push({ _id: new ObjectID(id), url: { $ne: '' } });
            } else {
                did.push({ _id: new ObjectID(id) });
            }
        }
        try {
            const delResult = await db.collection('warehouse_collections').deleteMany({
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

    const delVariantCollection = async(req, res) => {
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
                did.push({ _id: new ObjectID(id), url: { $ne: '' } });
            } else {
                did.push({ _id: new ObjectID(id) });
            }
        }
        try {
            const delResult = await db.collection('warehouse_variants_collections').deleteMany({
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

    const delImages = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let output = {};
        const items = req.body['items'];
        const id = req.body['id'];
        if (!items || typeof items !== 'object' || !id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            output.status = -1;
            return res.send(JSON.stringify(output));
        }
        for (let i in items) {
            const item = items[i];
            if (!item.id || typeof item.id !== 'string' || !item.id.match(/^[0-9]{13}$/) ||
                !item.ext || typeof item.ext !== 'string' || !item.ext.match(/^[a-z]+$/)) {
                output.status = -2;
                return res.send(JSON.stringify(output));
            }
        }
        try {
            for (let i in items) {
                try {
                    fs.remove(path.join(__dirname, 'static', 'images', id, 'tn_' + items[i].id + '.' + items[i].ext));
                    fs.remove(path.join(__dirname, 'static', 'images', id, items[i].id + '.' + items[i].ext));
                } catch (e) {
                    // Ignore
                }
            }
            output.status = 1;
            return res.send(JSON.stringify(output));
        } catch (e) {
            output.status = 0;
            log.error(e);
            res.send(JSON.stringify(output));
        }
    };

    const checkDirectory = (fn) => {
        if (!fn || typeof fn !== 'string') {
            return true;
        }
        if (fn.length > 40 || fn.match(/^\./) || fn.match(/^\\/) || fn.match(/^[\^<>\:\"\\\|\?\*\x00-\x1f]+$/)) {
            return false;
        }
        return true;
    };

    const checkFilename = function(fn) {
        if (!fn || typeof fn !== 'string' || fn.length > 80 || fn.match(/^\./) || fn.match(/^[\^<>\:\"\/\\\|\?\*\x00-\x1f\~]+$/)) {
            return false;
        }
        return true;
    };

    const browseList = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            let dir = req.query.path || req.body.path;
            if (!dir || typeof dir !== 'string' || !checkDirectory(dir)) {
                dir = '/';
            } else {
                dir = dir.trim();
            }
            let dirArr = [__dirname, 'static', 'storage'].concat(dir.split('/'));
            let browsePath = path.join(...dirArr);
            try {
                await fs.access(browsePath, fs.constants.F_OK);
            } catch (e) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            let filesData = await fs.readdir(browsePath);
            let files = [];
            for (let f in filesData) {
                if (filesData[f].match(/^\./) || filesData[f].match(/^___tn/)) {
                    continue;
                }
                let item = {};
                let stat = await fs.lstat(path.join(...dirArr, filesData[f]));
                item.filename = filesData[f];
                if (stat.isFile()) {
                    item.type = 'f';
                }
                if (stat.isDirectory()) {
                    item.type = 'd';
                }
                if (!item.type) {
                    item.type = 'o';
                }
                item.ext = path.extname(filesData[f]);
                if (item.ext && typeof item.ext === 'string') {
                    item.ext = item.ext.replace(/^\./, '').toLowerCase();
                }
                try {
                    await fs.access(path.join(...dirArr, '___tn_' + filesData[f]), fs.constants.F_OK);
                    item.thumb = true;
                } catch (e) {
                    // Ignore
                }
                files.push(item);
            }
            files.sort(function(a, b) {
                if (a.type === b.type) {
                    return 0;
                }
                if (a.type === 'd' && b.type === 'f') {
                    return -1;
                }
                return 1;
            });
            return res.send(JSON.stringify({
                status: 1,
                files: files
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const browseFolderCreate = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            let dir = req.query.path || req.body.path;
            let name = req.query.name || req.body.name;
            if (!name || typeof name !== 'string' || name.length > 40 || !name.match(/^[a-zA-Z0-9_\-\.;\s]+$/)) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (!dir || typeof dir !== 'string' || !checkDirectory(dir)) {
                dir = '/';
            } else {
                dir = dir.trim();
            }
            let dirArr = [__dirname, 'static', 'storage'].concat(dir.split('/'));
            let browsePath = path.join(...dirArr);
            try {
                await fs.access(browsePath, fs.constants.F_OK);
            } catch (e) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            await fs.mkdir(path.join(browsePath, name));
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const browseRename = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            let dir = req.query.path || req.body.path;
            let nameOld = req.query.nameOld || req.body.nameOld;
            let nameNew = req.query.nameNew || req.body.nameNew;
            if (!checkFilename(nameOld) ||
                !checkFilename(nameNew)) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (!dir || typeof dir !== 'string' || !checkDirectory(dir)) {
                dir = '/';
            } else {
                dir = dir.trim();
            }
            let dirArr = [__dirname, 'static', 'storage'].concat(dir.split('/'));
            let browsePath = path.join(...dirArr);
            try {
                await fs.access(browsePath, fs.constants.F_OK);
            } catch (e) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            await fs.rename(path.join(browsePath, nameOld), path.join(browsePath, nameNew));
            try {
                await fs.rename(path.join(browsePath, '___tn_' + nameOld), path.join(browsePath, '___tn_' + nameNew));
            } catch (e) {
                // Ignore
            }
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const browseDelete = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            let dir = req.query.path || req.body.path;
            let files = req.query.files || req.body.files;
            if (!files || typeof files !== 'object') {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            for (let i in files) {
                let file = files[i];
                if (!checkFilename(file)) {
                    return res.send(JSON.stringify({
                        status: 0
                    }));
                }
            }
            if (!dir || typeof dir !== 'string' || !checkDirectory(dir)) {
                dir = '/';
            } else {
                dir = dir.trim();
            }
            let dirArr = [__dirname, 'static', 'storage'].concat(dir.split('/'));
            let browsePath = path.join(...dirArr);
            try {
                await fs.access(browsePath, fs.constants.F_OK);
            } catch (e) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            for (let i in files) {
                let file = files[i];
                await fs.remove(path.join(browsePath, file));
            }
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const browsePaste = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            let dirSrc = req.query.pathSource || req.body.pathSource;
            let dirDest = req.query.pathDestination || req.body.pathDestination;
            let files = req.query.files || req.body.files;
            let operation = req.query.operation || req.body.operation;
            if (operation !== 'cut') {
                operation = 'copy';
            }
            if (!files || typeof files !== 'object') {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            for (let i in files) {
                let file = files[i];
                if (!file || typeof file !== 'string' || file.length > 40 || !file.match(/^[a-zA-Z0-9_\-\.;х]+$/)) {
                    return res.send(JSON.stringify({
                        status: 0,
                        file: file,
                        match: file.match(/^[a-zA-Z0-9_\-\.;\s]+$/)
                    }));
                }
            }
            if (!dirSrc || typeof dirSrc !== 'string' || !checkDirectory(dirSrc)) {
                dirSrc = '';
            }
            if (!dirDest || typeof dirDest !== 'string' || !checkDirectory(dirDest)) {
                dirDest = '';
            } else {
                dirSrc = dirSrc.trim();
                dirDest = dirDest.trim();
            }
            let dirSrcArr = [__dirname, 'static', 'storage'].concat(dirSrc.split('/'));
            let dirDestArr = [__dirname, 'static', 'storage'].concat(dirDest.split('/'));
            let browseSrcPath = path.join(...dirSrcArr);
            let browseDestPath = path.join(...dirDestArr);
            try {
                await fs.access(browseSrcPath, fs.constants.F_OK);
                await fs.access(browseDestPath, fs.constants.F_OK);
            } catch (e) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            for (let i in files) {
                let file = files[i];
                if (operation === 'copy') {
                    await fs.copy(path.join(browseSrcPath, file), path.join(browseDestPath, file));
                    try {
                        await fs.copy(path.join(browseSrcPath, '___tn_' + file), path.join(browseDestPath, '___tn_' + file));
                    } catch (e) {
                        // Ignore
                    }
                } else {
                    await fs.move(path.join(browseSrcPath, file), path.join(browseDestPath, file), { overwrite: true });
                    try {
                        await fs.move(path.join(browseSrcPath, '___tn_' + file), path.join(browseDestPath, '___tn_' + file), { overwrite: true });
                    } catch (e) {
                        // Ignore
                    }
                }
            }
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const _buf = (image) => {
        return new Promise(function(resolve) {
            image.getBuffer(Jimp.MIME_PNG, function(err, buf) {
                resolve(buf);
            });
        });
    };

    const _treePath = (tree, id, _path) => {
        let node = tree.find(x => x.id === id);
        if (!node) {
            return '';
        }
        let pathTree = _path || [];
        pathTree.push(node.text);
        if (node.parent !== '#') {
            pathTree = _treePath(tree, node.parent, pathTree);
        }
        return pathTree;
    };

    const browseUpload = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        if (!req.files || !req.files.file || req.files.file.data.length > config.maxUploadSizeMB * 1048576 || !checkFilename(req.files.file.name)) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        let dir = req.body.dir;
        if (!checkDirectory(dir)) {
            return res.send(JSON.stringify({
                status: -2
            }));
        }
        let dirArr = [__dirname, 'static', 'storage'].concat(dir.split('/'));
        let browsePath = path.join(...dirArr);
        try {
            await fs.access(browsePath, fs.constants.F_OK);
            let imgType = imageType(req.files.file.data);
            if (imgType && (imgType.ext === 'png' || imgType.ext === 'jpg' || imgType.ext === 'jpeg' || imgType.ext === 'bmp')) {
                try {
                    let img = await Jimp.read(req.files.file.data);
                    if (img) {
                        img.cover(80, 80, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
                        img.quality(60);
                        let buf = await _buf(img);
                        if (buf) {
                            await fs.writeFile(path.join(browsePath, '___tn_' + req.files.file.name), buf);
                        }
                    }
                } catch (e) {
                    // Ignore
                }
            }
            await fs.writeFile(path.join(browsePath, req.files.file.name), req.files.file.data);
        } catch (e) {
            return res.send(JSON.stringify({
                status: -3
            }));
        }
        return res.send(JSON.stringify({
            status: 1
        }));
    };

    const upload = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        if (!req.files || !req.files.file || req.files.file.data.length > config.maxUploadSizeMB * 1048576) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        let id = req.body.id;
        if (!id.match(/^[a-f0-9]{24}$/)) {
            return res.send(JSON.stringify({
                status: -10
            }));
        }
        const idImg = Date.now();
        let imgType;
        try {
            const pathImg = path.join(__dirname, 'static', 'images', id);
            await fs.ensureDir(pathImg);
            imgType = imageType(req.files.file.data);
            if (imgType && (imgType.ext === 'png' || imgType.ext === 'jpg' || imgType.ext === 'jpeg' || imgType.ext === 'bmp')) {
                let img = await Jimp.read(req.files.file.data);
                if (!img) {
                    throw new Error('Invalid file format');
                }
                img.cover(configModule.thumb.width, configModule.thumb.height, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
                img.quality(60);
                let buf = await _buf(img);
                if (!buf) {
                    throw new Error('Could not get image buffer');
                }
                await fs.writeFile(path.join(pathImg, 'tn_' + idImg + '.' + imgType.ext), buf);
                await fs.writeFile(path.join(pathImg, idImg + '.' + imgType.ext), req.files.file.data);
            } else {
                throw new Error('Invalid file format');
            }
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: -3
            }));
        }
        return res.send(JSON.stringify({
            status: 1,
            id: idImg,
            ext: imgType.ext
        }));
    };

    const repair = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let folder = req.body.folder;
        if (folder) {
            folder = String(folder);
        }
        if (!folder || !folder.match(/^[0-9]+$/g)) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const foldersRString = await db.collection('warehouse_registry').findOne({ name: 'warehouseFolders' });
            if (!foldersRString || !foldersRString.data) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            const foldersR = JSON.parse(foldersRString.data);
            let pathR = _treePath(foldersR, folder);
            pathR = pathR.reverse();
            pathR.shift();
            pathR = pathR.join('/');
            let farr = [];
            for (let i in foldersR) {
                farr.push({
                    folder: {
                        $ne: foldersR[i].id
                    }
                });
            }
            const count = await db.collection('warehouse').find({ $and: farr }, { _id: 1 }).count();
            if (count) {
                const updResult = await db.collection('warehouse').update({ $and: farr }, { $set: { folder: folder, folderVal: pathR } }, { upsert: true });
                if (!updResult || !updResult.result || !updResult.result.ok) {
                    return res.send(JSON.stringify({
                        status: 0
                    }));
                }
            }
            return res.send(JSON.stringify({
                status: 1
            }));
        } catch (e) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const rebuild = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const foldersRString = await db.collection('warehouse_registry').findOne({ name: 'warehouseFolders' });
            if (!foldersRString || !foldersRString.data) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            const foldersR = JSON.parse(foldersRString.data);
            const items = await db.collection('warehouse').find({}, { folder: 1, url: 1 }).toArray();
            if (items && items.length) {
                for (let i in items) {
                    let item = items[i];
                    if (!item.folder) {
                        continue;
                    }
                    let pathR = _treePath(foldersR, item.folder);
                    pathR = pathR.reverse();
                    pathR.shift();
                    pathR = pathR.join('/');
                    if (item.url !== pathR) {
                        const updResult = await db.collection('warehouse').update({ _id: item._id }, { $set: { url: pathR } }, { upsert: true });
                        if (!updResult || !updResult.result || !updResult.result.ok) {
                            return res.send(JSON.stringify({
                                status: -2
                            }));
                        }
                    }
                }
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

    const importProperties = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        if (!req.files || typeof req.files !== 'object' || !req.files['files[]'] || !req.files['files[]'].name || !req.files['files[]'].data ||
            !req.files['files[]'].data.length || req.files['files[]'].data.length > config.maxUploadSizeMB * 1048576) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const fid = String(Date.now());
            const tempFile = path.join(__dirname, '..', '..', 'temp', 'pimport_' + fid + '.csv');
            await fs.writeFile(tempFile, req.files['files[]'].data);
            const insResult = await db.collection('warehouse_tasks').insertOne({
                state: 1,
                fid: fid
            });
            if (!insResult || !insResult.result || !insResult.result.ok || !insResult.insertedId) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            const uid = insResult.insertedId;
            setTimeout(function() {
                csv().fromFile(tempFile)
                    .on('json', async(json) => {
                        if (!json || typeof json !== 'object' || !json.pid) {
                            return;
                        }
                        let prop = {
                            pid: json.pid,
                            title: {}
                        };
                        for (let i in config.i18n.locales) {
                            let lng = config.i18n.locales[i];
                            prop.title[lng] = json[lng] || '';
                        }
                        await db.collection('warehouse_properties').insertOne(prop);
                    }).on('done', async() => {
                        await db.collection('warehouse_tasks').update({ _id: new ObjectID(uid) }, { $set: { state: 3 } }, { upsert: true });
                    });
            }, 0);
            return res.send(JSON.stringify({
                status: 1,
                uid: uid
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const importVariants = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        if (!req.files || typeof req.files !== 'object' || !req.files['files[]'] || !req.files['files[]'].name || !req.files['files[]'].data ||
            !req.files['files[]'].data.length || req.files['files[]'].data.length > config.maxUploadSizeMB * 1048576) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const fid = String(Date.now());
            const tempFile = path.join(__dirname, '..', '..', 'temp', 'vimport_' + fid + '.csv');
            await fs.writeFile(tempFile, req.files['files[]'].data);
            const insResult = await db.collection('warehouse_tasks').insertOne({
                state: 1,
                fid: fid
            });
            if (!insResult || !insResult.result || !insResult.result.ok || !insResult.insertedId) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            const uid = insResult.insertedId;
            setTimeout(function() {
                csv().fromFile(tempFile)
                    .on('json', async(json) => {
                        if (!json || typeof json !== 'object' || !json.pid) {
                            return;
                        }
                        let prop = {
                            pid: json.pid,
                            title: {}
                        };
                        for (let i in config.i18n.locales) {
                            let lng = config.i18n.locales[i];
                            prop.title[lng] = json[lng] || '';
                        }
                        await db.collection('warehouse_variants').insertOne(prop);
                    }).on('done', async() => {
                        await db.collection('warehouse_tasks').update({ _id: new ObjectID(uid) }, { $set: { state: 3 } }, { upsert: true });
                    });
            }, 0);
            return res.send(JSON.stringify({
                status: 1,
                uid: uid
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const importPropertiesState = async(req, res) => {
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
            const item = await db.collection('warehouse_tasks').findOne({ _id: new ObjectID(id) });
            if (!item || !item.state) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (item.state === 3 && item.fid) {
                try {
                    await db.collection('warehouse_tasks').remove({ _id: new ObjectID(id) });
                    await fs.remove(path.join(__dirname, '..', '..', 'temp', 'pimport_' + item.fid + '.csv'));
                } catch (e) {
                    log.error(e);
                    // Ignore
                }
            }
            return res.send(JSON.stringify({
                status: 1,
                state: item.state
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const importVariantsState = async(req, res) => {
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
            const item = await db.collection('warehouse_tasks').findOne({ _id: new ObjectID(id) });
            if (!item || !item.state) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (item.state === 3 && item.fid) {
                try {
                    await db.collection('warehouse_tasks').remove({ _id: new ObjectID(id) });
                    await fs.remove(path.join(__dirname, '..', '..', 'temp', 'vimport_' + item.fid + '.csv'));
                } catch (e) {
                    log.error(e);
                    // Ignore
                }
            }
            return res.send(JSON.stringify({
                status: 1,
                state: item.state
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const importCollections = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        if (!req.files || typeof req.files !== 'object' || !req.files['files[]'] || !req.files['files[]'].name || !req.files['files[]'].data ||
            !req.files['files[]'].data.length || req.files['files[]'].data.length > config.maxUploadSizeMB * 1048576) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const fid = String(Date.now());
            const tempFile = path.join(__dirname, '..', '..', 'temp', 'cimport_' + fid + '.csv');
            await fs.writeFile(tempFile, req.files['files[]'].data);
            const insResult = await db.collection('warehouse_tasks').insertOne({
                state: 1,
                fid: fid
            });
            if (!insResult || !insResult.result || !insResult.result.ok || !insResult.insertedId) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            const uid = insResult.insertedId;
            setTimeout(function() {
                csv().fromFile(tempFile)
                    .on('json', async(json) => {
                        if (!json || typeof json !== 'object' || !json.properties) {
                            return;
                        }
                        let prop = {
                            properties: [],
                            title: {}
                        };
                        if (json.properties && typeof json.properties === 'string') {
                            json.properties = json.properties.replace(/\s\t/, '');
                            const properties = json.properties.split(/;/);
                            for (let p in properties) {
                                prop.properties.push(properties[p]);
                            }
                        }
                        for (let i in config.i18n.locales) {
                            let lng = config.i18n.locales[i];
                            prop.title[lng] = json[lng] || '';
                        }
                        await db.collection('warehouse_collections').insertOne(prop);
                    }).on('done', async() => {
                        await db.collection('warehouse_tasks').update({ _id: new ObjectID(uid) }, { $set: { state: 3 } }, { upsert: true });
                    });
            }, 0);
            return res.send(JSON.stringify({
                status: 1,
                uid: uid
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const importVariantsCollections = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        if (!req.files || typeof req.files !== 'object' || !req.files['files[]'] || !req.files['files[]'].name || !req.files['files[]'].data ||
            !req.files['files[]'].data.length || req.files['files[]'].data.length > config.maxUploadSizeMB * 1048576) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const fid = String(Date.now());
            const tempFile = path.join(__dirname, '..', '..', 'temp', 'vcimport_' + fid + '.csv');
            await fs.writeFile(tempFile, req.files['files[]'].data);
            const insResult = await db.collection('warehouse_tasks').insertOne({
                state: 1,
                fid: fid
            });
            if (!insResult || !insResult.result || !insResult.result.ok || !insResult.insertedId) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            const uid = insResult.insertedId;
            setTimeout(function() {
                csv().fromFile(tempFile)
                    .on('json', async(json) => {
                        if (!json || typeof json !== 'object' || !json.properties) {
                            return;
                        }
                        let prop = {
                            properties: [],
                            title: {}
                        };
                        if (json.properties && typeof json.properties === 'string') {
                            json.properties = json.properties.replace(/\s\t/, '');
                            const properties = json.properties.split(/;/);
                            for (let p in properties) {
                                prop.properties.push(properties[p]);
                            }
                        }
                        for (let i in config.i18n.locales) {
                            let lng = config.i18n.locales[i];
                            prop.title[lng] = json[lng] || '';
                        }
                        await db.collection('warehouse_variants_collections').insertOne(prop);
                    }).on('done', async() => {
                        await db.collection('warehouse_tasks').update({ _id: new ObjectID(uid) }, { $set: { state: 3 } }, { upsert: true });
                    });
            }, 0);
            return res.send(JSON.stringify({
                status: 1,
                uid: uid
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const importCollectionsState = async(req, res) => {
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
            const item = await db.collection('warehouse_tasks').findOne({ _id: new ObjectID(id) });
            if (!item || !item.state) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (item.state === 3 && item.fid) {
                try {
                    await db.collection('warehouse_tasks').remove({ _id: new ObjectID(id) });
                    await fs.remove(path.join(__dirname, '..', '..', 'temp', 'cimport_' + item.fid + '.csv'));
                } catch (e) {
                    log.error(e);
                    // Ignore
                }
            }
            return res.send(JSON.stringify({
                status: 1,
                state: item.state
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const importVariantsCollectionsState = async(req, res) => {
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
            const item = await db.collection('warehouse_tasks').findOne({ _id: new ObjectID(id) });
            if (!item || !item.state) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (item.state === 3 && item.fid) {
                try {
                    await db.collection('warehouse_tasks').remove({ _id: new ObjectID(id) });
                    await fs.remove(path.join(__dirname, '..', '..', 'temp', 'vcimport_' + item.fid + '.csv'));
                } catch (e) {
                    log.error(e);
                    // Ignore
                }
            }
            return res.send(JSON.stringify({
                status: 1,
                state: item.state
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const cartAdd = async(req, res) => {
        res.contentType('application/json');
        if (!configModule.cart) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const id = req.body.id;
        let variant = req.body.variant;
        const checkboxes = req.body.checkboxes || [];
        const integers = req.body.integers || [];
        const selects = req.body.selects || [];
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/) ||
            (variant && (typeof variant !== 'string' || !variant.match(/^[a-zA-Z0-9_]+$/) || variant.length > 64)) ||
            typeof checkboxes !== 'object' || !(checkboxes instanceof Array) ||
            typeof selects !== 'object' || !(selects instanceof Array) ||
            typeof integers !== 'object' || !(integers instanceof Array)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        variant = variant || '';
        const uid = id + '|' + variant;
        let cart = req.session.catalog_cart || {};
        const item = await db.collection('warehouse').findOne({ _id: new ObjectID(id) });
        if (!item) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let checkPropertiesType = [];
        let typesForId = {};
        for (let i in checkboxes) {
            let found = false;
            for (let v in item[locale].properties) {
                if (item[locale].properties[v].d === checkboxes[i]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (checkPropertiesType.indexOf(checkboxes[i]) === -1) {
                checkPropertiesType.push({ pid: checkboxes[i] });
                typesForId[checkboxes[i]] = '2';
            }
        }
        for (let i in integers) {
            let found = false;
            let [iid, cnt] = integers[i].split('|');
            if (!cnt || !parseInt(cnt, 10)) {
                cnt = 1;
            } else {
                cnt = parseInt(cnt, 10);
            }
            for (let v in item[locale].properties) {
                if (item[locale].properties[v].d === iid) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (checkPropertiesType.indexOf(iid) === -1) {
                checkPropertiesType.push({ pid: iid });
                typesForId[iid] = '3';
            }
        }
        for (let i in selects) {
            let found = false;
            let [iid, cnt] = selects[i].split('|');
            if (!cnt || !parseInt(cnt, 10)) {
                cnt = 0;
            } else {
                cnt = parseInt(cnt, 10);
            }
            for (let v in item[locale].properties) {
                if (item[locale].properties[v].d === iid) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (checkPropertiesType.indexOf(iid) === -1) {
                checkPropertiesType.push({ pid: iid });
                typesForId[iid] = '4';
            }
        }
        if (checkPropertiesType.length) {
            const propDB = await db.collection('warehouse_properties').find({ $or: checkPropertiesType }).toArray();
            if (!propDB || propDB.length !== checkPropertiesType.length) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            for (let i in propDB) {
                if (propDB[i].type !== typesForId[propDB[i].pid]) {
                    return res.send(JSON.stringify({
                        status: 0
                    }));
                }
            }
        }
        if (!cart[uid]) {
            cart[uid] = {
                count: 1
            };
        } else {
            cart[uid].count++;
        }
        cart[uid].integers = integers;
        cart[uid].checkboxes = checkboxes;
        cart[uid].selects = selects;
        req.session.catalog_cart = cart;
        let cartCount = Object.keys(cart).length;
        return res.send(JSON.stringify({
            status: 1,
            count: cartCount
        }));
    };

    const cartCount = async(req, res) => {
        res.contentType('application/json');
        if (!configModule.cart) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const id = req.body.id;
        let variant = req.body.variant;
        let count = req.body.count;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/) ||
            !count || typeof count !== 'string' || !count.match(/^[0-9]+$/) ||
            parseInt(count, 10) === 0 || parseInt(count, 10) > 99999 ||
            (variant && (typeof variant !== 'string' || !variant.match(/^[a-zA-Z0-9_]+$/) || variant.length > 64))) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        variant = variant || '';
        let cart = req.session.catalog_cart || {};
        const uid = id + '|' + variant;
        if (!cart[uid]) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const item = await db.collection('warehouse').findOne({ _id: new ObjectID(id) });
        if (!item) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        if (item.amount && item.amount < count) {
            count = item.amount;
        }
        let variants = {};
        for (let j in item.variants) {
            variants[item.variants[j].d] = item.variants[j].v;
        }
        let subtotal = variants[variant] ? parseFloat(variants[variant] * count) : parseFloat(item.price * count);
        for (let p in cart[uid].checkboxes) {
            for (let i in item[locale].properties) {
                if (item[locale].properties[i].d === cart[uid].checkboxes[p]) {
                    subtotal += parseFloat(item[locale].properties[i].v) * count;
                }
            }
        }
        for (let p in cart[uid].integers) {
            const [iid, cnt] = cart[uid].integers[p].split('|');
            for (let i in item[locale].properties) {
                if (item[locale].properties[i].d === iid) {
                    subtotal += parseFloat(item[locale].properties[i].v) * parseFloat(cnt) * count;
                }
            }
        }
        subtotal = parseFloat(subtotal).toFixed(2);
        cart[uid].count = count;
        req.session.catalog_cart = cart;
        return res.send(JSON.stringify({
            status: 1,
            id: item._id,
            count: count,
            variant: variant,
            subtotal: subtotal
        }));
    };

    const cartDelete = async(req, res) => {
        res.contentType('application/json');
        if (!configModule.cart) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const id = req.body.id;
        let variant = req.body.variant;
        const count = req.body.count;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/) ||
            (variant && (typeof variant !== 'string' || !variant.match(/^[a-zA-Z0-9_]+$/) || variant.length > 64))) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        variant = variant || '';
        const uid = id + '|' + variant;
        let cart = req.session.catalog_cart || {};
        if (!cart[uid]) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        delete cart[uid];
        req.session.catalog_cart = cart;
        return res.send(JSON.stringify({
            status: 1,
            count: count
        }));
    };

    const order = async(req, res) => {
        res.contentType('application/json');
        const locale = req.session.currentLocale;
        const uprefix = i18n.getLanguageURLPrefix(req);
        let errorFields = [];
        if (!configModule.cart) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        if (!Module.isAuthorized(req) && (!req.session || req.body.captcha !== req.session.captcha)) {
            req.session.captcha = null;
            return res.send(JSON.stringify({
                status: -2,
                fields: ['captcha']
            }));
        }
        let orderData = {};
        if (!req.body.delivery || typeof req.body.delivery !== 'string') {
            return res.send(JSON.stringify({
                status: -3,
                fields: ['delivery']
            }));
        }
        const delivery = req.body.delivery;
        const deliveryData = await db.collection('warehouse_delivery').find({ status: '1' }).toArray();
        let deliveryDB = {};
        for (let i in deliveryData) {
            deliveryDB[deliveryData[i].pid] = deliveryData[i].delivery;
        }
        if (!deliveryData || !deliveryData.length) {
            return res.send(JSON.stringify({
                status: -4,
                fields: ['delivery']
            }));
        }
        let deliveryRec;
        for (let i in deliveryData) {
            if (deliveryData[i].pid === delivery) {
                deliveryRec = deliveryData[i];
            }
        }
        if (!deliveryRec) {
            return res.send(JSON.stringify({
                status: -5,
                fields: ['delivery']
            }));
        }
        orderData.email = req.body.email;
        orderData.phone = req.body.phone;
        if (!orderData.email || !orderData.phone ||
            !orderData.email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) || orderData.email.length > 100 ||
            !orderData.phone.match(/^[\+][0-9]{4,24}$/) || orderData.phone.length > 30) {
            return res.send(JSON.stringify({
                status: -6,
                fields: ['email', 'phone']
            }));
        }
        let template = await db.collection('warehouse_registry').findOne({ name: 'warehouse_address_template' });
        if (!template) {
            template = {
                data: ''
            };
        } else {
            delete template._id;
            delete template.name;
        }
        let warehouseQuery = [];
        try {
            //
            // Build orderData hash
            // 
            orderData.costs = {};
            orderData.costs.delivery = 0;
            orderData.costs.total = 0;
            orderData.costs.extra = {};
            orderData.address = {};
            orderData.delivery = deliveryRec.pid;
            orderData.cart = {};
            const addressData = await db.collection('warehouse_registry').findOne({ name: 'warehouse_address' }) || [];
            const settingsData = await _loadSettings(locale);
            const cart = req.session.catalog_cart || {};
            let weight = 0;
            let cartArr = [];
            if (Object.keys(cart).length > 0) {
                let propertiesQuery = [];
                let filter = {};
                for (let i in cart) {
                    const [id] = i.split('|');
                    if (!filter[id]) {
                        warehouseQuery.push({
                            _id: new ObjectID(id)
                        });
                        filter[id] = true;
                    }
                    for (let p in cart[i].checkboxes) {
                        propertiesQuery.push({ pid: cart[i].checkboxes[p] });
                    }
                    for (let p in cart[i].integers) {
                        const [iid] = cart[i].integers[p].split('|');
                        propertiesQuery.push({ pid: iid });
                    }
                    for (let p in cart[i].selects) {
                        const [iid] = cart[i].selects[p].split('|');
                        propertiesQuery.push({ pid: iid });
                    }
                }
                let ffields = { _id: 1, price: 1, variants: 1, sku: 1, amount: 1 };
                ffields[locale + '.title'] = 1;
                ffields[locale + '.properties'] = 1;
                const cartDB = await db.collection('warehouse').find({ $or: warehouseQuery }, { projection: ffields }).toArray();
                if (cartDB && cartDB.length) {
                    let propertiesData = {};
                    let propertiesCost = {};
                    let propertiesCount = {};
                    if (propertiesQuery.length) {
                        const propertiesDB = await db.collection('warehouse_properties').find({ $or: propertiesQuery }).toArray();
                        if (propertiesDB && propertiesDB.length) {
                            for (let i in propertiesDB) {
                                propertiesData[propertiesDB[i].pid] = propertiesDB[i].title[locale];
                            }
                        }
                    }
                    let cartData = {};
                    let variantsQuery = [];
                    for (let i in cartDB) {
                        let variants = {};
                        for (let j in cartDB[i].variants) {
                            variants[cartDB[i].variants[j].d] = cartDB[i].variants[j].v;
                            if (variantsQuery.indexOf({ pid: cartDB[i].variants[j].d }) === -1) {
                                variantsQuery.push({ pid: cartDB[i].variants[j].d });
                            }
                        }
                        if (cartDB[i][locale]) {
                            for (let p in cartDB[i][locale].properties) {
                                if (propertiesData[cartDB[i][locale].properties[p].d]) {
                                    propertiesCost[cartDB[i][locale].properties[p].d] = cartDB[i][locale].properties[p].v.match(/,/) ? cartDB[i][locale].properties[p].v : parseFloat(cartDB[i][locale].properties[p].v) || 0;
                                }
                            }
                        }
                        cartData[cartDB[i]._id] = {
                            text: cartDB[i][locale] ? cartDB[i][locale].title : '',
                            price: parseFloat(cartDB[i].price),
                            weight: cartDB[i].weight,
                            sku: cartDB[i].sku,
                            variants: variants,
                            amount: cartDB[i].amount
                        };
                    }
                    let variantsData = {};
                    if (variantsQuery.length) {
                        const dataVariants = await db.collection('warehouse_variants').find({ $or: variantsQuery }).toArray();
                        if (dataVariants) {
                            for (let i in dataVariants) {
                                variantsData[dataVariants[i].pid] = dataVariants[i].title[locale] || '';
                            }
                        }
                    }
                    // Build cartArr
                    for (let i in cart) {
                        const [id, variant] = i.split('|');
                        const item = cart[i];
                        let price = cartData[id].price;
                        if (variant && cartData[id].variants[variant]) {
                            price = parseFloat(cartData[id].variants[variant]);
                        }
                        for (let p in item.checkboxes) {
                            if (propertiesCost[item.checkboxes[p]]) {
                                price += parseFloat(propertiesCost[item.checkboxes[p]]);
                            }
                        }
                        let integersID = [];
                        for (let p in item.integers) {
                            let [iid, cnt] = item.integers[p].split('|');
                            if (!cnt) {
                                cnt = 1;
                            }
                            propertiesCount[iid] = cnt;
                            if (integersID.indexOf(iid) === -1) {
                                integersID.push(iid);
                            }
                            if (propertiesCost[iid]) {
                                price += parseFloat(propertiesCost[iid]) * parseFloat(cnt);
                            }
                        }
                        let selectsID = [];
                        let selectsTitles = {};
                        let selectsValues = {};
                        for (let p in item.selects) {
                            let [iid, cnt] = item.selects[p].split('|');
                            if (!cnt) {
                                cnt = 0;
                            }
                            const [title, valuesStr] = propertiesData[iid].split('|');
                            const values = valuesStr.split(',');
                            selectsTitles[iid] = title;
                            selectsValues[iid] = values[cnt];
                            propertiesCount[iid] = cnt;
                            if (selectsID.indexOf(iid) === -1) {
                                selectsID.push(iid);
                            }
                            if (propertiesCost[iid]) {
                                const costArr = propertiesCost[iid].split(/,/);
                                price += parseFloat(costArr[cnt]);
                            }
                        }
                        if (item.count > cartData[id].amount) {
                            return res.send(JSON.stringify({
                                status: -100,
                                error: i18n.get().__(locale, 'Some of items you purchase are not available anymore')
                            }));
                        }
                        cartArr.push({
                            id: id,
                            variant: variant,
                            variantTitle: variantsData[variant],
                            text: cartData[id].text,
                            count: item.count,
                            price: parseFloat(price).toFixed(2),
                            subtotal: parseFloat(price * item.count).toFixed(2),
                            checkboxes: item.checkboxes,
                            integers: item.integers,
                            integersID: integersID,
                            propertiesData: propertiesData,
                            propertiesCost: propertiesCost,
                            propertiesCount: propertiesCount,
                            selectsTitles: selectsTitles,
                            selectsValues: selectsValues,
                            selectsID: selectsID
                        });
                        // total += price * item.count;
                        orderData.cart[cartData[id].sku + '|' + variant] = {
                            count: item.count,
                            checkboxes: item.checkboxes,
                            integers: item.integers,
                            selects: item.selects
                        };
                        orderData.costs.total += price * item.count;
                        weight += cartData[id].weight + item.count;
                    }
                }
            } else {
                return res.send(JSON.stringify({
                    status: -101
                }));
            }
            orderData.costs.totalWares = orderData.costs.total;
            if (weight && deliveryRec.cost_weight) {
                orderData.costs.delivery = parseFloat(weight) * parseFloat(deliveryRec.cost_weight);
                orderData.costs.total += parseFloat(weight) * parseFloat(deliveryRec.cost_weight);
            }
            if (deliveryRec.cost) {
                orderData.costs.delivery += parseFloat(deliveryRec.cost);
                orderData.costs.total += parseFloat(deliveryRec.cost);
            }
            if (orderData.costs.delivery) {
                orderData.costs.delivery = parseFloat(orderData.costs.delivery).toFixed(2);
            }
            if (addressData && addressData.data && deliveryRec.delivery === 'delivery') {
                for (let i in addressData.data) {
                    const [field, flag] = addressData.data[i].split('|');
                    const mandatory = flag === 'm' ? true : false;
                    const ai = _getJsonAddressById(field);
                    if (mandatory && (!req.body[field] || typeof req.body[field] !== 'string')) {
                        errorFields.push(field);
                        continue;
                    }
                    let val = req.body[field];
                    if (val && typeof val === 'string') {
                        val = val.replace(/&/gm, '&amp;');
                        val = val.replace(/\"/gm, '&quot;');
                        val = val.replace(/\</gm, '&lt;');
                        val = val.replace(/\>/gm, '&gt;');
                        if (ai.maxlength && val.length > ai.maxlength) {
                            errorFields.push(field);
                            continue;
                        }
                        if (ai.regex && !val.match(new RegExp(ai.regex))) {
                            errorFields.push(field);
                            continue;
                        }
                        if (ai.type === 'select') {
                            for (let s in ai.values) {
                                let item = ai.values[s];
                                if (item.value === val) {
                                    orderData.address[field] = val;
                                    if (item.cost) {
                                        orderData.costs.total += parseFloat(item.cost);
                                        orderData.costs.extra[ai.id] = parseFloat(item.cost);
                                    }
                                    if (item.addPrc) {
                                        orderData.costs.total += parseFloat(orderData.costs.totalWares) / 100 * parseFloat(item.addPrc);
                                        if (!orderData.costs.extra[ai.id]) {
                                            orderData.costs.extra[ai.id] = 0;
                                        }
                                        orderData.costs.extra[ai.id] += parseFloat(orderData.costs.totalWares) / 100 * parseFloat(item.addPrc);
                                    }
                                    if (orderData.costs.extra[ai.id]) {
                                        orderData.costs.extra[ai.id] = parseFloat(orderData.costs.extra[ai.id]).toFixed(2);
                                    }
                                    break;
                                }
                            }
                            if (!orderData.address[field]) {
                                errorFields.push(field);
                                continue;
                            }
                        }
                        if (ai.type === 'text') {
                            orderData.address[field] = val;
                        }
                    }
                }
            }
            if (errorFields.length) {
                return res.send(JSON.stringify({
                    status: -7,
                    fields: errorFields
                }));
            }
            orderData.costs.delivery = parseFloat(orderData.costs.delivery).toFixed(2);
            orderData.costs.total = parseFloat(orderData.costs.total).toFixed(2);
            orderData.costs.totalWares = parseFloat(orderData.costs.totalWares).toFixed(2);
            orderData.status = 1;
            orderData.date = Date.now() / 1000 | 0;
            if (req.session && req.session.auth && req.session.auth.username) {
                orderData.username = req.session.auth.username;
            }
            const incr = await db.collection('warehouse_counters').findAndModify({ _id: 'orders' }, [], { $inc: { seq: 1 } }, { new: true, upsert: true });
            if (!incr || !incr.value || !incr.value.seq) {
                return res.send(JSON.stringify({
                    status: -8
                }));
            }
            orderData._id = incr.value.seq;
            orderData.paid = false;
            orderData.locale = locale;
            // orderData.hidden = configModule.payBeforeOrderIsPlaced ? true : false;
            //
            // Decrement amounts
            //
            if (warehouseQuery && warehouseQuery.length) {
                await db.collection('warehouse').update({ $or: warehouseQuery }, { $inc: { amount: -1 } });
            }
            //
            // Insert order to the database
            // 
            const insResult = await db.collection('warehouse_orders').insertOne(orderData);
            if (!insResult || !insResult.result || !insResult.result.ok) {
                return res.send(JSON.stringify({
                    status: -9
                }));
            }
            // 
            // Clean up the Cart
            //
            req.session.catalog_cart = {};
            //
            // Update the users collection
            //
            if (req.session && req.session.auth && req.session.auth._id) {
                await db.collection('users').update({ _id: req.session.auth._id }, {
                    $set: {
                        warehouse: {
                            email: orderData.email,
                            phone: orderData.phone
                        }
                    }
                }, { upsert: true });
            }
            // 
            // Send mail
            //
            let deliveryArr = [];
            for (let i in orderData.costs.extra) {
                let item = _getJsonAddressById(i);
                if (item) {
                    deliveryArr.push({
                        title: item.label[locale] || '',
                        cost: orderData.costs.extra[i]
                    });
                }
            }
            let addressHTML = '';
            if (deliveryDB[orderData.delivery] === 'delivery') {
                const addressDataG = _getJsonAddressSelectDataByValue(locale);
                for (let i in orderData.address) {
                    if (addressDataG[i] && addressDataG[i][orderData.address[i]]) {
                        orderData.address[i] = addressDataG[i][orderData.address[i]];
                    }
                }
                addressHTML = _processTemplate(template.data, orderData.address);
            }
            const viewURL = config.website.protocol + '://' + config.website.url[locale] + uprefix + configModule.prefix + '/orders?action=view&id=' + orderData._id;
            const payURL = config.website.protocol + '://' + config.website.url[locale] + uprefix + configModule.prefix + '/payment?id=' + orderData._id;
            let mailUserHTML = await render.file('mail_neworder_user.html', {
                i18n: i18n.get(),
                locale: locale,
                auth: req.session.auth ? true : false,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                cart: cartArr,
                settings: settingsData,
                orderData: orderData,
                delivery: deliveryArr,
                configModule: configModule,
                addressHTML: addressHTML,
                viewURL: viewURL,
                payURL: payURL,
                orderStatus: i18n.get().__(locale, 'orderStatuses')[orderData.status]
            });
            let mailAdminHTML = await render.file('mail_neworder_admin.html', {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                cart: cartArr,
                settings: settingsData,
                orderData: orderData,
                delivery: deliveryArr,
                configModule: configModule,
                addressHTML: addressHTML,
                orderStatus: i18n.get().__(locale, 'orderStatuses')[orderData.status]
            });
            try {
                let email;
                if (req.session.auth && req.session.auth.email) {
                    email = req.session.auth.email;
                }
                if (orderData.email) {
                    email = orderData.email;
                }
                await mailer.send(req, email, i18n.get().__(locale, 'Your order confirmation'), mailUserHTML);
                if (config.website.email.feedback) {
                    await mailer.send(req, config.website.email.feedback, i18n.get().__(locale, 'New order on your website'), mailAdminHTML);
                }
            } catch (e) {
                log.error(e);
            }
            return res.send(JSON.stringify({
                status: 1,
                order: orderData
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const ordersList = async(req, res) => {
        const locale = req.session.currentLocale;
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req) || !configModule.cart) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || '_id';
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
        if (sortOrderFields.indexOf(sortField) === -1) {
            result.failedField = 'sortField';
            return res.send(result);
        }
        let fquery = {
            // hidden: false
        };
        try {
            if (search) {
                fquery.$or = [
                    { _id: parseInt(search, 10) },
                    { username: { $regex: search, $options: 'i' } }
                ];
            }
            let ffields = { _id: 1, date: 1, username: 1, costs: 1, status: 1 };
            const total = await db.collection('warehouse_orders').find(fquery).count();
            const items = await db.collection('warehouse_orders').find(fquery, { skip: skip, limit: limit, sort: sort, projection: ffields }).toArray();
            for (let i in items) {
                if (items[i][locale]) {
                    items[i].title = items[i][locale].title;
                    delete items[i][locale].title;
                    delete items[i][locale];
                }
            }
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

    const delOrder = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req) || !configModule.cart) {
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
            if (!id.match(/^[0-9]+$/)) {
                output.status = -2;
                return res.send(JSON.stringify(output));
            }
            did.push({ _id: parseInt(id, 10) });
        }
        try {
            const delResult = await db.collection('warehouse_orders').deleteMany({
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

    const loadOrder = async(req, res) => {
        res.contentType('application/json');
        if (!configModule.cart) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const id = req.body.id;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/)) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const item = await db.collection('warehouse_orders').findOne({ _id: parseInt(id, 10) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            if (!Module.isAuthorizedAdmin(req)) {
                if (!Module.isAuthorized(req) || req.session.auth.username !== item.username) {
                    return res.send(JSON.stringify({
                        status: -3
                    }));
                }
            }
            const deliveryDB = await db.collection('warehouse_delivery').findOne({ pid: item.delivery });
            if (!deliveryDB) {
                return res.send(JSON.stringify({
                    status: -4
                }));
            }
            let querySKU = [];
            let propertiesQuery = [];
            for (let i in item.cart) {
                const [iid] = i.split('|');
                querySKU.push({
                    sku: { $eq: iid }
                });
                for (let p in item.cart[i].checkboxes) {
                    if (propertiesQuery.indexOf({ pid: item.cart[i].checkboxes[p] }) === -1) {
                        propertiesQuery.push({ pid: item.cart[i].checkboxes[p] });
                    }
                }
                for (let p in item.cart[i].integers) {
                    const [jid] = item.cart[i].integers[p].split('|');
                    if (propertiesQuery.indexOf({ pid: jid }) === -1) {
                        propertiesQuery.push({ pid: jid });
                    }
                }
                for (let p in item.cart[i].selects) {
                    const [jid] = item.cart[i].selects[p].split('|');
                    if (propertiesQuery.indexOf({ pid: jid }) === -1) {
                        propertiesQuery.push({ pid: jid });
                    }
                }
            }
            let ffields = { _id: 1, sku: 1, variants: 1 };
            ffields[locale + '.title'] = 1;
            ffields[locale + '.properties'] = 1;
            const cartDB = querySKU && querySKU.length ? await db.collection('warehouse').find({ $or: querySKU }, { projection: ffields }).toArray() : {};
            let cartData = {};
            let variantsQuery = [];
            let variants = {};
            let propertiesData = {};
            if (cartDB) {
                if (propertiesQuery.length) {
                    const propertiesDB = await db.collection('warehouse_properties').find({ $or: propertiesQuery }).toArray();
                    if (propertiesDB && propertiesDB.length) {
                        for (let i in propertiesDB) {
                            propertiesData[propertiesDB[i].pid] = propertiesDB[i].title[locale];
                        }
                    }
                }
                for (let i in cartDB) {
                    if (cartDB[i][locale]) {
                        cartData[cartDB[i].sku] = cartDB[i][locale].title;
                    }
                    for (let j in cartDB[i].variants) {
                        if (variantsQuery.indexOf({ pid: cartDB[i].variants[j].d }) === -1) {
                            variantsQuery.push({ pid: cartDB[i].variants[j].d });
                        }
                    }
                }
            }
            let addressData = {};
            for (let i in jsonAddress) {
                const iitem = jsonAddress[i];
                addressData[iitem.id] = iitem.label[locale] || '';
            }
            // Variants                        
            if (variantsQuery.length) {
                const dataVariants = await db.collection('warehouse_variants').find({ $or: variantsQuery }).toArray();
                if (dataVariants && dataVariants.length) {
                    for (let i in dataVariants) {
                        variants[dataVariants[i].pid] = dataVariants[i].title[locale];
                    }
                }
            }
            return res.send(JSON.stringify({
                status: 1,
                item: item,
                cartData: cartData,
                addressData: addressData,
                variants: variants,
                propertiesData: propertiesData,
                delivery: deliveryDB
            }));
        } catch (e) {
            log.error(e);
            res.send(JSON.stringify({
                status: -5,
                error: e.message
            }));
        }
    };

    const saveOrder = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req) || !configModule.cart) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        let id = req.body.id;
        const data = req.body.data;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/) ||
            !data || typeof data !== 'object') {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        data.paid = data.paid === 'true' ? true : false;
        data.status = parseInt(data.status, 10);
        data.date = parseInt(data.date, 10);
        id = parseInt(id, 10);
        try {
            const order = await db.collection('warehouse_orders').findOne({ _id: id });
            if (!order) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let diff = {};
            if (order.status !== data.status) {
                diff.status = i18n.get().__(locale, 'orderStatuses')[data.status];
            }
            if (order.tracking !== data.tracking) {
                diff.tracking = data.tracking;
            }
            if (order.paid !== data.paid) {
                diff.paid = data.paid ? 2 : 1;
            }
            const updResult = await db.collection('warehouse_orders').update({ _id: id }, { $set: data }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (Object.keys(diff).length && data.email) {
                let mailUserHTML = await render.file('mail_orderchanged_user.html', {
                    i18n: i18n.get(),
                    locale: locale,
                    lang: JSON.stringify(i18n.get().locales[locale]),
                    config: config,
                    diff: diff,
                    orderData: order
                });
                await mailer.send(req, data.email, i18n.get().__(locale, 'Order Update'), mailUserHTML);
            }
            return res.send(JSON.stringify({
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

    const returnOrder = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req) || !configModule.cart) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        let id = req.body.id;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/)) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const order = await db.collection('warehouse_orders').findOne({ _id: parseInt(id, 10) });
            if (!order) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            for (let i in order.cart) {
                const [cid] = i.split('|');
                const count = order.cart[i].count;
                await db.collection('warehouse').update({ sku: cid }, { $inc: { amount: parseInt(count, 10) } });
            }
            await db.collection('warehouse_orders').update({ _id: parseInt(id, 10) }, { $set: { status: 0, cart: {} } });
            return res.send(JSON.stringify({
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

    const orders = async(req, res) => {
        const locale = req.session.currentLocale;
        res.contentType('application/json');
        if (!Module.isAuthorized(req) || !configModule.cart) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let result = {
            status: 0
        };
        const sortField = req.query.sortField || '_id';
        const sortDirection = (req.query.sortDirection === 'asc') ? 1 : -1;
        const sort = {};
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
        if (sortOrdersFields.indexOf(sortField) === -1) {
            result.failedField = 'sortField';
            return res.send(result);
        }
        let fquery = {
            username: req.session.auth.username
        };
        try {
            let ffields = { _id: 1, date: 1, costs: 1, status: 1 };
            const total = await db.collection('warehouse_orders').find(fquery).count();
            const items = await db.collection('warehouse_orders').find(fquery, { skip: skip, limit: limit, sort: sort, projection: ffields }).toArray();
            for (let i in items) {
                if (items[i][locale]) {
                    items[i].title = items[i][locale].title;
                    delete items[i][locale].title;
                    delete items[i][locale];
                }
            }
            res.send(JSON.stringify({
                status: 1,
                count: items.length,
                total: total,
                items: items
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const loadItemData = async(req, res) => {
        const locale = req.session.currentLocale;
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sku = req.body.sku;
        if (!sku || typeof sku !== 'string' || !sku.match(/^[A-Za-z0-9_\-\.]{1,64}$/)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            // Find item by SKU
            const data = await db.collection('warehouse').findOne({ sku: sku });
            if (!data) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let variantsQuery = [];
            for (let i in data.variants) {
                variantsQuery.push({ pid: data.variants[i].d });
            }
            let variantsData = {};
            if (variantsQuery.length > 0) {
                const variants = await db.collection('warehouse_variants').find({ $or: variantsQuery }).toArray();
                for (let p in variants) {
                    variantsData[variants[p].pid] = variants[p].title[locale] || '';
                }
            }
            let propertiesQuery = [];
            let propertiesData = {};
            let checkboxes = [];
            let integers = [];
            let selects = [];
            if (data[locale]) {
                for (let i in data[locale].properties) {
                    propertiesQuery.push({ pid: data[locale].properties[i].d });
                }
            }
            if (propertiesQuery.length > 0) {
                const properties = await db.collection('warehouse_properties').find({ $or: propertiesQuery }).toArray();
                for (let p in properties) {
                    if (properties[p].type === '2' || properties[p].type === '3' || properties[p].type === '4') {
                        propertiesData[properties[p].pid] = properties[p].title[locale] || '';
                        switch (properties[p].type) {
                            case '2':
                                checkboxes.push(properties[p].pid);
                                break;
                            case '3':
                                integers.push(properties[p].pid);
                                break;
                            default:
                                selects.push(properties[p].pid);
                                break;
                        }
                    }
                }
            }
            res.send(JSON.stringify({
                status: 1,
                data: {
                    sku: data.sku,
                    title: data[locale] ? data[locale].title : '',
                    variants: variantsData,
                    checkboxes: checkboxes,
                    integers: integers,
                    selects: selects,
                    properties: propertiesData
                }
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    let router = Router();
    router.get('/list', list);
    router.get('/list/properties', listProperties);
    router.get('/list/collections', listCollections);
    router.get('/list/variantscollections', listVariantsCollections);
    router.get('/list/variants', listVariants);
    router.get('/list/delivery', listDelivery);
    router.get('/load', load);
    router.get('/load/property', loadProperty);
    router.get('/load/variant', loadVariant);
    router.get('/load/collection', loadCollection);
    router.get('/load/variantcollection', loadVariantCollection);
    router.get('/load/collection/data', loadCollectionData);
    router.get('/load/variantcollection/data', loadVariantCollectionData);
    router.get('/load/variant/data', loadVariantData);
    router.get('/load/delivery', loadDelivery);
    router.get('/load/address', loadAddress);
    router.post('/save', save);
    router.post('/save/property', saveProperty);
    router.post('/save/collection', saveCollection);
    router.post('/save/variantcollection', saveVariantCollection);
    router.post('/save/variant', saveVariant);
    router.post('/save/delivery', saveDelivery);
    router.post('/save/address', saveAddress);
    router.get('/create', create);
    router.post('/delete', del);
    router.post('/delete/property', delProperty);
    router.post('/delete/collection', delCollection);
    router.post('/delete/variant', delVariant);
    router.post('/delete/variantcollection', delVariantCollection);
    router.post('/folders', folders);
    router.post('/settings', settings);
    router.post('/repair', repair);
    router.post('/rebuild', rebuild);
    router.post('/upload', upload);
    router.post('/images/delete', delImages);
    router.post('/images/save', saveImages);
    router.post('/import/properties', importProperties);
    router.get('/import/properties/state', importPropertiesState);
    router.post('/import/collections', importCollections);
    router.get('/import/collections/state', importCollectionsState);
    router.post('/import/variants', importVariants);
    router.get('/import/variants/state', importVariantsState);
    router.post('/import/variantscollections', importVariantsCollections);
    router.get('/import/variantscollections/state', importVariantsCollectionsState);
    // Browser routes
    router.all('/browse/list', browseList);
    router.all('/browse/folder/create', browseFolderCreate);
    router.all('/browse/rename', browseRename);
    router.all('/browse/delete', browseDelete);
    router.all('/browse/paste', browsePaste);
    router.all('/browse/upload', browseUpload);
    // Orders routes
    router.get('/orders', orders);
    router.all('/orders/list', ordersList);
    router.post('/orders/delete', delOrder);
    router.post('/orders/load', loadOrder);
    router.post('/orders/save', saveOrder);
    router.post('/orders/return', returnOrder);
    router.post('/orders/load/item', loadItemData);
    // Frontend routes
    router.post('/cart/add', cartAdd);
    router.post('/cart/count', cartCount);
    router.post('/cart/delete', cartDelete);
    router.post('/order', order);
    return {
        routes: router
    };
};