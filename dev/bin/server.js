/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");

const config = require(path.resolve(`${__dirname}/../../etc/system.json`));
fs.ensureDirSync(path.resolve(`${__dirname}/../../logs`));
fs.ensureDirSync(path.resolve(`${__dirname}/../../build/configs`));
const nginxSource = path.resolve(`${__dirname}/../../src/config/nginx.dist.conf`);
const nginxDest = path.resolve(`${__dirname}/../../build/configs/${config.hostname}.conf`);
const nginxConfigData = fs.readFileSync(nginxSource, "utf8")
    .replace(/{server_name}/gm, config.hostname)
    .replace(/{site_id}/gm, config.id)
    .replace(/{root}/gm, path.resolve(`${__dirname}/../..`).replace(/\\/gm, "/"))
    .replace(/{ip}/gm, config.webServer.ip)
    .replace(/{port}/gm, config.webServer.port);
fs.writeFileSync(nginxDest, nginxConfigData, "utf8");
const serviceSource = path.resolve(`${__dirname}/../../src/config/zoia.dist.service`);
const serviceDest = path.resolve(`${__dirname}/../../build/configs/${config.id}.service`);
const serviceConfigData = fs.readFileSync(serviceSource, "utf8")
    .replace(/{site_id}/gm, config.id)
    .replace(/{root}/gm, path.resolve(`${__dirname}/../..`).replace(/\\/gm, "/"))
    .replace(/{user}/gm, config.webServer.user)
    .replace(/{group}/gm, config.webServer.group);
fs.writeFileSync(serviceDest, serviceConfigData, "utf8");
console.log(`NGINX Server Configuration file has been written to: ${nginxDest}
A systemd service file has been written to: ${serviceDest}
Please change the configuration files according to your needs.\n`);
