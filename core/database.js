const MongoClient = require('mongodb').MongoClient;
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const path = require('path');
const MongoStoreBrute = require(path.join(__dirname, 'modules', 'expressBruteMongo.js'));

module.exports = class Database {
    constructor(app, mongo, _session) {
        this.app = app;
        this.mongo = mongo;
        this.session = _session;
        this.log = app ? app.get('log') : undefined;
        if (process.env.MONGO_PORT_27017_TCP_ADDR && process.env.MONGO_PORT_27017_TCP_PORT) {
            this.mongo.url = this.mongo.url.replace(/127\.0\.0\.1/, process.env.MONGO_PORT_27017_TCP_ADDR)
                .replace(/27017/, process.env.MONGO_PORT_27017_TCP_PORT);
        }
    }
    async connect() {
        let dbObj;
        try {
            this.mongo.options.useNewUrlParser = true;
            dbObj = await MongoClient.connect(this.mongo.url, this.mongo.options);
        } catch (e) {
            throw new Error('Could not connect to the MongoDB. Check your settings.');
        }
        this.db = dbObj.db(this.mongo.database);
        if (this.app && this.session) {
            this.app.use(session({
                saveUninitialized: false,
                resave: false,
                secret: this.session.secret,
                name: this.session.name,
                cookie: this.session.cookie,
                store: new MongoStore({ db: this.db, collection: this.mongo.sessionCollection })
            }));
        }
        this.bruteforceStore = new MongoStoreBrute((ready) => {
            ready(dbObj.db(this.mongo.database).collection('bruteforce_store'));
        });
        let that = this;
        this.db.on('close', function() {
            if (that.log) {
                that.log.error('Database disconnected');
            } else {
                console.log('Database disconnected');
            }
        });
        this.db.on('reconnect', function() {
            if (that.log) {
                that.log.info('Database reconnected');
            } else {
                console.log('Database reconnected');
            }
        });
    }
    get() {
        return this.db;
    }
};