/* eslint-disable no-console */
const inquirer = require('inquirer');
const {
    MongoClient
} = require('mongodb');
const commandLineArgs = require('command-line-args');
const fs = require('fs-extra');
const path = require('path');

const optionDefinitions = [{
    name: 'force',
    alias: 'f',
    type: Boolean
}];
const options = commandLineArgs(optionDefinitions);

const dropDb = async () => {
    try {
        const secure = await fs.readJSON(path.resolve(`${__dirname}/../dist/etc/secure.json`));
        console.log('\nThis script will drop all collections from Zoia database.\n');
        if (!options.force) {
            const res = await inquirer.prompt([{
                type: 'list',
                name: 'continue',
                message: 'Please make a choice:\n',
                choices: [
                    'Cancel',
                    'Continue'
                ]
            }]);
            if (res.continue === 'Cancel') {
                process.exit(0);
            }
        }
        const mongoClient = new MongoClient(secure.mongo.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await mongoClient.connect();
        const db = mongoClient.db(secure.mongo.dbName);
        const collections = await db.listCollections().toArray();
        if (!collections || !collections.length) {
            console.log('\nNo collections found.');
        }
        await Promise.all(collections.map(async c => {
            console.log(`Dropping collection ${c.name}...`);
            await db.collection(c.name).drop();
            console.log(`Collection ${c.name} is dropped.`);
        }));
        console.log('All done.');
        mongoClient.close();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
dropDb();
