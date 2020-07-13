const path = require('path');
const Module = require('../../core/module.js');
const Router = require('co-router');
const ObjectID = require('mongodb').ObjectID;
const config = require('../../core/config.js');
const fs = require('fs-extra');
const tar = require('tar');
const crypto = require('crypto');

module.exports = function(app) {
    const log = app.get('log');
    const db = app.get('db');

    const create = async(req, res) => {
        const modulesBackup = req.body.modules;
        if (modulesBackup && typeof modulesBackup !== 'object') {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const insResult = await db.collection('backup_tasks').insertOne({
                state: 1
            });
            if (!insResult || !insResult.result || !insResult.result.ok || !insResult.insertedId) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            const taskId = insResult.insertedId;
            setTimeout(async function() {
                try {
                    await fs.ensureDir(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId));
                    const modules = app.get('modules');
                    let backupData = [];
                    let files = ['backup.json'];
                    for (let i in modules) {
                        if (modulesBackup.indexOf(modules[i]) === -1) {
                            continue;
                        }
                        let data;
                        try {
                            data = await fs.readJson(path.join(__dirname, '..', '..', 'modules', modules[i], 'backup.json'));
                        } catch (e) {
                            // ignored
                        }
                        if (data) {
                            try {
                                await fs.ensureDir(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId, modules[i]));
                                files.push(modules[i]);
                                for (let j in data.items) {
                                    const item = data.items[j];
                                    switch (item.type) {
                                        case 'directory':
                                            for (let k in item.directories) {
                                                await fs.copy(item.root ? path.join(__dirname, '..', '..', item.directories[k]) :
                                                    path.join(__dirname, '..', '..', 'modules', modules[i], item.directories[k]),
                                                    path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId, modules[i], item.directories[k]));
                                                backupData.push({
                                                    action: 'directory',
                                                    root: item.root ? true : false,
                                                    module: modules[i],
                                                    path: item.root ? item.directories[k] : path.join(modules[i], item.directories[k])
                                                });
                                            }
                                            break;
                                        case 'mongo':
                                            for (let c in item.collections) {
                                                const cdata = await db.collection(item.collections[c]).find({}).toArray();
                                                await fs.writeJson(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId, modules[i], 'mongo_' + item.collections[c]), cdata);
                                                backupData.push({
                                                    action: 'mongo',
                                                    module: modules[i],
                                                    from: 'mongo_' + item.collections[c],
                                                    collection: item.collections[c]
                                                });
                                            }
                                            break;
                                        case 'file':
                                            for (let f in item.files) {
                                                const filename = item.files[f].replace(/^.*[\\\/]/, '');
                                                const hash = crypto.createHash('md5').update(String(Date.now()) + modules[i] + filename).digest('hex');
                                                try {
                                                    await fs.copy(item.root ? path.join(__dirname, '..', '..', item.files[f]) :
                                                        path.join(__dirname, '..', '..', 'modules', modules[i], item.files[f]),
                                                        path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId, modules[i], hash));
                                                    backupData.push({
                                                        action: 'file',
                                                        module: modules[i],
                                                        filename: hash,
                                                        root: item.root ? true : false,
                                                        path: item.root ? item.files[f] : path.join(modules[i], item.files[f])
                                                    });
                                                } catch (e) {
                                                    log.error('File ' + filename + ' could not be copied');
                                                }
                                            }
                                            break;
                                        default:
                                            log.error('Unknown backup type: ' + item.type);
                                    }
                                }
                                await fs.writeJson(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId, 'backup.json'), backupData);
                            } catch (e) {
                                log.error('Could not backup ' + modules[i]);
                                log.error(e);
                            }
                        }
                    }
                    await tar.c({
                        gzip: true,
                        cwd: path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId),
                        file: path.join(__dirname, 'static', 'storage', 'backup_' + taskId + '.tgz')
                    }, files);
                    await fs.remove(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId));
                    await db.collection('backup_tasks').update({ _id: new ObjectID(taskId) }, { $set: { state: 3 } }, { upsert: true });
                } catch (e) {
                    log.error('Could not create a backup');
                    log.error(e);
                    await db.collection('backup_tasks').update({ _id: new ObjectID(taskId) }, { $set: { state: 0 } }, { upsert: true });
                    try {
                        await fs.remove(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId + '.tgz'));
                    } catch (ex) {
                        // Ignored
                    }
                    try {
                        await fs.remove(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId));
                    } catch (ex) {
                        // Ignored
                    }
                }
            }, 0);
            res.send(JSON.stringify({
                status: 1,
                taskId: taskId
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const createState = async(req, res) => {
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
            const item = await db.collection('backup_tasks').findOne({ _id: new ObjectID(id) });
            if (!item || !item.state) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (item.state === 3 && item.taskId) {
                try {
                    await db.collection('backup_tasks').remove({ _id: new ObjectID(id) });
                } catch (e) {
                    log.error(e);
                    // Ignore
                }
            }
            if ((item.state === 3 || item.state === 0) && id) {
                await db.collection('backup_tasks').remove({ _id: new ObjectID(id) });
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

    const restore = async(req, res) => {
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
            const insResult = await db.collection('backup_tasks').insertOne({
                state: 1
            });
            if (!insResult || !insResult.result || !insResult.result.ok || !insResult.insertedId) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            const taskId = insResult.insertedId;
            const tempFile = path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId + '.tgz');
            await fs.writeFile(tempFile, req.files['files[]'].data);
            setTimeout(async function() {
                try {
                    await fs.ensureDir(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId));
                    await tar.x({
                        file: path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId + '.tgz'),
                        C: path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId)
                    });
                    await fs.remove(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId + '.tgz'));
                    const data = await fs.readJson(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId, 'backup.json'));
                    for (let i in data) {
                        const item = data[i];
                        switch (item.action) {
                            case 'directory':
                                item.path = item.path.replace(/\\/gm, '/');
                                await fs.copy(item.root ? path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId, item.module, item.path) :
                                    path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId, item.path),
                                    item.root ? path.join(__dirname, '..', '..', item.path) :
                                    path.join(__dirname, '..', '..', 'modules', item.path));
                                break;
                            case 'file':
                                item.path = item.path.replace(/\\/gm, '/');
                                await fs.copy(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId, item.module, item.filename),
                                    item.root ? path.join(__dirname, '..', '..', item.path) :
                                    path.join(__dirname, '..', '..', 'modules', item.path));
                                break;
                            case 'mongo':
                                const dbdata = await fs.readJson(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId, item.module, item.from));
                                for (let j in dbdata) {
                                    if (dbdata[j]._id && typeof dbdata[j]._id === 'string' && dbdata[j]._id.match(/^[a-f0-9]{24}$/)) {
                                        try {
                                            const oid = new ObjectID(dbdata[j]._id);
                                            dbdata[j]._id = oid;
                                        } catch (ex) {
                                            // ignore
                                        }
                                    }
                                }
                                if (dbdata && dbdata.length > 0) {
                                    await db.collection(item.collection).remove({});
                                    await db.collection(item.collection).insert(dbdata);
                                }
                                break;
                            default:
                                log.error('Unknown action in backup file');
                        }
                    }
                    await fs.remove(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId));
                    await db.collection('backup_tasks').update({ _id: new ObjectID(taskId) }, { $set: { state: 3 } }, { upsert: true });
                } catch (e) {
                    log.error('Could not restore a backup');
                    log.error(e);
                    await db.collection('backup_tasks').update({ _id: new ObjectID(taskId) }, { $set: { state: 0 } }, { upsert: true });
                    try {
                        await fs.remove(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId + '.tgz'));
                    } catch (ex) {
                        // Ignored
                    }
                    try {
                        await fs.remove(path.join(__dirname, '..', '..', 'temp', 'backup_' + taskId));
                    } catch (ex) {
                        // Ignored
                    }
                }
            }, 0);
            return res.send(JSON.stringify({
                status: 1,
                taskId: taskId
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const restoreState = async(req, res) => {
        res.contentType('application/json');
        const id = req.query.id;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const item = await db.collection('backup_tasks').findOne({ _id: new ObjectID(id) });
            if (!item || !item.state) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (item.state === 3 || item.state === 0) {
                await db.collection('backup_tasks').remove({ _id: new ObjectID(id) });
                if (item.state === 3) {
                    try {
                        fs.remove(path.join(__dirname, '..', '..', 'temp', 'backup_' + id));
                    } catch (e) {
                        log.error(e);
                        // Ignore
                    }
                    Module.logout(req);
                    setTimeout(() => {
                        process.exit(0);
                    }, 3000);
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

    let router = Router();
    router.post('/create', create);
    router.get('/create/state', createState);
    router.post('/restore', restore);
    router.get('/restore/state', restoreState);
    return {
        routes: router
    };
};