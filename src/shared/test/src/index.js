import path from "path";
import fs from "fs-extra";
import crypto from "crypto";
import Redis from "ioredis";
import {
    MongoClient
} from "mongodb";
import Log from "./log";
import Utils from "./utils";

(async () => {
    const zoia = {
        modulesConfig: {}
    };
    try {
        zoia.buildJson = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/build.json`));
        zoia.config = {
            ...fs.readJSONSync(path.resolve(`${__dirname}/../../etc/system.json`)),
            ...fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`))
        };
        zoia.config.secretInt = parseInt(crypto.createHash("md5").update(zoia.config.secret).digest("hex"), 16);
        zoia.log = new Log();
        zoia.modules = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/modules.json`));
        zoia.log.info(`Running tests for ZOIA ${zoia.buildJson.version} / ${zoia.buildJson.mode} (built at: ${zoia.buildJson.date})`);
        zoia.log.info(`Test mode: ${zoia.config.test.headless ? "headless" : "open browser"}, ${zoia.config.test.args.join(", ")}`);
        zoia.log.info(`Available module(s): ${zoia.modules.map(m => m.id).join(", ")}`);
        // Connect to Mongo
        zoia.mongoClient = new MongoClient(zoia.config.mongo.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await zoia.mongoClient.connect();
        zoia.log.info(`Connected to Mongo Server: (${zoia.config.mongo.url}/${zoia.config.mongo.dbName})`);
        zoia.db = zoia.mongoClient.db(zoia.config.mongo.dbName);
        // Connect to Redis
        if (zoia.config.redis && zoia.config.redis.enabled) {
            zoia.redis = new Redis(zoia.config.redis);
            zoia.redis.on("error", e => {
                zoia.log.error(`Fatal: Redis is failed (${e})`);
                process.exit(1);
            });
            zoia.log.info(`Connected to Redis Server (${zoia.config.redis.host}:${zoia.config.redis.port})`);
        }
        // Init Utils
        zoia.utils = new Utils(zoia.config, zoia.modulesConfig, zoia.db, zoia.redis);
        // Load Modules
        zoia.modules.map(m => {
            try {
                zoia.modulesConfig[m.id] = require(`../../../modules/${m.id}/config.dist.json`);
            } catch (e) {
                zoia.log.error(`Fatal: unable to load default config for module: "${m.id}"`);
                process.exit(1);
            }
            try {
                zoia.modulesConfig[m.id] = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/modules/${m.id}.json`));
                m.admin = zoia.modulesConfig[m.id] && zoia.modulesConfig[m.id].routes && zoia.modulesConfig[m.id].routes[m.id] ? zoia.modulesConfig[m.id].routes[m.id] : undefined;
            } catch (e) {
                // Ignore
            }
        });
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Fatal: ${e}`);
        process.exit(1);
    }
    let failed = false;
    const testResults = {};
    try {
        // Load all tests
        await Promise.all(zoia.modules.map(async m => {
            if (!m.test) {
                return;
            }
            try {
                let moduleTest;
                try {
                    moduleTest = await import(`../../../modules/${m.id}/z3test/index.js`);
                } catch (e) {
                    // Ignore
                }
                if (!moduleTest || [...zoia.config.modules, "core", "users", "acl"].indexOf(m.id) === -1) {
                    return;
                }
                const moduleTestResult = await moduleTest.default(zoia);
                testResults[m.id] = moduleTestResult;
                if (moduleTestResult.success < moduleTestResult.total) {
                    failed = true;
                }
            } catch (e) {
                zoia.log.error(e);
                // Ignore
            }
        }));
    } catch (e) {
        zoia.log.error(`Fatal: ${e}`);
        process.exit(1);
    }
    try {
        if (zoia.redis) {
            zoia.redis.quit();
        }
        zoia.mongoClient.close();
    } catch {
        process.exit(1);
    }
    let totalTests = 0;
    let totalTestsSuccess = 0;
    Object.keys(testResults).map(m => {
        if (!testResults[m].total) {
            return;
        }
        totalTests += testResults[m].total;
        totalTestsSuccess += testResults[m].success;
        zoia.log.print(`Module: ${m}, total test(s): ${testResults[m].total}, success: ${testResults[m].success}, verdict: ${testResults[m].total === testResults[m].success ? "OK" : "FAIL"}`, testResults[m].total === testResults[m].success ? "success" : "error");
    });
    zoia.log.print(`Total test(s): ${totalTests}, success: ${totalTestsSuccess}, verdict: ${failed ? "FAIL" : "OK"}`, failed ? "error" : "success");
    // process.exit(failed ? 1 : 0);
})();
