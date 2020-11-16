import path from "path";
import fs from "fs-extra";
import Pino from "pino";
import crypto from "crypto";

(async () => {
    let buildJson;
    let config;
    let pino;
    let modules;
    const modulesConfig = {};
    try {
        buildJson = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/build.json`));
        config = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`));
        config.secretInt = parseInt(crypto.createHash("md5").update(config.secret).digest("hex"), 16);
        pino = Pino({
            level: config.logLevel
        });
        modules = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/modules.json`));
        pino.info(`Starting ZOIA ${buildJson.version} / ${buildJson.mode} (built at: ${buildJson.date})`);
        pino.info(`Available module(s): ${modules.map(m => m.id).join(", ")}`);
        modules.map(m => {
            try {
                modulesConfig[m.id] = require(`../../../modules/${m.id}/config.dist.json`);
            } catch (e) {
                pino.error(`Fatal: unable to load default config for module: "${m.id}"`);
                process.exit(1);
            }
            try {
                modulesConfig[m.id] = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/modules/${m.id}.json`));
                m.admin = modulesConfig[m.id] && modulesConfig[m.id].routes && modulesConfig[m.id].routes.admin ? modulesConfig[m.id].routes.admin : undefined;
            } catch (e) {
                // Ignore
            }
        });
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Fatal: ${e}`);
        process.exit(1);
    }
    try {
        // Load all tests
        await Promise.all(modules.map(async m => {
            try {
                const moduleWeb = await import(`../../../modules/${m.id}/test/index.js`);
                if (config.modules.indexOf(m.id) === -1) {
                    return;
                }
                moduleWeb.default();
            } catch {
                // Ignore
            }
        }));
    } catch (e) {
        pino.error(`Fatal: ${e}`);
        process.exit(1);
    }
})();
