const crypto = require('crypto');

module.exports = function(data) {
    return async() => {
        const db = data.db;
        const config = data.config;
        console.log('  └── Creating collection: users...');
        try {
            await db.createCollection('users');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Dropping indexes...');
        try {
            await db.collection('users').dropIndexes();
        } catch (e) {
            console.log('      [ ] Indexes are not dropped');
        }
        console.log('      Creating indexes...');
        await db.collection('users').createIndex({ username: 1, email: 1, status: 1 });
        await db.collection('users').createIndex({ username: -1, email: -1, status: -1 });
        console.log('      Creating/resetting admin user...');
        let upd = await db.collection('users').update({ username: 'admin' }, { $set: { password: crypto.createHash('md5').update(config.salt + 'admin').digest('hex'), email: config.website.email.feedback, status: 1, groups: 'admin', timestamp: parseInt(Date.now() / 1000, 10) } }, { upsert: true });
        if (!upd || !upd.result || !upd.result.ok) {
            throw new Error('Could not run db.collection(\'users\').update');
        }
        console.log('      Module is installed!');
    };
};