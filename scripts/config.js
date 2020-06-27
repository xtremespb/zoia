/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const {
    v4: uuidv4
} = require("uuid");
const crypto = require("crypto");

const source = path.resolve(`${__dirname}/../etc/dist/zoia.dist.json`);
const dest = path.resolve(`${__dirname}/../etc/zoia.json`);
const configData = fs.readJSONSync(source);
configData.secret = crypto.createHmac("sha256", uuidv4()).update(uuidv4()).digest("hex");
fs.writeJSONSync(dest, configData, {
    spaces: 4
});
console.log(`Configuration file has been written to: ${dest}
Server configuration: ${configData.webServer.ip}:${configData.webServer.port}
Mongo configuration: ${configData.mongo.url}/${configData.mongo.dbName}
A new secret has been auto-generated.
Please change the zoia.json configuration file according to your needs.`);
