const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Module = require(path.join(__dirname, '..', '..', '..', 'core', 'module.js'));
const config = require(path.join(__dirname, '..', '..', '..', 'core', 'config.js'));
let configPlugin;
try {
    configPlugin = require(path.join(__dirname, '..', 'config', 'robokassa.json'));
} catch (e) {
    configPlugin = require(path.join(__dirname, '..', 'config', 'robokassa.dist.json'));
}
let templatePaymentError = 'payment_error.html';
if (fs.existsSync(path.join(__dirname, '..', 'views', 'custom_' + templatePaymentError))) {
    templatePaymentError = 'custom_' + templatePaymentError;
}
let templatePaymentSuccess = 'payment_success.html';
if (fs.existsSync(path.join(__dirname, '..', 'views', 'custom_' + templatePaymentSuccess))) {
    templatePaymentSuccess = 'custom_' + templatePaymentSuccess;
}
let configModule;
try {
    configModule = require(path.join(__dirname, '..', 'config', 'hosting.json'));
} catch (e) {
    configModule = require(path.join(__dirname, '..', 'config', 'hosting.dist.json'));
}

module.exports = function(app, router) {
    const db = app.get('db');
    const log = app.get('log');
    const i18n = new(require(path.join(__dirname, '..', '..', '..', 'core', 'i18n.js')))(path.join(__dirname, '..', 'lang'), app);
    const renderModule = new(require(path.join(__dirname, '..', '..', '..', 'core', 'render.js')))(path.join(__dirname, '..', 'views'), app);
    const renderRoot = new(require(path.join(__dirname, '..', '..', '..', 'core', 'render.js')))(path.join(__dirname, '..', '..', '..', 'views'), app);
    const render = new(require(path.join(__dirname, '..', '..', '..', 'core', 'render.js')))(path.join(__dirname, '..', 'views'), app);
    const mailer = new(require(path.join(__dirname, '..', '..', '..', 'core', 'mailer.js')))(app);
    const security = new(require(path.join(__dirname, '..', '..', '..', 'core', 'security.js')))(app);

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

    const createPaymentRequest = async(req, res) => {
        const locale = req.session.currentLocale;
        let sum = req.query.sum || req.body.sum;
        let captcha = req.query.captcha || req.body.captcha;
        res.contentType('application/json');
        const allowed = await security.checkActionInterval(req, 'createTopUpRequest', 10);
        if (!allowed) {
            return res.send(JSON.stringify({ status: 0, error: i18n.get().__(locale, 'Please wait some time before you create another payment request.') }));
        }
        req.session.captcha = null;
        if (!sum || typeof sum !== 'string' || !sum.match(/^\d+(\.\d+)?$/)) {
            return res.send(JSON.stringify({ status: 0, error: i18n.get().__(locale, 'Invalid sum, please check form data and try again.') }));
        }
        sum = parseFloat(sum);
        try {
            const incr = await db.collection('hosting_counters').findAndModify({ _id: 'payment' }, [], { $inc: { seq: 1 } }, { new: true, upsert: true });
            if (!incr || !incr.value || !incr.value.seq) {
                return res.send(JSON.stringify({ status: 0 }));
            }
            const id = incr.value.seq;
            const insResult = await db.collection('hosting_payments').insertOne({ _id: id, sum: sum, timestamp: parseInt(Date.now() / 1000, 10), user_id: String(req.session.auth._id), locale: locale, email: req.session.auth.email });
            if (!insResult || !insResult.result || !insResult.result.ok) {
                return res.send(JSON.stringify({ status: 0 }));
            }
            const signature = crypto.createHash('md5').update(configPlugin.sMerchantLogin + ':' + sum + ':' + id + ':' + configPlugin.sMerchantPass1).digest('hex');
            const url = configPlugin.url + '?MrchLogin=' + configPlugin.sMerchantLogin + '&OutSum=' +
                sum + '&InvId=' + id + '&Desc=' + i18n.get().__(locale, 'Payment ID') + ' ' +
                id + '&SignatureValue=' + signature + '&IncCurrLabel=' + configPlugin.sIncCurrLabel +
                '&Culture=' + locale + '&rnd=' + Math.random().toString().replace('.', '');
            return res.send(JSON.stringify({
                status: 1,
                url: url
            }));
        } catch (e) {
            res.send(JSON.stringify({
                status: 0,
                error: e.message
            }));
        }
    };

    const dataProcess = async(req, res) => {
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
        try {
            const paymentData = await db.collection('hosting_payments').findOne({ _id: parseInt(id, 10) });
            if (!paymentData) {
                return res.send('Request does not exist or is already paid');
            }
            const delResult = await db.collection('hosting_payments').remove({ _id: parseInt(id, 10) });
            if (!delResult || !delResult.result || !delResult.result.ok) {
                return res.send('Could not update the database record');
            }
            const timestamp = parseInt(Date.now() / 1000, 10);
            const insResult = await db.collection('hosting_transactions').insertOne({ ref_id: paymentData.user_id, timestamp: timestamp, sum: parseFloat(paymentData.sum) });
            if (!insResult || !insResult.result || !insResult.result.ok) {
                return res.send('Could not update the database record');
            }
            const locale = paymentData.locale;
            const sumText = (configModule.currencyPosition === 'left' ? configModule.currency[locale] : '') + paymentData.sum + (configModule.currencyPosition === 'right' ? ' ' + configModule.currency[locale] : '');
            let mailHTML = await render.file('mail_topup.html', {
                i18n: i18n.get(),
                locale: locale,
                lang: JSON.stringify(i18n.get().locales[locale]),
                config: config,
                sum: sumText
            });
            await mailer.send(req, paymentData.email, i18n.get().__(locale, 'Successful Payment'), mailHTML);
            return res.send('OK');
        } catch (e) {
            log.error(e);
        }
    };

    const dataComplete = async(req, res) => {
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
            return renderError(req, res, i18n.get().__(locale, 'The payment signature is invalid. If you believe that is wrong, please contact website support.'));
        }
        let templateHTML = await renderModule.file(templatePaymentSuccess, {
            i18n: i18n.get(),
            locale: locale
        });
        let html = await renderRoot.template(req, i18n, locale, i18n.get().__(locale, 'Successful Payment'), {
            content: templateHTML,
            extraCSS: [],
            extraJS: []
        });
        res.send(html);
    };

    const dataFailed = async(req, res) => {
        const locale = req.session.currentLocale;
        let filters = app.get('templateFilters');
        renderRoot.setFilters(filters);
        return renderError(req, res, i18n.get().__(locale, 'Could not complete your payment. Please contact website support for more information or try again.'));
    };

    router.post('/payment/request', createPaymentRequest);
    router.post('/payment/process', dataProcess);
    router.all('/payment/complete', dataComplete);
    router.all('/payment/failed', dataFailed);
};