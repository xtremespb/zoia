const path = require('path');
const config = require(path.join(__dirname, 'config.js'));
const ObjectID = require('mongodb').ObjectID;

module.exports = class Security {
    constructor(app) {
        if (app) {
            this.app = app;
            this.db = app.get('db');
        }
    }
    async checkActionInterval(req, caId, sec) {
        if (!req || !req.session || !req.session.auth) {
            return false;
        }
        const id = req.session.auth._id;
        const saved = req.session.auth.intervals ? req.session.auth.intervals[caId] : null;
        const current = parseInt(Date.now() / 1000, 10);
        let what = {};
        what['intervals.' + caId] = current;
        let updResult = await this.db.collection('users').update({ _id: new ObjectID(id) }, { $set: what }, { upsert: false });
        if (!updResult || !updResult.result || !updResult.result.ok) {
            return false;
        }
        if (saved && current - saved < sec) {
            return false;
        }
        return true;
    }
};