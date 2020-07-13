const fs = require('fs-extra');
const path = require('path');

module.exports = function(data) {
    return async() => {
        const db = data.db;
        console.log('  └── Creating collection: support...');
        try {
            await db.createCollection('support');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Creating collection: support_counters...');
        try {
            await db.createCollection('support_counters');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Dropping indexes...');
        try {
            await db.collection('support').dropIndexes();
        } catch (e) {
            console.log('      [ ] Indexes are not dropped');
        }
        console.log('      Creating indexes...');
        await db.collection('support').createIndex({ title: 1, status: 1, priority: 1, timestamp: 1, username: 1, specialist: 1 });
        await db.collection('support').createIndex({ title: -1, status: -1, priority: -1, unreadUser: -1, unreadSupport: -1, timestamp: -1, username: -1, specialist: -1 });
        console.log('      Creating storage directory...');
        try {
            await fs.mkdir(path.join(__dirname, 'storage'));
        } catch (e) {
            console.log('      [!] Not created. Already exists?');
        }
        console.log('      Module is installed!');
    };
};