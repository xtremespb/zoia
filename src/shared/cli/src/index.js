/* eslint-disable no-console */
import commandLineArgs from "command-line-args";
import colors from "colors/safe";
import fs from "fs-extra";
import path from "path";
import {
    MongoClient
} from "mongodb";
import maintenance from "./maintenance";
import user from "./user";
import demo from "./demo";
import acl from "./acl";
import patch from "./patch";
import defaults from "./defaults";
import packageJson from "../../../../package.json";

const options = commandLineArgs([{
    name: "maintenance",
    alias: "m",
    type: String
}, {
    name: "user",
    alias: "u",
    type: String
}, {
    name: "email",
    alias: "e",
    type: String
}, {
    name: "demo",
    alias: "d",
    type: String
}, {
    name: "acl",
    alias: "a",
    type: String
}, {
    name: "permissions",
    alias: "p",
    type: String
}, {
    name: "patch",
    alias: "c",
    type: String
}, {
    name: "defaults",
    alias: "s",
    type: Boolean
}]);

(async () => {
    console.log(`
  ______     ______     __     ______    
 /\\___  \\   /\\  __ \\   /\\ \\   /\\  __ \\   
 \\/_/  /__  \\ \\ \\/\\ \\  \\ \\ \\  \\ \\  __ \\  
   /\\_____\\  \\ \\_____\\  \\ \\_\\  \\ \\_\\ \\_\\ 
   \\/_____/   \\/_____/   \\/_/   \\/_/\\/_/
`);
    console.log(colors.brightWhite(` Console client, version: ${packageJson.version}`));
    if (Object.keys(options).length < 1 || (options.maintenance && !options.maintenance.match(/on|off/)) || (options.demo && !options.demo.match(/on|off/)) || options.acl === null) {
        console.error(`\n ${colors.brightCyan("npm run cli")} -- ${colors.yellow("--maintenance")} ${colors.red("on")}|${colors.green("off")} - ${colors.grey("turn maintenance mode on or off")}\n                ${colors.yellow("--user")} ${colors.green("username")} - ${colors.grey("create an user or reset password")}\n                ${colors.yellow("--demo")} ${colors.red("on")}|${colors.green("off")} - ${colors.grey("turn demo mode on or off")}\n                ${colors.yellow("--acl")} ${colors.green("group")} ${colors.yellow("--permissions")} ${colors.green("crud")} - ${colors.grey("set ACL for group (create, read, update, delete)")}\n                ${colors.yellow("--defaults")} - ${colors.grey("create defaults for all modules")}`);
    }
    try {
        const config = {
            ...fs.readJSONSync(path.resolve(`${__dirname}/../../etc/system.json`)),
            ...fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`))
        };
        const modules = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/modules.json`));
        const modulesConfig = {};
        modules.map(m => {
            const moduleDir = m.parentModule ? `${m.parentModule}/${m.id}` : m.id;
            try {
                modulesConfig[m.id] = require(`../../../modules/${moduleDir}/config.dist.json`);
            } catch (e) {
                console.error(`Fatal: unable to load default config for module: "${m.id}"`);
                process.exit(1);
            }
            try {
                modulesConfig[m.id] = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/modules/${m.id}.json`));
            } catch {
                // Ignore
            }
        });
        let defaultsData = {};
        try {
            defaultsData = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/defaults.json`));
        } catch {
            // Ignore
        }
        // Connect to Mongo
        const mongoClient = new MongoClient(config.mongo.url, config.mongo.options || {
            useUnifiedTopology: true,
            connectTimeoutMS: 5000,
            keepAlive: true,
            useNewUrlParser: true
        });
        let db = null;
        try {
            await mongoClient.connect();
            db = mongoClient.db(config.mongo.dbName);
        } catch {
            // Ignore
        }
        // Maintenance
        if (options.maintenance) {
            await maintenance(config, options, modulesConfig, db);
        }
        // Create/reset password for an user
        if (options.user) {
            await user(config, options, modulesConfig, db);
        }
        // Demo
        if (options.demo) {
            await demo(config, options, modulesConfig, db);
        }
        // ACL
        if (options.acl) {
            await acl(config, options, modulesConfig, db);
        }
        // Patch
        if (options.patch) {
            await patch(config, options, modulesConfig, db);
        }
        // Defaults
        if (options.defaults) {
            await defaults(config, options, modulesConfig, db, defaultsData);
        }
        // Shut down Mongo connection
        if (db) {
            await mongoClient.close();
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
