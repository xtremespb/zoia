const path = require('path');
const config = require(path.join(__dirname, '..', '..', '..', 'core', 'config.js'));

let configModule;
try {
    configModule = require(path.join(__dirname, '..', 'config', 'hosting.json'));
} catch (e) {
    configModule = require(path.join(__dirname, '..', 'config', 'hosting.dist.json'));
}

const script = async() => {
    try {
        const database = new(require(path.join(__dirname, '..', '..', '..', 'core', 'database.js')))(false, config.mongo, false);
        await database.connect();
        const db = database.get();
        const timestamp = parseInt(Date.now() / 1000, 10);
        const cleanstamp = 86400 * configModule.cleanupDays;
        // Decrease days by 1
        let updResult = await db.collection('hosting_payments').deleteMany({
            timestamp: { $lt: (timestamp - cleanstamp) }
        });
        if (!updResult || !updResult.result || !updResult.result.ok) {
            throw new Error('Could not delete outdated payment records');
        }
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};
script();