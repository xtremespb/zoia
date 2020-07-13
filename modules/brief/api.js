const Module = require('../../core/module.js');
const validation = new(require('../../core/validation.js'))();
const Router = require('co-router');
const briefFields = require('./schemas/briefFields.js');
const config = require('../../core/config.js');
const ObjectID = require('mongodb').ObjectID;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const Telegraf = require('telegraf');
let configModule;
try {
    configModule = require('./config/brief.json');
} catch (e) {
    configModule = require('./config/brief.dist.json');
}
const bot = new Telegraf(configModule.telegram_token);

module.exports = function(app) {
    const log = app.get('log');
    const db = app.get('db');
    const security = new(require('../../core/security.js'))(app);
    const i18n = new(require('../../core/i18n.js'))(`${__dirname}/lang`, app);

    const savePdfToFile = (pdf, fileName) => {
        return new Promise((resolve, reject) => {
            let pendingStepCount = 2;
            const stepFinished = () => {
                if (--pendingStepCount == 0) {
                    resolve();
                }
            };
            const writeStream = fs.createWriteStream(fileName);
            writeStream.on('close', stepFinished);
            pdf.pipe(writeStream);
            pdf.end();
            stepFinished();
        });
    }

    const post = async (req, res) => {
        res.contentType('application/json');
        let locale = config.i18n.locales[0];
        if (req.session && req.session.currentLocale) {
            locale = req.session.currentLocale;
        }
        const fieldList = briefFields.getBriefFields();
        let fields = validation.checkRequest(req, fieldList);
        let fieldsFailed = validation.getCheckRequestFailedFields(fields);
        if (fieldsFailed.length > 0) {
            return res.send(JSON.stringify({
                status: 0,
                fields: fieldsFailed
            }));
        }
        if (!req.session || fields.captcha.value !== req.session.captcha) {
            req.session.captcha = null;
            return res.send(JSON.stringify({
                status: -3,
                fields: ['captcha']
            }));
        }
        req.session.captcha = Math.random().toString().substr(2, 4);
        try {
            Object.keys(fields).forEach(function(key) {
                fields[key] = fields[key].value;
            });
            fields.identity = fields.identity === '1' ? i18n.get().__(locale, 'Yes') : i18n.get().__(locale, 'No');
            fields.website = fields.website === '1' ? i18n.get().__(locale, 'Yes') : i18n.get().__(locale, 'No');
            fields.hosting = fields.hosting === '1' ? i18n.get().__(locale, 'Yes') : i18n.get().__(locale, 'No');
            fields.content = fields.content === '1' ? i18n.get().__(locale, 'Yes') : i18n.get().__(locale, 'No');
            fields.pcontent = fields.pcontent === '1' ? i18n.get().__(locale, 'Yes') : i18n.get().__(locale, 'No');
            fields.support = fields.support === '1' ? i18n.get().__(locale, 'Yes') : i18n.get().__(locale, 'No');
            fields.type = i18n.get().__(locale, 'types')[fields.type];
            const doc = new PDFDocument();
            const FONT_BOLD = `${__dirname}/fonts/SourceSansPro-Bold.ttf`;
            const FONT_LIGHT = `${__dirname}/fonts/SourceSansPro-Light.ttf`;
            doc.font(FONT_BOLD).fontSize(25).text(i18n.get().__(locale, 'Project Brief'), 20, 20);
            doc.font(FONT_BOLD).moveDown(0.5).fontSize(10).text(i18n.get().__(locale, 'Company title'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.title);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Contact person, contact information'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.contact);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'E-mail'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.email);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Products or services you provide'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.products);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Does your company have a logo or corporate identity?'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.identity);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Slogan'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.slogan);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Does your company have a website?'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.website);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'General message for your customers'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.message);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Purpose(s) of the website'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.purpose);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Which colors you wish to use and why?'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.colors);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, '2-3 websites of your competitors'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.competitors);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Which sites you like might be used as examples?'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.examples);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Negative website examples'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.nexamples);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Did you find a hoster?'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.hosting);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Domain name(s)'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.domains);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Type of your new website'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.type);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Planned website navigation areas'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.navigation);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Website content ready'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.content);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Primary content placement'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.pcontent);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Production stage support'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.support);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Pages count (approx.)'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.pages);
            doc.font(FONT_BOLD).moveDown(0.3).fontSize(10).text(i18n.get().__(locale, 'Planned budget (approx.)'));
            doc.font(FONT_LIGHT).fontSize(12).text(fields.budget);
            const filename = Date.now();
            await savePdfToFile(doc, `${__dirname}/data/${filename}.pdf`);
            for (let i in configModule.telegram_chat_ids) {
                const id = configModule.telegram_chat_ids[i];
                try {
                    bot.telegram.sendDocument(id, {
                        source: `${__dirname}/data/${filename}.pdf`,
                        filename: `brief_${filename}.pdf`
                    });
                } catch(e) {
                    log.error(e);
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
    router.post('/post', post);

    return {
        routes: router
    };
};