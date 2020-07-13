const config = require('../../core/config.js');
const Router = require('co-router');
const fs = require('fs');

const templates = require('./templates.js');

let templateContents = 'contents.html';
if (fs.existsSync(`${__dirname}/views/custom_${templateContents}`)) {
    templateContents = 'custom_' + templateContents;
}

const tpl = (s, d) => {
    for (let p in d) {
        s = s.replace(new RegExp('{' + p + '}', 'g'), d[p]);
    }
    return s;
};

const _treePath = (tree, id, locale, text, _path) => {
    let node = tree.find(x => x.id === id);
    if (!node) {
        return '';
    }
    let pathT = _path || [];
    if (!text) {
        if (node.data && node.data.lang && node.data.lang[locale]) {
            pathT.push(node.data.lang[locale]);
        } else {
            pathT.push('');
        }
    } else {
        pathT.push(node.text);
    }
    if (node.parent !== '#') {
        pathT = _treePath(tree, node.parent, locale, text, pathT);
    }
    return pathT;
};

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const db = app.get('db');
    const render = new(require('../../core/render.js'))(`${__dirname}/../../views`, app);
    const renderLocal = new(require('../../core/render.js'))(`${__dirname}/views`, app);

    const content = async(req, res, next) => {
        let filters = app.get('templateFilters');
        render.setFilters(filters);
        let locale = config.i18n.locales[0];
        if (req.session && req.session.currentLocale) {
            locale = req.session.currentLocale;
        }
        const urlParts = req.params[0].split('/');
        urlParts.shift();
        for (let i in urlParts) {
            let item = urlParts[i];
            if (item.match(/ /) || item.match(/^[\^<>\/\:\"\\\|\?\*\x00-\x1f]+$/)) {
                return res.status(404);
            }
        }
        let url = urlParts.join('/');
        let filter = {
            status: 1,
            url: 1,
            folder: 1,
            template: 1
        };
        url = url.replace(/\/$/, '');
        filter[locale] = 1;
        let pageData = await db.collection('pages').findOne({ url: url }, { sort: {}, projection: filter });
        if (pageData && pageData[locale] && pageData[locale].title && pageData.status) {
            const folderPagesCount = await db.collection('pages').find({ folder: pageData.folder, name: { $ne: '' }, status: '1' }).count();
            let vars = {
                req: req,
                locale: locale,
                config: config,
                data: pageData
            };
            const tagPattern = new RegExp(/\[\[(.*)\]\]/gm);
            const tags = pageData[locale].content.match(tagPattern);
            for (let i in tags) {
                let tag = tags[i];
                let tagString = tag.trim().replace(/^\[\[/, '').replace(/\]\]$/, '');
                let tagParts = tagString.split('|');
                let fn = '';
                if (!tagParts || !tagParts.length) {
                    continue;
                }
                if (tagParts.length === 1) {
                    fn = tagParts[0];
                } else {
                    fn = tagParts.pop();
                }
                for (let p in tagParts) {
                    let par = tagParts[p];
                    if (vars[par]) {
                        tagParts[p] = vars[par];
                    }
                }
                let out = '';
                if (fn === 'uprefix') {
                    out = i18n.getLanguageURLPrefix(req);
                }
                if (filters[fn + 'Async']) {
                    out = await filters[fn + 'Async'](...tagParts);
                }
                pageData[locale].content = pageData[locale].content.replace(tag, out);
            }
            let html = await render.template(req, i18n, locale, pageData[locale].title || '', {
                content: pageData[locale].content || '',
                keywords: pageData[locale].keywords || '',
                description: pageData[locale].description || '',
                pageFolder: pageData.folder,
                pageID: String(pageData._id),
                folderPagesCount: folderPagesCount
            }, pageData.template || config.website.templates[0]);
            return res.send(html);
        }
        return next();
    };

    const breadcrumbsAsync = async(data, _locale) => {
        if (!data || typeof data !== 'object' || !data.folder) {
            return '';
        }
        let locale = _locale || config.i18n.locales[0];
        let uprefix = '';
        if (config.i18n.detect.url && locale !== config.i18n.locales[0]) {
            uprefix = '/' + locale;
        }
        try {
            let foldersData = await db.collection('pages_registry').findOne({ name: 'pagesFolders' });
            if (!foldersData) {
                return '';
            }
            let folders = JSON.parse(foldersData.data);
            let pathT = _treePath(folders, data.folder, locale, false);
            pathT = pathT.reverse();
            pathT.shift();
            let pathTId = _treePath(folders, data.folder, locale, true);
            pathTId = pathTId.reverse();
            pathTId.shift();
            let html = '';
            let pathTUrl = '/';
            html += tpl(templates['item'], { url: uprefix + pathTUrl, title: config.website.titleShort[locale] });
            for (let i in pathT) {
                pathTUrl += pathTId[i] + '/';
                html += tpl(templates['item'], { url: uprefix + pathTUrl, title: pathT[i] });
            }
            html += tpl(templates['itemActive'], { title: data[locale].title });
            html = tpl(templates['wrap'], { data: html });
            return html;
        } catch (e) {
            return '';
        }
    };

    const contentsAsync = async(data) => {
        if (!data || !Array.isArray(data) || data.length < 4) {
            return '';
        }
        const req = data[0];
        const folder = data[1];
        const pageID = data[2];
        const locale = data[3];
        const css = data.length > 3 ? data[4] : '';
        const uprefix = i18n.getLanguageURLPrefix(req);
        let filter = {
            status: 1,
            url: 1
        };
        filter[locale] = 1;
        let sort = {};
        sort[locale] = 1;
        try {
            let output = '';
            let pages = await db.collection('pages').find({ folder: folder, status: '1', name: { $ne: '' } }, { sort: sort, projection: filter }).toArray();
            if (pages && pages.length > 0) {
                output = await renderLocal.file(templateContents, {
                    locale: locale, 
                    pages: pages,
                    pageID: pageID,
                    uprefix: uprefix,
                    css: css
                });
            }
            return output;
        } catch (e) {
            return '';
        }
    };

    const contents = (data, callback) => {
        contentsAsync(data).then(function(html) {
            callback(null, html);
        });
    };

    let router = Router();
    router.get(/(.*)/, content);

    return {
        routes: router,
        filters: {
            breadcrumbsAsync: breadcrumbsAsync,
            contents: contents
        }
    };
};