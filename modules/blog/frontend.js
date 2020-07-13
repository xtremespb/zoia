const config = require('../../core/config.js');
const Router = require('co-router');
const fs = require('fs-extra');
const moment = require('moment');
const Module = require('../../core/module.js');
const ObjectID = require('mongodb').ObjectID;

let configModule;
try {
    configModule = require('./config/blog.json');
} catch (e) {
    configModule = require('./config/blog.dist.json');
}

let templateBlogList = 'frontend.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateBlogList}`)) {
    templateBlogList = 'custom_' + templateBlogList;
}
let templateBlogItem = 'frontend_item.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateBlogItem}`)) {
    templateBlogItem = 'custom_' + templateBlogList;
}
let templateBlogLatest = 'frontend_latest.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateBlogLatest}`)) {
    templateBlogLatest = 'custom_' + templateBlogLatest;
}

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const db = app.get('db');
    const log = app.get('log');
    const renderBlog = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const renderRoot = new(require('../../core/render.js'))(`${__dirname}/../../views`, app);

    const listItems = async(req, res, next) => {
        let filters = app.get('templateFilters');
        renderRoot.setFilters(filters);
        let locale = config.i18n.locales[0];
        if (req.session && req.session.currentLocale) {
            locale = req.session.currentLocale;
        }
        let page = 1;
        if (req.query.page && typeof req.query.page === 'string' && req.query.page.match(/^[0-9]{1,10}$/)) {
            page = parseInt(req.query.page, 10);
        }
        let tag;
        if (req.query.tag && typeof req.query.tag === 'string' && req.query.tag.length <= 48) {
            tag = Module.sanitizeString(req.query.tag, 48);
            if (tag.length === 0) {
                tag = null;
            }
        }
        const skip = (page - 1) * configModule.itemsPerPage;
        const uprefix = i18n.getLanguageURLPrefix(req);
        try {
            let what = {
                status: '1'
            };
            if (tag) {
                what[locale + '.keywords'] = { $in: [tag] };
            }
            let ffields = { _id: 1, timestamp: 1, status: 1, authorId: 1 };
            ffields[locale + '.title'] = 1;
            ffields[locale + '.content_p1'] = 1;
            ffields[locale + '.cut'] = 1;
            ffields[locale + '.keywords'] = 1;
            const blogItemsCount = await db.collection('blog').find(what, { projection: ffields }).count();
            const blogItems = await db.collection('blog').find(what, { skip: skip, projection: ffields, limit: configModule.itemsPerPage, sort: { timestamp: -1 } }).toArray();
            // Get user names and avatars
            let usersData = {};
            let usersQuery = [];
            for (let i in blogItems) {
                if (!usersData[blogItems[i].authorId]) {
                    usersQuery.push({ _id: new ObjectID(blogItems[i].authorId) });
                    usersData[blogItems[i].authorId] = {
                        username: i18n.get().__(locale, 'Deleted Account'),
                        url: '/users/static/pictures/small_default.png'
                    };
                }
            }
            if (usersQuery.length) {
                const users = await db.collection('users').find({ $or: usersQuery }).toArray();
                if (users && users.length) {
                    for (let i in users) {
                        usersData[String(users[i]._id)].username = users[i].realname || users[i].username;
                        usersData[String(users[i]._id)].url = users[i].avatarSet ? '/users/static/pictures/small_' + String(users[i]._id) + '.jpg' : '/users/static/pictures/small_default.png';
                    }
                }
            }
            // Pagination
            let paginationData = [];
            const numPages = Math.ceil(blogItemsCount / configModule.itemsPerPage);
            if (numPages > 1) {
                if (numPages > configModule.itemsPerPage) {
                    if (page > 1) {
                        // page - 1
                        paginationData.push({
                            type: 'prev',
                            page: page - 1
                        });
                    }
                    if (page > 3) {
                        // 1
                        paginationData.push({
                            type: 'item',
                            page: 1
                        });
                    }
                    let _st = page - 2;
                    if (_st < 1) {
                        _st = 1;
                    }
                    if (_st - 1 > 1) {
                        // dots
                        paginationData.push({
                            type: 'dots'
                        });
                    }
                    let _en = page + 2;
                    if (_en > numPages) {
                        _en = numPages;
                    }
                    for (let i = _st; i <= _en; i++) {
                        // i
                        paginationData.push({
                            type: 'item',
                            page: i,
                            status: page === i ? 'active' : null
                        });
                    }
                    if (_en < numPages - 1) {
                        // dots
                        paginationData.push({
                            type: 'dots'
                        });
                    }
                    if (page <= numPages - 3) {
                        // numPages
                        paginationData.push({
                            type: 'item',
                            page: numPages,
                            status: page === numPages ? 'active' : null
                        });
                    }
                    if (page < numPages) {
                        // page + 1
                        paginationData.push({
                            type: 'next',
                            page: page + 1
                        });
                    }
                } else {
                    for (let j = 1; j <= numPages; j++) {
                        // j
                        paginationData.push({
                            type: 'item',
                            page: j,
                            status: page === j ? 'active' : null
                        });
                    }
                }
            }
            // Render
            for (let i in blogItems) {
                blogItems[i].timestamp = parseInt(Date.now() / 1000, 10) - blogItems[i].timestamp > 604800 ? moment(blogItems[i].timestamp * 1000).locale(locale).format('LLLL') : moment(blogItems[i].timestamp * 1000).locale(locale).fromNow();
            }
            let blogHTML = await renderBlog.file(templateBlogList, {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                configModule: configModule,
                config: config,
                items: blogItems,
                count: blogItemsCount,
                auth: req.session.auth,
                paginationData: paginationData,
                tag: tag,
                usersData: usersData,
                uprefix: uprefix
            });
            let html = await renderRoot.template(req, i18n, locale, i18n.get().__(locale, 'Blog'), {
                content: blogHTML,
                extraCSS: config.production ? ['/blog/static/css/frontend.min.css'] : ['/blog/static/css/frontend.css'],
                extraJS: []
            });
            res.send(html);
        } catch (e) {
            log.error(e);
            return next(e);
        }
    };

    const displayItem = async(req, res, next) => {
        let filters = app.get('templateFilters');
        renderRoot.setFilters(filters);
        let locale = config.i18n.locales[0];
        if (req.session && req.session.currentLocale) {
            locale = req.session.currentLocale;
        }
        if (!req.params.id || typeof req.params.id !== 'string' || !req.params.id.match(/^[0-9]{1,10}$/)) {
            return next();
        }
        const uprefix = i18n.getLanguageURLPrefix(req);
        try {
            const item = await db.collection('blog').findOne({ _id: parseInt(req.params.id, 10), status: '1' });
            if (!item) {
                return next();
            }
            // Get user names and avatars            
            const user = await db.collection('users').findOne({ _id: new ObjectID(item.authorId) });
            let userData = {};
            userData[item.authorId] = {};
            userData[item.authorId].url = user && user.avatarSet ? '/users/static/pictures/small_' + String(user._id) + '.jpg' : '/users/static/pictures/small_default.png';
            userData[item.authorId].username = user ? user.realname || user.username : i18n.get().__(locale, 'Deleted Account');
            item.timestamp = parseInt(Date.now() / 1000, 10) - item.timestamp > 604800 ? moment(item.timestamp * 1000).locale(locale).format('LLLL') : moment(item.timestamp * 1000).locale(locale).fromNow();
            // Render            
            let blogHTML = await renderBlog.file(templateBlogItem, {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                configModule: configModule,
                config: config,
                item: item,
                auth: req.session.auth,
                admin: Module.isAuthorizedAdmin(req),
                uprefix: uprefix,
                userData: userData,
                userDataJSON: JSON.stringify(userData[item.authorId])
            });
            let html = await renderRoot.template(req, i18n, locale, item[locale].title + ' | ' + i18n.get().__(locale, 'Blog'), {
                content: blogHTML,
                extraCSS: config.production ? ['/blog/static/css/frontend.min.css'] : ['/blog/static/css/frontend.css'],
                extraJS: config.production ? ['/blog/static/js/frontend_item.min.js'] : ['/zoia/3rdparty/moment/moment-with-locales.min.js', '/blog/static/js/frontend_item.js']
            }, item.template || config.website.templates[0]);
            res.send(html);
        } catch (e) {
            log.error(e);
            return next(e);
        }
    };

    const blogArticlesLatestAsync = async(req) => {
        if (!req) {
            return '';
        }
        let locale = config.i18n.locales[0];
        if (req.session && req.session.currentLocale) {
            locale = req.session.currentLocale;
        }
        let ffields = { _id: 1, timestamp: 1, status: 1, authorId: 1 };
        ffields[locale + '.title'] = 1;
        try {
            const blogItems = await db.collection('blog').find({ status: '1' }, { projection: ffields, limit: configModule.blogArticlesLatestCount, sort: { timestamp: -1 } }).toArray();
            for (let i in blogItems) {
                blogItems[i].timestamp = parseInt(Date.now() / 1000, 10) - blogItems[i].timestamp > 604800 ? moment(blogItems[i].timestamp * 1000).locale(locale).format('LLLL') : moment(blogItems[i].timestamp * 1000).locale(locale).fromNow();
            }
            let blogHTML = await renderBlog.file(templateBlogLatest, {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                configModule: configModule,
                config: config,
                items: blogItems
            });
            return blogHTML;
        } catch (e) {
            return i18n.get().__(locale, 'Could not load latest blog posts') + ': ' + e;
        }
    };

    const blogArticlesLatest = (data, callback) => {
        blogArticlesLatestAsync(data).then(function(html) {
            callback(null, html);
        });
    };

    let router = Router();
    router.get('/', listItems);
    router.get(configModule.prefix.post + '/:id', displayItem);

    return {
        routes: router,
        filters: {
            blogArticlesLatest: blogArticlesLatest
        }
    };
};