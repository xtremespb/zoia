const Module = require('../../core/module.js');
const validation = new(require('../../core/validation.js'))();
const Router = require('co-router');
const blogFields = require('./schemas/blogFields.js');
const config = require('../../core/config.js');
const ObjectID = require('mongodb').ObjectID;

module.exports = function(app) {
    const log = app.get('log');
    const db = app.get('db');
    const sortFields = ['timestamp', 'title', 'status', '_id'];
    const security = new(require('../../core/security.js'))(app);
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);

    const list = async(req, res) => {
        const locale = req.session.currentLocale;
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const sortField = req.query.sortField || 'date';
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
                fquery.$or = [];
                if (search.match(/^[0-9]+$/)) {
                    fquery.$or.push({ _id: parseInt(search, 10) });
                }
                let tfq = {};
                tfq[locale + '.title'] = { $regex: search, $options: 'i' };
                fquery.$or.push(tfq);
            }
            let ffields = { _id: 1, status: 1, timestamp: 1 };
            ffields[locale + '.title'] = 1;
            const total = await db.collection('blog').find(fquery).count();
            const items = await db.collection('blog').find(fquery, { skip: skip, limit: limit, sort: sort, projection: ffields }).toArray();
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
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]{1,10}$/)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        try {
            const item = await db.collection('blog').findOne({ _id: parseInt(id, 10) });
            if (!item) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            for (let i in config.i18n.locales) {
                let lng = config.i18n.locales[i];
                if (!item[lng]) {
                    item[lng] = {
                        content_p1: '',
                        content_p2: ''
                    };
                }
                item[lng].content = item[lng].content_p1 + (item[lng].content_p2 && item[lng].content_p2.length ? '{{cut}}' + item[lng].content_p2 : '');
                delete item[lng].content_p1;
                delete item[lng].content_p2;
                item[lng].keywords = Array.isArray(item[lng].keywords) ? item[lng].keywords.join(',') : '';
            }
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

    const save = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const postId = req.body.id;
        if (postId && (typeof postId !== 'string' || !postId.match(/^[0-9]{1,10}$/))) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const fieldList = blogFields.getBlogFields();
        let output = {};
        let data = {};
        try {
            let fields = {};
            for (let i in config.i18n.locales) {
                let lng = config.i18n.locales[i];
                data[lng] = {};
                if (req.body[lng]) {
                    fields = validation.checkRequest(req.body[lng], fieldList);
                    let fieldsFailed = validation.getCheckRequestFailedFields(fields);
                    if (fieldsFailed.length > 0) {
                        output.status = 0;
                        output.fields = fieldsFailed;
                        return res.send(JSON.stringify(output));
                    }
                    let content_p1 = fields.content.value;
                    let content_p2 = '';
                    let cut = false;
                    if (fields.content.value.match(/{{cut}}/)) {
                        [content_p1, content_p2] = fields.content.value.split(/{{cut}}/);
                        cut = true;
                    }
                    const keywords = fields.keywords.value.split(/,/);
                    data[lng] = {
                        title: fields.title.value,
                        keywords: keywords,
                        content_p1: content_p1,
                        content_p2: content_p2,
                        cut: cut
                    };
                    data.status = fields.status.value;
                    data.template = fields.template.value;
                    data.comments = fields.comments.value;
                }
            }
            if (postId) {
                let page = await db.collection('blog').findOne({ _id: parseInt(postId, 10) });
                if (!page) {
                    output.status = -1;
                    return res.send(JSON.stringify(output));
                }
            } else {
                data.authorId = String(req.session.auth._id);
            }
            data.timestamp = parseInt(fields.timestamp.value, 10);
            const incr = await db.collection('blog_counters').findAndModify({ _id: 'posts' }, [], { $inc: { seq: 1 } }, { new: true, upsert: true });
            if (!incr || !incr.value || !incr.value.seq) {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            let what = postId ? { _id: parseInt(postId, 10) } : { _id: parseInt(incr.value.seq, 10) };
            let updResult = await db.collection('blog').update(what, { $set: data }, { upsert: true });
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
            if (!id.match(/^[0-9]{1,10}$/)) {
                output.status = -2;
                return res.send(JSON.stringify(output));
            }
            did.push({ _id: parseInt(id, 10) });
        }
        try {
            const delResult = await db.collection('blog').deleteMany({
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

    const commentAdd = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorized(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        const locale = req.session.currentLocale;
        const allowed = await security.checkActionInterval(req, 'addBlogComment', 10);
        if (!allowed) {
            return res.send(JSON.stringify({
                status: 0,
                error: i18n.get().__(locale, 'Please wait some time before you add another comment')
            }));
        }
        let comment = req.body.comment;
        const parentId = req.body.parentId || null;
        const postId = req.body.postId;
        if (!comment || typeof comment !== 'string' || comment.length > 512 ||
            !postId || typeof postId !== 'string' || !postId.match(/^[0-9]{1,10}$/) ||
            parentId && (typeof parentId !== 'string' || !parentId.match(/^[a-f0-9]{24}$/))) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const post = await db.collection('blog').findOne({ _id: parseInt(postId, 10) });
            if (!post || !post.comments || post.comments !== '1') {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            if (parentId) {
                const parentComment = await db.collection('blog_comments').findOne({ _id: new ObjectID(parentId) });
                if (!parentComment) {
                    return res.send(JSON.stringify({
                        status: 0
                    }));
                }
            }
            const timestamp = parseInt(Date.now() / 1000, 10);
            comment = comment.trim().replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;').replace(/\n/gm, '<br>');
            const insResult = await db.collection('blog_comments').insertOne({
                userId: String(req.session.auth._id),
                postId: parseInt(postId, 10),
                parentId: parentId,
                comment: comment,
                timestamp: timestamp
            });
            if (!insResult || !insResult.result || !insResult.result.ok || !insResult.insertedId) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            let picture = req.session.auth.avatarSet ? '/users/static/pictures/small_' + req.session.auth._id + '.jpg' : '/users/static/pictures/small_default.png';
            return res.send(JSON.stringify({
                status: 1,
                _id: insResult.insertedId,
                picture: picture,
                parentId: parentId,
                comment: comment,
                timestamp: timestamp,
                username: req.session.auth.realname || req.session.auth.username
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const loadComments = async(req, res) => {
        res.contentType('application/json');
        const locale = req.session.currentLocale;
        let postId = req.body.postId || req.query.postId;
        if (!postId || typeof postId !== 'string' || !postId.match(/^[0-9]{1,10}$/)) {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const post = await db.collection('blog').findOne({ _id: parseInt(postId, 10) });
            if (!post || !post.comments || post.comments !== '1') {
                return res.send(JSON.stringify({
                    status: 0
                }));
            }
            const comments = await db.collection('blog_comments').find({ postId: parseInt(postId, 10) }).toArray();
            if (!comments) {
                return res.send(JSON.stringify({
                    status: -1
                }));
            }
            let usersQuery = [];
            let usersData = {};
            for (let i in comments) {
                if (!usersData[comments[i].userId]) {
                    usersData[comments[i].userId] = {};
                    usersQuery.push({ _id: new ObjectID(comments[i].userId) });
                }
            }
            if (usersQuery.length) {
                const users = await db.collection('users').find({ $or: usersQuery }, { projection: { _id: 1, username: 1, realname: 1, avatarSet: 1 } }).toArray();
                if (users) {
                    for (let i in users) {
                        const user = users[i];
                        usersData[String(user._id)] = {
                            username: user.realname || user.username,
                            picture: user.avatarSet ? '/users/static/pictures/small_' + String(user._id) + '.jpg' : '/users/static/pictures/small_default.png'
                        };
                    }
                }
            }
            for (let i in usersData) {
                if (Object.keys(usersData[i]).length === 0) {
                    usersData[i] = {
                        username: i18n.get().__(locale, 'Deleted Account'),
                        picture: '/users/static/pictures/small_default.png'
                    };
                }
            }
            return res.send(JSON.stringify({
                status: 1,
                comments: comments,
                usersData: usersData
            }));
        } catch (e) {
            log.error(e);
            return res.send(JSON.stringify({
                status: 0
            }));
        }
    };

    const commentRemove = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let ids = req.body['commentId'];
        if (!ids || (typeof ids !== 'object' && typeof ids !== 'string')) {
            return res.send(JSON.stringify({
                status: -1
            }));
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
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            did.push({ _id: new ObjectID(id) });
        }
        try {
            let updResult = await db.collection('blog_comments').update({ $or: did }, { $set: { comment: null } }, { multi: true, upsert: false });
            if (!updResult || !updResult.result || !updResult.result.ok) {
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

    const listComments = async(req, res) => {
        const locale = req.session.currentLocale;
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let skip = req.query.skip || '0';
        let limit = req.query.limit || '10';
        let search = req.query.search || '';
        if (typeof skip !== 'string' || typeof limit !== 'string' || typeof search !== 'string') {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        skip = parseInt(skip, 10) || 0;
        limit = parseInt(limit, 10) || 0;
        search = search.trim();
        if (search.length < 3) {
            search = null;
        }
        let fquery = {
            comment: { $ne: null }
        };
        try {
            if (search) {
                fquery.$or = [];
                if (parseInt(search, 10)) {
                    fquery.$or.push({ postId: parseInt(search, 10) });
                }
                const unrx = new RegExp(config.core.regexp.username);
                if (search.match(unrx)) {
                    const user = await db.collection('users').findOne({ username: search });
                    if (user) {
                        fquery.$or.push({ userId: { $regex: String(user._id), $options: 'i' } });
                    }
                }
            }
            let ffields = { _id: 1, userId: 1, postId: 1, comment: 1, timestamp: 1 };
            const total = await db.collection('blog_comments').find(fquery).count();
            const items = await db.collection('blog_comments').find(fquery, { sort: { timestamp: -1 }, skip: skip, limit: limit, projection: ffields }).toArray();
            let usersQuery = [];
            let blogQuery = [];
            let usersHash = {};
            let blogHash = {};
            for (let i in items) {
                const item = items[i];
                if (!usersHash[item.userId]) {
                    usersQuery.push({ _id: new ObjectID(item.userId) });
                    usersHash[item.userId] = 1;
                }
                if (!blogHash[item.postId]) {
                    blogQuery.push({ _id: parseInt(item.postId, 10) });
                    blogHash[item.postId] = 1;
                }
            }
            let posts = {};
            let users = {};
            if (blogQuery.length) {
                let projection = {
                    timestamp: 1
                };
                projection[locale + '.title'] = 1;
                const postData = await db.collection('blog').find({ $or: blogQuery }, { skip: 0, projection: projection }).toArray();
                if (postData && postData.length) {
                    for (let i in postData) {
                        const post = postData[i];
                        posts[post._id] = post;
                    }
                }
            }
            if (usersQuery.length) {
                const usersData = await db.collection('users').find({ $or: usersQuery }, { skip: 0, projection: { username: 1, realname: 1, _id: 1 } }).toArray();
                if (usersData && usersData.length) {
                    for (let i in usersData) {
                        const user = usersData[i];
                        users[String(user._id)] = user;
                    }
                }
            }
            for (let i in items) {
                items[i].title = posts[items[i].postId][locale].title;
                items[i].username = users[items[i].userId] ? users[items[i].userId].realname || users[items[i].userId].username : i18n.get().__(locale, 'Deleted Account');
            }
            let data = {
                status: 1,
                count: items.length,
                total: total,
                items: items
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

    let router = Router();
    router.get('/list', list);
    router.get('/load', load);
    router.post('/save', save);
    router.post('/delete', del);
    router.post('/comments/add', commentAdd);
    router.post('/comments/load', loadComments);
    router.post('/comments/remove', commentRemove);
    router.get('/list/comments', listComments);

    return {
        routes: router
    };
};