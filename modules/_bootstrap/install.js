/* eslint max-len: 0 */
const ObjectId = require('mongodb').ObjectID;
module.exports = function(data) {
    return async() => {
        const db = data.db;
        const config = data.config;
        console.log('  └── Creating collection: bruteforce_store...');
        try {
            await db.createCollection('bruteforce_store');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Dropping indexes...');
        try {
            await db.collection('bruteforce_store').dropIndexes();
        } catch (e) {
            console.log('      [ ] Indexes are not dropped');
        }
        console.log('      Creating indexes...');
        await db.collection('bruteforce_store').createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
        console.log('      Module is installed!');
    };
};