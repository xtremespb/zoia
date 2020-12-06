/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const {
    v4: uuidv4
} = require("uuid");
const crypto = require("crypto");

const sourceZoia = path.resolve(`${__dirname}/../../src/config/zoia.dist.json`);
const sourceSystem = path.resolve(`${__dirname}/../../src/config/system.dist.json`);
const destZoia = path.resolve(`${__dirname}/../../etc/zoia.json`);
const destSystem = path.resolve(`${__dirname}/../../etc/system.json`);
const zoiaData = fs.readJSONSync(sourceZoia);
const systemData = fs.readJSONSync(sourceSystem);
systemData.secret = crypto.createHmac("sha256", uuidv4()).update(uuidv4()).digest("hex");
fs.ensureDirSync(path.resolve(`${__dirname}/../../etc/modules`));
fs.writeJSONSync(destZoia, zoiaData, {
    spaces: 4
});
fs.writeJSONSync(destSystem, systemData, {
    spaces: 4
});
console.log(`Configuration files are written to:\n ${destZoia},\n ${destSystem}\n
Site ID: ${systemData.id}
Server configuration: ${systemData.webServer.ip}:${systemData.webServer.port}
Mongo configuration: ${systemData.mongo.url}/${systemData.mongo.dbName}
Redis configuration: ${systemData.redis.enabled ? "enabled" : "disabled"}, ${systemData.redis.host}:${systemData.redis.port}
A new secret has been auto-generated.\n
Please change the system.json and zoia.json configuration files according to your needs.\n`);
