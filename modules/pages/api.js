const pathM = require('path');
const Module = require('../../core/module.js');
const validation = new(require('../../core/validation.js'))();
const Router = require('co-router');
const ObjectID = require('mongodb').ObjectID;
const pagesFields = require('./schemas/pagesFields.js');
const config = require('../../core/config.js');
const fs = require('fs-extra');
const Jimp = require('jimp');
const imageType = require('image-type');

module.exports = function(app) {
    const log = app.get('log');
    const db = app.get('db');
    const sortFields = ['name', 'folder', 'title', 'status'];

    const list = async(req, res) => {
        const locale = req.session.currentLocale;
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
                        { name: { $regex: search, $options: 'i' } }
                    ]
                };
                let tfq = {};
                tfq[locale + '.title'] = { $regex: search, $options: 'i' };
                fquery.$or.push(tfq);
            }
            let ffields = { _id: 1, folder: 1, name: 1, status: 1 };
            ffields[locale + '.title'] = 1;
            const total = await db.collection('pages').find(fquery).count();
            const items = await db.collection('pages').find(fquery, { skip: skip, limit: limit, sort: sort, projection: ffields }).toArray();
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
            const item = await db.collection('pages').findOne({ _id: new ObjectID(id) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: 0
                }));
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

    const foldersFunc = async(req, res) => {
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
            const updResult = await db.collection('pages_registry').update({ name: 'pagesFolders' }, { name: 'pagesFolders', data: json }, { upsert: true });
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
        const fieldList = pagesFields.getPagesFields(config.core && config.core.regexp && config.core.regexp.pageID ? JSON.stringify(config.core.regexp) : '{"pageID":"^[A-Za-z0-9_\\\\-]+$","pageURL":"^[A-Za-z0-9_\\\\-\\/]+$"}');
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
                    data[lng] = {
                        title: fields.title.value,
                        keywords: (fields.keywords ? fields.keywords.value : ''),
                        description: (fields.description ? fields.description.value : ''),
                        content: (fields.content ? fields.content.value : '')
                    };
                    data.folder = fields.folder.value;
                    data.url = fields.url.value;
                    data.name = fields.name.value;
                    data.status = fields.status.value;
                    data.template = fields.template.value;
                }
            }
            if (id) {
                if (config.demo && data.folder === '1' && data.name === '') {
                    output.status = -1;
                    return res.send(JSON.stringify(output));
                }
                let page = await db.collection('pages').findOne({ _id: new ObjectID(id) });
                if (!page) {
                    output.status = -1;
                    output.fields = ['name', 'folder'];
                    return res.send(JSON.stringify(output));
                }
                let duplicate = await db.collection('pages').findOne({ folder: data.folder, name: data.name });
                if (duplicate && JSON.stringify(duplicate._id) !== JSON.stringify(page._id)) {
                    output.status = -2;
                    output.fields = ['name', 'folder'];
                    return res.send(JSON.stringify(output));
                }
            } else {
                let duplicate = await db.collection('pages').findOne({ folder: data.folder, name: data.name });
                if (duplicate) {
                    output.status = -2;
                    output.fields = ['name', 'folder'];
                    return res.send(JSON.stringify(output));
                }
            }
            let what = id ? { _id: new ObjectID(id) } : { name: data.name, folder: data.folder };
            let updResult = await db.collection('pages').update(what, { $set: data }, { upsert: true });
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
                did.push({ _id: new ObjectID(id), url: { $ne: '' } });
            } else {
                did.push({ _id: new ObjectID(id) });
            }
        }
        try {
            const delResult = await db.collection('pages').deleteMany({
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
            let browsePath = pathM.join(...dirArr);
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
                let stat = await fs.lstat(pathM.join(...dirArr, filesData[f]));
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
                item.ext = pathM.extname(filesData[f]);
                if (item.ext && typeof item.ext === 'string') {
                    item.ext = item.ext.replace(/^\./, '').toLowerCase();
                }
                try {
                    await fs.access(pathM.join(...dirArr, '___tn_' + filesData[f]), fs.constants.F_OK);
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
            let browsePath = pathM.join(...dirArr);
            try {
                await fs.access(browsePath, fs.constants.F_OK);
            } catch (e) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            await fs.mkdir(pathM.join(browsePath, name));
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
            let browsePath = pathM.join(...dirArr);
            try {
                await fs.access(browsePath, fs.constants.F_OK);
            } catch (e) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            await fs.rename(pathM.join(browsePath, nameOld), pathM.join(browsePath, nameNew));
            try {
                await fs.rename(pathM.join(browsePath, '___tn_' + nameOld), pathM.join(browsePath, '___tn_' + nameNew));
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
            let browsePath = pathM.join(...dirArr);
            try {
                await fs.access(browsePath, fs.constants.F_OK);
            } catch (e) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            for (let i in files) {
                let file = files[i];
                await fs.remove(pathM.join(browsePath, file));
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
            let browseSrcPath = pathM.join(...dirSrcArr);
            let browseDestPath = pathM.join(...dirDestArr);
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
                    await fs.copy(pathM.join(browseSrcPath, file), pathM.join(browseDestPath, file));
                    try {
                        await fs.copy(pathM.join(browseSrcPath, '___tn_' + file), pathM.join(browseDestPath, '___tn_' + file));
                    } catch (e) {
                        // Ignore
                    }
                } else {
                    await fs.move(pathM.join(browseSrcPath, file), pathM.join(browseDestPath, file), { overwrite: true });
                    try {
                        await fs.move(pathM.join(browseSrcPath, '___tn_' + file), pathM.join(browseDestPath, '___tn_' + file), { overwrite: true });
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
        let path = _path || [];
        path.push(node.text);
        if (node.parent !== '#') {
            path = _treePath(tree, node.parent, path);
        }
        return path;
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
        let browsePath = pathM.join(...dirArr);
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
                            await fs.writeFile(pathM.join(browsePath, '___tn_' + req.files.file.name), buf);
                        }
                    }
                } catch (e) {
                    // Ignore
                }
            }
            await fs.writeFile(pathM.join(browsePath, req.files.file.name), req.files.file.data);
        } catch (e) {
            return res.send(JSON.stringify({
                status: -3
            }));
        }
        return res.send(JSON.stringify({
            status: 1
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
            const foldersString = await db.collection('pages_registry').findOne({ name: 'pagesFolders' });
            if (!foldersString || !foldersString.data) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            const folders = JSON.parse(foldersString.data);
            let path = _treePath(folders, folder);
            path = path.reverse();
            path.shift();
            path = pathM.join('/');
            let farr = [];
            for (let i in folders) {
                farr.push({
                    folder: {
                        $ne: folders[i].id
                    }
                });
            }
            const count = await db.collection('pages').find({ $and: farr }, { _id: 1 }).count();
            if (count) {
                const updResult = await db.collection('pages').update({ $and: farr }, { $set: { folder: folder, folderVal: path } }, { upsert: true });
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
            const foldersString = await db.collection('pages_registry').findOne({ name: 'pagesFolders' });
            if (!foldersString || !foldersString.data) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            const folders = JSON.parse(foldersString.data);
            const items = await db.collection('pages').find({}, { folder: 1, url: 1 }).toArray();
            if (items && items.length) {
                for (let i in items) {
                    let item = items[i];
                    let path = _treePath(folders, item.folder);
                    path = path.reverse();
                    path.shift();
                    path = pathM.join('/');
                    if (item.url !== path) {
                        const updResult = await db.collection('pages').update({ _id: item._id }, { $set: { url: path } }, { upsert: true });
                        if (!updResult || !updResult.result || !updResult.result.ok) {
                            return res.send(JSON.stringify({
                                status: 0
                            }));
                        }
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

    let router = Router();
    router.get('/list', list);
    router.get('/load', load);
    router.post('/save', save);
    router.post('/delete', del);
    router.post('/folders', foldersFunc);
    router.post('/repair', repair);
    router.post('/rebuild', rebuild);
    router.all('/browse/list', browseList);
    router.all('/browse/folder/create', browseFolderCreate);
    router.all('/browse/rename', browseRename);
    router.all('/browse/delete', browseDelete);
    router.all('/browse/paste', browsePaste);
    router.all('/browse/upload', browseUpload);

    return {
        routes: router
    };
};