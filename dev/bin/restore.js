/* eslint-disable no-loop-func */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const inquirer = require("inquirer");
const commandLineArgs = require("command-line-args");
const extract = require("extract-zip");
const {
    MongoClient,
    ObjectID
} = require("mongodb");
const {
    exec
} = require("child_process");
const {
    v4: uuid
} = require("uuid");
const colors = require("colors/safe");

const DATA_CORE = "restore core files and directories";
const DATA_DB = "restore database collections";
const DATA_FILES = "restore module files and data";
const DATA_SRC = "restore sources";
const DATA_PACKAGE_JSON = "restore package.json";
const DATA_NPM = "install NPM modules";

const execCommand = cmd => new Promise((resolve, reject) => {
    let exitCode;
    const workerProcess = exec(cmd, (error, stdout, stderr) => {
        if (exitCode === 0) {
            resolve(stdout);
        } else {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject(new Error(`${stdout || ""}${stderr || ""}`));
        }
    });
    workerProcess.on("exit", code => exitCode = code);
});

const rootPath = path.resolve(`${__dirname}/../..`);
let packageJson;
try {
    packageJson = require(path.resolve(`${rootPath}/package.json`));
} catch {
    console.log(colors.brightRed("Fatal: could not load package.json"));
    console.log(colors.grey(`Please get this file from Github, you won't be able to run ZOIA otherwise.\n`));
    process.exit(1);
}
const options = commandLineArgs([{
    name: "file",
    alias: "f",
    type: String
}]);
console.log(colors.bgGrey(colors.black(`\n                              \n  ZOIA Backup Restore Script  \n                              \n`)));
console.log(`${colors.cyan("Version")}: ${colors.brightWhite(packageJson.version)}\n`);
if (!Object.keys(options).length) {
    console.log(`   Usage: ${colors.brightWhite("npm run restore -- --file backup.zip")}\n\n          --file (-f): restore backup archive\n`);
    process.exit(0);
}
const backupFile = path.resolve(`${rootPath}/${options.file}`);
const tempDir = path.resolve(`${os.tmpdir()}/${uuid()}`);
try {
    fs.accessSync(backupFile);
} catch {
    console.error(`Could not access requested file: ${options.file}\n`);
    process.exit(1);
}

(async () => {
    console.log(colors.yellow(`Backup file: ${backupFile}\n`));
    console.log(colors.brightRed(`Warning: this script will perform a full backup restore!\n\n1. Your current ZOIA directories and files will be DELETED and replaced by the backup contents.\n2. Your current database collections will be dropped and replaced by the backup contents.\n3. This operation cannot be undone.`));
    try {
        console.log("");
        process.stdout.write(`\rExtracting backup archive to a temporary directory...`);
        await fs.ensureDir(tempDir);
        await extract(backupFile, {
            dir: tempDir
        });
        let config;
        let meta;
        try {
            config = {
                ...fs.readJSONSync(path.resolve(`${tempDir}/core/etc/system.json`)),
                ...fs.readJSONSync(path.resolve(`${tempDir}/core/etc/zoia.json`))
            };
            meta = fs.readJSONSync(path.resolve(`${tempDir}/meta.json`));
        } catch {
            console.log(colors.brightRed(`Fatal: could not load "system.json", "meta.json" or "zoia.json"`));
            process.exit(1);
        }
        console.log("\n");
        const selectedModules = await inquirer.prompt([{
            type: "checkbox",
            pageSize: 10,
            loop: false,
            message: "Modules to restore",
            name: "items",
            choices: [
                ...meta.modules.map(m => ({
                    name: m,
                    checked: true
                }))
            ]
        }]);
        const selectedActions = await inquirer.prompt([{
            type: "checkbox",
            pageSize: 10,
            loop: false,
            message: "Actions",
            name: "items",
            choices: [{
                    name: DATA_CORE,
                    checked: true
                },
                {
                    name: DATA_DB,
                    checked: true
                },
                {
                    name: DATA_FILES,
                    checked: true
                },
                {
                    name: DATA_SRC,
                    checked: true
                },
                {
                    name: DATA_PACKAGE_JSON,
                    checked: true
                },
                {
                    name: DATA_NPM,
                    checked: true
                }
            ],
            validate(a) {
                return a.length < 1 ? "You must choose at least one item" : true;
            },
        }]);
        const answer = await inquirer.prompt([{
            type: "list",
            name: "continue",
            message: "Are you sure you wish to proceed?",
            choices: ["No", "Yes"],
            filter(val) {
                return val.toLowerCase();
            },
        }]);
        if (answer.continue !== "yes") {
            console.log("\nCancelled.\n");
            process.exit(0);
        }
        const languages = Object.keys(config.languages);
        const backupConfig = await fs.readJSON(path.resolve(`${tempDir}/backup.json`));
        process.stdout.write(`\r                                                     `);
        process.stdout.write(`\r\nConnecting to the database...`);
        const mongoClient = new MongoClient(config.mongo.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await mongoClient.connect();
        const db = mongoClient.db(config.mongo.dbName);
        // Core modules and files
        if (selectedActions.items.indexOf(DATA_CORE) > -1) {
            process.stdout.write(`\r                                                     `);
            process.stdout.write(`\rRestoring core files...`);
            const core = {
                src: "src",
                etc: "etc",
                logs: "logs",
                "package.json": `root/package.json`,
                "package-lock.json": `root/package-lock.json`,
                "build/bin": `build/bin`,
                "build/etc": `build/etc`,
                "build/mail": `build/mail`,
                "build/public": `build/public`,
                "build/scripts": `build/scripts`,
            };
            if (selectedActions.items.indexOf(DATA_SRC) === -1) {
                delete core.src;
            }
            if (selectedActions.items.indexOf(DATA_PACKAGE_JSON) === -1) {
                delete core["package.json"];
                delete core["package-lock.json"];
            }
            for (const d of Object.keys(core)) {
                try {
                    await fs.remove(path.resolve(`${rootPath}/${d}`));
                } catch {
                    // Ignore
                }
                try {
                    await fs.copy(path.resolve(`${tempDir}/core/${core[d]}`), path.resolve(`${rootPath}/${d}`));
                } catch {
                    // Ignore
                }
            }
        }
        // Modules
        for (const m of Object.keys(backupConfig)) {
            if (selectedModules.items.indexOf(m) === -1) {
                // eslint-disable-next-line no-continue
                continue;
            }
            const moduleData = backupConfig[m];
            if (selectedActions.items.indexOf(DATA_FILES) > -1) {
                process.stdout.write(`\r                                                     `);
                process.stdout.write(`\rRestoring module files: ${m}...`);
                if (moduleData.dirs && Object.keys(moduleData.dirs).length) {
                    for (const d of Object.keys(moduleData.dirs)) {
                        const dir = moduleData.dirs[d];
                        try {
                            await fs.remove(path.resolve(`${rootPath}/${dir}`));
                        } catch {
                            // Ignore
                        }
                        await fs.copy(path.resolve(`${tempDir}/dirs/${d}`), path.resolve(`${rootPath}/${moduleData.dirs[d]}`));
                    }
                }
            }
            if (selectedActions.items.indexOf(DATA_DB) > -1) {
                process.stdout.write(`\r                                                     `);
                process.stdout.write(`\rRestoring module databases: ${m}...`);
                if (moduleData.db && moduleData.db.length) {
                    for (const c of moduleData.db) {
                        try {
                            await db.collection(c).drop();
                        } catch {
                            // Ignore
                        }
                    }
                    const moduleConfig = fs.existsSync(path.resolve(`${rootPath}/etc/modules/${m}.json`)) ? require(path.resolve(`${rootPath}/etc/modules/${m}.json`)) : require(path.resolve(`${rootPath}/src/modules/${m}/config.dist.json`));
                    if (moduleConfig.database) {
                        const collections = Object.keys(moduleConfig.database.collections);
                        for (const c of collections) {
                            try {
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
                                    await db.collection(c).createIndex(indexes, {
                                        name: `${m}_${c}_asc`
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
                                    await db.collection(c).createIndex(indexes, {
                                        name: `${m}_${c}_desc`
                                    });
                                }
                                if (expires) {
                                    await db.collection(c).createIndex({
                                        createdAt: 1
                                    }, {
                                        expireAfterSeconds: parseInt(expires, 10)
                                    }, {
                                        name: `${m}_${c}_exp`
                                    });
                                }
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }
                    for (const c of moduleData.db) {
                        const dbBackup = await fs.readJSON(path.resolve(`${tempDir}/db/${m}/${c}.json`));
                        const {
                            types,
                            data
                        } = dbBackup;
                        for (const rec of data) {
                            const item = rec;
                            Object.keys(item).map(i => {
                                if (types[i] === "objectid") {
                                    item[i] = new ObjectID(item[i]);
                                } else if (types[i] === "date") {
                                    item[i] = new Date(item[i]);
                                }
                            });
                            await db.collection(c).insertOne(item);
                        }
                    }
                }
            }
        }
        if (selectedActions.items.indexOf(DATA_NPM) > -1) {
            process.stdout.write(`\r                                                     `);
            process.stdout.write(`\rInstalling NPM modules...`);
            await execCommand(`npm install`);
        }
        process.stdout.write(`\r                                                     `);
        process.stdout.write(`\rCleaning up...`);
        await fs.remove(tempDir);
        process.stdout.write(`\r                                                     `);
        console.log(colors.green(`\rAll done, backup has been restored.\n`));
        mongoClient.close();
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
})();
