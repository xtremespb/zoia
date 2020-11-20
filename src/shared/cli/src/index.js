/* eslint-disable no-console */
import commandLineArgs from "command-line-args";
import colors from "colors/safe";
import fs from "fs-extra";
import crypto from "crypto";
import path from "path";
import {
    MongoClient
} from "mongodb";

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
}]);

(async () => {
    if (Object.keys(options).length < 1 || (options.maintenance && !options.maintenance.match(/on|off/)) || (options.user && !options.email)) {
        console.error(`\n${colors.brightWhite(" ZOIA CLI Usage:")}\n\n ${colors.brightCyan("z3-cli")} ${colors.yellow("--maintenance")} ${colors.red("on")}|${colors.green("off")} - ${colors.grey("turn maintenance mode on or off")}\n        ${colors.yellow("--user")} ${colors.green("username")} ${colors.yellow("--email")} ${colors.green("user@domain.com")} - ${colors.grey("create an user or reset password")}`);
    }
    try {
        const config = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`));
        const modules = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/modules.json`));
        const modulesConfig = {};
        modules.map(m => {
            try {
                modulesConfig[m.id] = require(`../../../modules/${m.id}/config.dist.json`);
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
        // Connect to Mongo
        const mongoClient = new MongoClient(config.mongo.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await mongoClient.connect();
        const db = mongoClient.db(config.mongo.dbName);
        // ------------------------------------------------------------- //
        // Turn maintenance on or off                                    //
        // ------------------------------------------------------------- //
        if (options.maintenance) {
            const resultSave = await db.collection(config.collections.registry).updateOne({
                _id: "core_maintenance"
            }, {
                $set: {
                    status: options.maintenance === "on"
                }
            }, {
                upsert: true
            });
            if (!resultSave || !resultSave.result || !resultSave.result.ok) {
                console.error(`\n${colors.red("ERROR:")} ${colors.white("Could not save maintenance status")}`);
            }
            console.log(`\n${colors.green("SUCCESS:")} ${colors.white(`Maintenance mode is now "${options.maintenance}"`)}`);
        }
        // ------------------------------------------------------------- //
        // Create/reset password for an user                             //
        // ------------------------------------------------------------- //
        if (options.user) {
            const password = crypto.createHmac("sha256", config.secret).update("password").digest("hex");
            await db.collection(modulesConfig["users"].collectionUsers).updateOne({
                username: options.user
            }, {
                $set: {
                    username: options.user,
                    password,
                    email: options.email,
                    status: ["active", "admin"],
                    createdAt: new Date()
                }
            }, {
                upsert: true
            });
            console.log(`\n${colors.green("SUCCESS:")} ${colors.white(`User "${options.user}" with password "password" has been created/updated`)}`);
        }
        // Shut down Mongo connection
        await mongoClient.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
