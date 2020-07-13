const Module = require('../../core/module.js');
const Router = require('co-router');
const config = require('../../core/config.js');

module.exports = function(app) {
    const db = app.get('db');
    const templates = require('./templates.js');
    const log = app.get('log');

    const tpl = (s, d) => {
        for (let p in d) {
            s = s.replace(new RegExp('{' + p + '}', 'g'), d[p]);
        }
        return s;
    };

    const render = (_data, prefix, uprefix) => {
        const data = JSON.parse(JSON.stringify(_data));
        let html = '';
        try {
            for (let i in data) {
                let item = data[i];
                if (item.parent === 'j1_1') {
                    let children = '';
                    for (let n in data) {
                        let sub = data[n];
                        if (sub.parent === item.id) {
                            if (uprefix && sub.data.url.match(/^\//)) {
                                sub.data.url = uprefix + sub.data.url;
                            }
                            children += tpl(templates['item_' + prefix], { id: sub.id, url: sub.data.url, title: sub.text });
                        }
                    }
                    if (children) {
                        html += tpl(templates['parent_' + prefix], { id: item.id, title: item.text, data: children });
                    } else {
                        if (uprefix && item.data.url.match(/^\//)) {
                            item.data.url = uprefix + item.data.url;
                        }
                        html += tpl(templates['item_' + prefix], { id: item.id, url: item.data.url, title: item.text });
                    }
                }
            }
            if (html) {
                html = tpl(templates['wrap_' + prefix], { data: html });
            }
        } catch (e) {
            // Ignore
        }
        return html;
    };

    const save = async(req, res) => {
        res.contentType('application/json');
        if (!Module.isAuthorizedAdmin(req)) {
            return res.send(JSON.stringify({
                status: 0
            }));
        }
        let navigation = req.body.navigation;
        if (!navigation || typeof 'navigation' !== 'string') {
            return res.send(JSON.stringify({
                status: -1
            }));
        }
        try {
            const json = JSON.stringify(navigation);
            let updResult = await db.collection('navigation').update({ name: 'navigation' }, { name: 'navigation', data: json }, { upsert: true });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send(JSON.stringify({
                    status: -2
                }));
            }
            for (let n in config.i18n.localeNames) {
                let uprefix = '';
                if (config.i18n.detect.url && config.i18n.locales.indexOf(n) > 0) {
                    uprefix = '/' + n;
                }
                let data = render(navigation[n], 'd', uprefix);
                updResult = await db.collection('navigation').update({ name: 'navigation_html_d_' + n }, { name: 'navigation_html_d_' + n, data: data }, { upsert: true });
                if (!updResult || !updResult.result || !updResult.result.ok) {
                    return res.send(JSON.stringify({
                        status: -3
                    }));
                }
                data = render(navigation[n], 'm', uprefix);
                updResult = await db.collection('navigation').update({ name: 'navigation_html_m_' + n }, { name: 'navigation_html_m_' + n, data: data }, { upsert: true });
                if (!updResult || !updResult.result || !updResult.result.ok) {
                    return res.send(JSON.stringify({
                        status: -4
                    }));
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
    let router = Router();
    router.post('/save', save);
    return {
        routes: router
    };
};