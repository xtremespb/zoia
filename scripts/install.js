/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const {
    MongoClient
} = require("mongodb");

const config = fs.readJSONSync(path.resolve(`${__dirname}/../etc/zoia.json`));
const modules = fs.readJSONSync(path.resolve(`${__dirname}/../etc/auto/modules.json`));
const languages = Object.keys(config.languages);

const main = async () => {
    try {
        const mongoClient = new MongoClient(config.mongo.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await mongoClient.connect();
        const db = mongoClient.db(config.mongo.dbName);
        await Promise.all(modules.map(async m => {
            try {
                const moduleConfig = fs.existsSync(path.resolve(`${__dirname}/../etc/modules/${m.id}.json`)) ? require(path.resolve(`${__dirname}/../etc/modules/${m.id}.json`)) : require(path.resolve(`${__dirname}/../modules/${m.id}/config.dist.json`));
                // Process database routines
                if (moduleConfig.database) {
                    const collections = Object.keys(moduleConfig.database.collections);
                    await Promise.all(collections.map(async c => {
                        try {
                            await db.createCollection(c);
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
                                await db.collection(c).createIndex(indexes, {
                                    name: `${m.id}_${c}_desc`
                                });
                            }
                            if (expires) {
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
                    }));
                }
                if (moduleConfig.setup) {
                    try {
                        const setupScript = require(path.resolve(`${__dirname}/../etc/scripts/${m.id}.js`));
                        await setupScript(config, moduleConfig, db);
                    } catch (e) {
                        console.error(e);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }));
        mongoClient.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

main();
