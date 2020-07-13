const path = require('path');
const config = require(path.join(__dirname, '..', '..', '..', 'core', 'config.js'));
const ObjectID = require('mongodb').ObjectID;
const fs = require('fs');

let configModule;
try {
    configModule = require(path.join(__dirname, '..', 'config', 'hosting.json'));
} catch (e) {
    configModule = require(path.join(__dirname, '..', 'config', 'hosting.dist.json'));
}

const pluginsData = fs.readdirSync(path.join(__dirname, '..', 'plugins_hosting'));
for (let i in pluginsData) { pluginsData[i] = pluginsData[i].replace(/\.js$/, ''); }
let plugins = {};

const script = async() => {
    try {
        for (let i in pluginsData) {
            const Plugin = require(path.join(__dirname, '..', 'plugins_hosting', pluginsData[i]));
            plugins[pluginsData[i]] = new Plugin();
        }
        const database = new(require(path.join(__dirname, '..', '..', '..', 'core', 'database.js')))(false, config.mongo, false);
        await database.connect();
        const db = database.get();
        const mailer = new(require(path.join(__dirname, '..', '..', '..', 'core', 'mailer.js')))(null, db);
        const render = new(require(path.join(__dirname, '..', '..', '..', 'core', 'render.js')))(path.join(__dirname, '..', 'views'), null);
        const i18n = new(require(path.join(__dirname, '..', '..', '..', 'core', 'i18n.js')))(path.join(__dirname, '..', 'lang'), null);
        // Get accounts where days = 1
        const accountsExpData = await db.collection('hosting_accounts').find({
            days: 1
        }).toArray();        
        // Decrease days by 1
        let updResult = await db.collection('hosting_accounts').updateMany({
            days: { $gte: 1 }
        }, {
            $inc: {
                days: -1
            }
        });
        if (!updResult || !updResult.result || !updResult.result.ok) {
            throw new Error('Could not decrease days');
        }
        // Get all accounts where days < warnDays and days > 0
        let accounts = {};
        let accountsDisable = {};
        const accountsData = await db.collection('hosting_accounts').find({
            $and: [
                { days: { $lte: configModule.warnDays } },
                { days: { $gt: 0 } }
            ]
        }).toArray();        
        for (let i in accountsData) {
            if (!accounts[accountsData[i].ref_id]) {
                accounts[accountsData[i].ref_id] = {
                    accounts: []
                };
            }
            accounts[accountsData[i].ref_id].accounts.push({
                id: accountsData[i].id,
                days: accountsData[i].days
            })
        }
        // Get e-mails
        let usersQuery = [];
        for (let i in accounts) {
            usersQuery.push({ _id: new ObjectID(i) });
        }
        let usersData = [];
        if (usersQuery.length) {
            usersData = await db.collection('users').find({ $or: usersQuery }, { sort: {}, projection: { _id: 1, email: 1, locale: 1 } }).toArray();
        }
        for (let i in usersData) {
            accounts[String(usersData[i]._id)].email = usersData[i].email;
            accounts[String(usersData[i]._id)].locale = usersData[i].locale;
        }
        // Send mails
        for (let i in accounts) {
            const data = accounts[i];
            const mailHTML = await render.file('mail_expiration.html', {
                i18n: i18n.get(),
                locale: data.locale,
                accounts: data.accounts,
                lang: JSON.stringify(i18n.get().locales[data.locale]),
                config: config
            });
            await mailer.send({
                session: {
                    currentLocale: data.locale
                }
            }, data.email, i18n.get().__(data.locale, 'Expiring Accounts'), mailHTML);
        }
        // Stop expired accounts
        for (let i in accountsExpData) {
            const id = accountsExpData[i].id;
            const host = accountsExpData[i].host;
            const plugin = accountsExpData[i].plugin;
            const locale = accountsExpData[i].locale;
            const res = await plugins[plugin].stop(id, host, locale);
        }
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};
script();