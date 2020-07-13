const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Module = require(path.join(__dirname, '..', '..', '..', '..', 'core', 'module.js'));
const config = require(path.join(__dirname, '..', '..', '..', '..', 'core', 'config.js'));
let configPlugin;
try {
    configPlugin = require(path.join(__dirname, 'config.json'));
} catch (e) {
    configPlugin = require(path.join(__dirname, 'config.dist.json'));
}
let configWarehouse;
try {
    configWarehouse = require(path.join(__dirname, '..', '..', 'config', 'catalog.json'));
} catch (e) {
    configWarehouse = require(path.join(__dirname, '..', '..', 'config', 'catalog.dist.json'));
}
let templatePaymentSuccess = 'payment_success.html';
let templatePaymentError = 'payment_error.html';
if (fs.existsSync(path.join(__dirname, '..', '..', 'views', 'custom_' + templatePaymentSuccess))) {
    templatePaymentSuccess = 'custom_' + templatePaymentSuccess;
}
if (fs.existsSync(path.join(__dirname, '..', '..', 'views', 'custom_' + templatePaymentError))) {
    templatePaymentError = 'custom_' + templatePaymentError;
}

module.exports = function(app, router) {
    const db = app.get('db');
    const i18n = new(require(path.join(__dirname, '..', '..', '..', '..', 'core', 'i18n.js')))(path.join(__dirname, '..', '..', 'lang'), app);
    const renderModule = new(require(path.join(__dirname, '..', '..', '..', '..', 'core', 'render.js')))(path.join(__dirname, '..', '..', 'views'), app);
    const renderRoot = new(require(path.join(__dirname, '..', '..', '..', '..', 'core', 'render.js')))(path.join(__dirname, '..', '..', '..', '..', 'views'), app);
    const render = new(require(path.join(__dirname, '..', '..', '..', '..', 'core', 'render.js')))(path.join(__dirname, '..', '..', 'views'), app);
    const mailer = new(require(path.join(__dirname, '..', '..', '..', '..', 'core', 'mailer.js')))(app);
    /*
    
        The helper functions

     */
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
    const renderError = async(req, res, msg) => {
        const locale = req.session.currentLocale;
        let templateHTML = await renderModule.file(templatePaymentError, {
            i18n: i18n.get(),
            locale: locale,
            msg: msg
        });
        let html = await renderRoot.template(req, i18n, locale, i18n.get().__(locale, 'Payment Failed'), {
            content: templateHTML,
            extraCSS: [],
            extraJS: []
        });
        res.send(html);
    };
    /*
    
        /payment route
        Requires Order ID as "id" body/query parameter

     */
    const orderPayment = async(req, res) => {
        const id = req.query.id || req.body.id;
        const locale = req.session.currentLocale;
        let filters = app.get('templateFilters');
        renderRoot.setFilters(filters);
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/)) {
            return renderError(req, res, i18n.get().__(locale, 'Invalid order ID'));
        }
        const orderData = await db.collection('warehouse_orders').findOne({ _id: parseInt(id, 10) });
        if (!orderData || orderData.paid) {
            return renderError(req, res, i18n.get().__(locale, 'Could not process the requested order. Please check the order number or try a few moments later.'));
        }
        const signature = crypto.createHash('md5').update(configPlugin.sMerchantLogin + ':' + orderData.costs.total + ':' + orderData._id + ':' + configPlugin.sMerchantPass1).digest('hex');
        return res.redirect(303, configPlugin.url + '?MrchLogin=' + configPlugin.sMerchantLogin + '&OutSum=' +
            orderData.costs.total + '&InvId=' + orderData._id + '&Desc=' + i18n.get().__(locale, 'Payment for Order ID') +
            ' ' + orderData._id + '&SignatureValue=' + signature + '&IncCurrLabel=' + configPlugin.sIncCurrLabel +
            '&Culture=' + locale + '&IsTest=0&rnd=' + Math.random().toString().replace('.', ''));
    };
    /*
    
        /payment/data/process route
        Requires InvId, OutSum and SignatureValue body parameters

     */
    const dataProcess = async(req, res) => {
        try {
            const id = req.body.InvId;
            const sum = req.body.OutSum;
            const crc = req.body.SignatureValue;
            if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/) ||
                !crc || typeof crc !== 'string' || !crc.match(/^[a-f0-9]{32}$/i) ||
                !sum || typeof sum !== 'string' || !sum.match(/^\d+(\.\d{1,6})?$/)) {
                return res.send('Invalid order ID, payment amount or signature value');
            }
            const crcValid = crypto.createHash('md5').update(sum + ':' + id + ':' + configPlugin.sMerchantPass2).digest('hex').toLowerCase();
            if (crc.toLowerCase() !== crcValid) {
                return res.send('Invalid signature');
            }
            const orderData = await db.collection('warehouse_orders').findOne({ _id: parseInt(id, 10) });
            if (!orderData || orderData.paid) {
                return res.send('Order does not exist or is already paid');
            }
            const updResult = await db.collection('warehouse_orders').update({ _id: parseInt(id, 10) }, { $set: { paid: true } }, { upsert: false });
            if (!updResult || !updResult.result || !updResult.result.ok) {
                return res.send('Could not update the database record');
            }
            const locale = orderData.locale;
            const settings = await _loadSettings(locale);
            const sumText = (configWarehouse.currencyPosition === 'left' ? settings.currency : '') + orderData.costs.total + (configWarehouse.currencyPosition === 'right' ? ' ' + settings.currency : '');
            const mailUserHTML = await render.file('mail_topup_user.html', {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                id: orderData._id,
                sum: sumText
            });
            const mailAdminHTML = await render.file('mail_topup_admin.html', {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                id: orderData._id,
                sum: sumText
            });
            await mailer.send(req, orderData.email, i18n.get().__(locale, 'Successful Payment'), mailUserHTML);
            await mailer.send(req, config.website.email.feedback, i18n.get().__(locale, 'Order was Paid by Customer'), mailAdminHTML);
            return res.send('OK');
        } catch (e) {
            return res.send('Internal Server Error');            
        }
    };
    /*
    
        /payment/complete route
        Requires InvId, OutSum and SignatureValue query/body parameters

     */
    const dataSucesss = async(req, res, next) => {
        const id = req.body.InvId || req.query.InvId;
        const sum = req.body.OutSum || req.query.OutSum;
        const crc = req.body.SignatureValue || req.query.SignatureValue;
        const locale = req.session.currentLocale;
        let filters = app.get('templateFilters');
        renderRoot.setFilters(filters);
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/) ||
            !crc || typeof crc !== 'string' || !crc.match(/^[a-f0-9]{32}$/i) ||
            !sum || typeof sum !== 'string' || !sum.match(/^\d+(\.\d{1,6})?$/)) {
            return renderError(req, res, i18n.get().__(locale, 'Invalid order ID, payment amount or signature value.'));
        }
        const crcValid = crypto.createHash('md5').update(sum + ':' + id + ':' + configPlugin.sMerchantPass1).digest('hex').toLowerCase();
        if (crc.toLowerCase() !== crcValid) {
            return renderError(req, res, i18n.get().__(locale, 'The payment signature is invalid. If you believe that\'s wrong, please contact website support.'));
        }
        let templateHTML = await renderModule.file(templatePaymentSuccess, {
            i18n: i18n.get(),
            locale: locale,
            id: id,
            configWarehouse: configWarehouse,
            auth: Module.isAuthorized(req) ? 1 : null
        });
        let html = await renderRoot.template(req, i18n, locale, i18n.get().__(locale, 'Successful Payment'), {
            content: templateHTML,
            extraCSS: [],
            extraJS: []
        });
        res.send(html);
    };
    /*
    
        /payment/failed route

     */
    const dataFailed = async(req, res, next) => {
        const locale = req.session.currentLocale;
        let filters = app.get('templateFilters');
        renderRoot.setFilters(filters);
        return renderError(req, res, i18n.get().__(locale, 'Could not complete your payment. Please contact website support for more information or try again.'));
    };
    /*
    
        Add routes to "router" object

     */
    router.all('/payment', orderPayment);
    router.post('/payment/data/process', dataProcess);
    router.all('/payment/complete', dataSucesss);
    router.all('/payment/failed', dataFailed);
};