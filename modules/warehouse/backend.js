const moduleId = 'warehouse';
const path = require('path');
const config = require('../../core/config.js');
const moduleURL = config.core.prefix.admin + '/warehouse';
const Module = require('../../core/module.js');
const Router = require('co-router');
let jsonAddress;
try {
    jsonAddress = require('./config/address.json');
} catch (e) {
    jsonAddress = require('./config/address.dist.json');
}
let configModule;
try {
    configModule = require('./config/catalog.json');
} catch (e) {
    configModule = require('./config/catalog.dist.json');
}

module.exports = function(app) {
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);
    const panel = new(require('../../core/panel.js'))(app);
    const render = new(require('../../core/render.js'))(`${__dirname}/views`, app);
    const db = app.get('db');

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

    const list = async(req, res, next) => {
        try {
            const uprefix = i18n.getLanguageURLPrefix(req);
            if (!Module.isAuthorizedAdmin(req)) {
                Module.logout(req);
                return res.redirect(303, (config.core.prefix.auth ? uprefix + config.core.prefix.auth : uprefix + '/auth') + '?redirect=' + uprefix + moduleURL + '&rnd=' + Math.random().toString().replace('.', ''));
            }
            const locale = req.session.currentLocale;
            const folders = await db.collection('warehouse_registry').findOne({ name: 'warehouseFolders' });
            const settingsData = await db.collection('warehouse_registry').findOne({ name: 'warehouseSettings' });
            const addressDB = await db.collection('warehouse_registry').findOne({ name: 'warehouse_address' });
            const settings = await _loadSettings(locale);
            let addressData = {};
            if (addressDB && addressDB.data && addressDB.data.length) {
                for (let i in addressDB.data) {
                    let [id] = addressDB.data[i].split('|');
                    for (let j in jsonAddress) {
                        if (jsonAddress[j].id === id) {
                            addressData[id] = jsonAddress[j];
                        }
                    }
                }
            }
            const delivery = await db.collection('warehouse_delivery').find({ status: '1' }).toArray();
            let html = await render.file('warehouse.html', {
                i18n: i18n.get(),
                config: config,
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                langs: JSON.stringify(config.i18n.localeNames),
                address: JSON.stringify(jsonAddress),
                folders: folders ? folders.data : JSON.stringify([{ id: '1', text: '/', parent: '#', type: 'root' }]),
                settings: JSON.stringify(settings),
                settingsData: settingsData ? settingsData.data : JSON.stringify({}),
                addressJSON: JSON.stringify(addressData),
                delivery: delivery,
                corePrefix: JSON.stringify(config.core.prefix),
                uprefix: uprefix,
                configModule: configModule
            });
            res.send(await panel.html(req, moduleId, i18n.get().__(locale, 'title'), html, config.production ? ['/warehouse/static/css/warehouse.min.css'] : ['/zoia/3rdparty/jstree/themes/default/style.min.css', '/warehouse/static/css/warehouse.css'],
                config.production ? ['/zoia/3rdparty/ckeditor/ckeditor.js', '/zoia/3rdparty/ckeditor/adapters/jquery.js', '/warehouse/static/js/warehouse.min.js'] : ['/zoia/3rdparty/ckeditor/ckeditor.js', '/zoia/3rdparty/ckeditor/adapters/jquery.js',
                    '/zoia/3rdparty/plupload/plupload.min.js', '/zoia/3rdparty/jquery/jquery.shifty.min.js', '/zoia/core/js/jquery.zoiaFormBuilder.js', '/zoia/core/js/jquery.zoiaTable.js', '/zoia/3rdparty/jstree/jstree.min.js', '/warehouse/static/js/warehouse.js'
                ]));
        } catch (e) {
            next(new Error(e.message));
        }
    };

    const browse = async(req, res, next) => {
        try {
            const uprefix = i18n.getLanguageURLPrefix(req);
            if (!Module.isAuthorizedAdmin(req)) {
                Module.logout(req);
                return res.redirect(303, (config.core.prefix.auth ? uprefix + config.core.prefix.auth : uprefix + '/auth') + '?redirect=' + moduleURL + '&rnd=' + Math.random().toString().replace('.', ''));
            }
            const locale = req.session.currentLocale;
            let html = await render.file('browse.html', {
                i18n: i18n.get(),
                config: config,
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale])
            });
            res.send(html);
        } catch (e) {
            next(new Error(e.message));
        }
    };

    app.use('/warehouse/static', app.get('express').static(path.join(__dirname, 'static')));

    let router = Router();
    router.get('/', list);
    router.get('/browse', browse);
    return {
        routes: router,
        info: {
            id: moduleId,
            url: moduleURL,
            title: Module.getTitles(i18n),
            icon: 'cart'
        }
    };
};