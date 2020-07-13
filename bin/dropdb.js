const inquirer = require('inquirer');
const path = require('path');
const config = require(path.join(__dirname, '..', 'core', 'config.js'));
const commandLineArgs = require('command-line-args');
const optionDefinitions = [
    { name: 'force', alias: 'f', type: Boolean }
];
const options = commandLineArgs(optionDefinitions);
const install = async() => {
    try {
        console.log('\nThis script will drop all collections from Zoia database.\n');
        if (!options.force) {
            let res = await inquirer.prompt([{
                type: 'list',
                name: 'continue',
                message: 'Please make a choice:\n',
                choices: [
                    'Cancel',
                    'Continue'
                ]
            }]);
            if (res.continue == 'Cancel') {
                process.exit(0);
            }
        }
        console.log('\n- Connecting to the Mongo DB...');
        const database = new(require(path.join(__dirname, '..', 'core', 'database.js')))(false, config.mongo, false);
        await database.connect();
        const db = database.get();
        let collections = await db.listCollections().toArray();
        if (!collections || !collections.length) {
            console.log('\nNo collections found. Nothing to do.')
        }
        for (let c in collections) {
            let collection = collections[c];
            console.log('Dropping ' + collection.name + '...');
            await db.collection(collection.name).drop();
        }
        console.log('Script finished. Have a nice day!');
        process.exit(0);
    } catch (e) {
        console.log('\nScript failed: ' + e);
        process.exit(1);
    }
};
install();