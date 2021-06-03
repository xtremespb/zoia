/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const {
    MongoClient
} = require("mongodb");
const commandLineArgs = require("command-line-args");
const colors = require("colors/safe");

let packageJson;
try {
    packageJson = require(path.resolve(`${__dirname}/../../package.json`));
} catch {
    console.log(colors.brightRed("Fatal: could not load package.json"));
    console.log(colors.grey(`Please get this file from Github, you won't be able to run ZOIA otherwise.\n`));
    process.exit(1);
}

const options = commandLineArgs([{
    name: "module",
    alias: "m",
    type: String
}, {
    name: "all",
    alias: "a",
    type: Boolean
}, {
    name: "defaults",
    alias: "d",
    type: Boolean
}]);

console.log(colors.bgGrey(colors.black(`                            \n  ZOIA Installation Script  \n                            \n`)));
console.log(`${colors.cyan("Version")}: ${colors.brightWhite(packageJson.version)}\n`);

if (!Object.keys(options).length || (!options.module && !options.all)) {
    console.log(`   Usage: ${colors.brightWhite("npm run setup -- [--all] [--module name] [--defaults]")}\n\n          --all (-a): install all modules\n          --module (-m): install specified module\n          --defaults (-d): install default(s) for specified module(s)\n\nExamples: ${colors.brightWhite("npm run setup -- -ad")} (install all modules and defaults)\n          ${colors.brightWhite(`npm run setup -- --module ${colors.grey("users")} --defaults`)} (install "users" module and its defaults)\n`);
    process.exit(0);
}

let config;
let modules;
try {
    config = {
        ...fs.readJSONSync(path.resolve(`${__dirname}/../../etc/system.json`)),
        ...fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`))
    };
} catch {
    console.log(colors.brightRed("Fatal: could not load etc/system.json or etc/zoia.json"));
    console.log(colors.grey(`Please run the following command to generate the configuration file: npm run config\n`));
    process.exit(1);
}
try {
    modules = fs.readJSONSync(path.resolve(`${__dirname}/../../build/etc/modules.json`)).filter(m => options.module ? m.id === options.module : true);
} catch {
    console.log(colors.brightRed("Fatal: could not load build/etc/modules.json"));
    console.log(colors.grey(`Please run the following command to generate the configuration file: npm run build-production\n`));
    process.exit(1);
}
const languages = Object.keys(config.languages);

console.log(colors.yellow(`Installing modules: ${modules.map(m => m.id).join(", ")}${options.defaults ? " (including defaults)" : ""}\n`));

(async () => {
    try {
        console.log("* Connecting to the database");
        const mongoClient = new MongoClient(config.mongo.url, config.mongo.options || {
            useUnifiedTopology: true,
            connectTimeoutMS: 5000,
            keepAlive: true,
            useNewUrlParser: true
        });
        await mongoClient.connect();
        const db = mongoClient.db(config.mongo.dbName);
        console.log("* Connected.");
        for (const m of modules) {
            try {
                const moduleDir = m.parentModule ? `${m.parentModule}/${m.id}` : m.id;
                console.log(colors.cyan(`\nInstalling module: ${colors.brightWhite(m.id)}\n`));
                console.log(`* Loading configuration file: ${fs.existsSync(path.resolve(`${__dirname}/../../etc/modules/$moduleDir}.json`)) ? `../../etc/modules/${m.id}.json` : `../../src/modules/${moduleDir}/config.dist.json`}`);
                const moduleConfig = fs.existsSync(path.resolve(`${__dirname}/../../etc/modules/${m.id}.json`)) ? require(path.resolve(`${__dirname}/../../etc/modules/${m.id}.json`)) : require(path.resolve(`${__dirname}/../../src/modules/${moduleDir}/config.dist.json`));
                console.log(`* Configuration file loaded.`);
                // Process database routines
                if (moduleConfig.database) {
                    console.log(`* Processing database collections`);
                    const collections = Object.keys(moduleConfig.database.collections);
                    for (const c of collections) {
                        try {
                            console.log(`* Creating collection: "${c}"`);
                            try {
                                await db.createCollection(c);
                            } catch {
                                // Ignore
                            }
                            const {
                                indexesAsc,
                                indexesDesc,
                                expires
                            } = moduleConfig.database.collections[c];
                            if (indexesAsc && indexesAsc.length) {
                                const indexes = {};
                                indexesAsc.map(i => {
                                    if (i.match(/\[language\]/i)) {
                                        languages.map(language => {
                                            const index = i.replace(/\[language\]/i, language);
                                            indexes[index] = 1;
                                        });
                                    } else {
                                        indexes[i] = 1;
                                    }
                                });
                                console.log(`* Creating indexes: "${m.id}_${c}_asc"`);
                                await db.collection(c).createIndex(indexes, {
                                    name: `${m.id}_${c}_asc`
                                });
                            }
                            if (indexesDesc && indexesDesc.length) {
                                const indexes = {};
                                indexesDesc.map(i => {
                                    if (i.match(/\[language\]/i)) {
                                        languages.map(language => {
                                            const index = i.replace(/\[language\]/i, language);
                                            indexes[index] = -1;
                                        });
                                    } else {
                                        indexes[i] = -1;
                                    }
                                });
                                console.log(`* Creating indexes: "${m.id}_${c}_desc"`);
                                await db.collection(c).createIndex(indexes, {
                                    name: `${m.id}_${c}_desc`
                                });
                            }
                            if (expires) {
                                console.log(`* Creating indexes: "${m.id}_${c}_exp"`);
                                await db.collection(c).createIndex({
                                    createdAt: 1
                                }, {
                                    expireAfterSeconds: parseInt(expires, 10)
                                }, {
                                    name: `${m.id}_${c}_exp`
                                });
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
                if (options.defaults && moduleConfig.setup) {
                    console.log(`* Running setup script (../../build/scripts/${m.id}.js)`);
                    try {
                        const setupScript = require(path.resolve(`${__dirname}/../../build/scripts/${m.id}.js`));
                        await setupScript(config, moduleConfig, db);
                    } catch (e) {
                        console.error(e);
                    }
                    console.log(`* Script execution complete`);
                }
            } catch (e) {
                console.error(e);
            }
        }
        console.log("* Closing database connection");
        mongoClient.close();
        console.log(colors.green("\nDone."));
    } catch (e) {
        console.error(` Fatal: ${colors.brightRed(e.message)}`);
        process.exit(1);
    }
})();
