module.exports = function(data) {
    return async() => {
        const db = data.db;
        const config = data.config;
        console.log('  └── Creating collection: brb_cache...');
        try {
            await db.createCollection('brb_cache');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Dropping indexes...');
        try {
            await db.collection('brb_cache').dropIndexes();
        } catch (e) {
            console.log('      [ ] Indexes are not dropped');
        }
        console.log('      Creating indexes...');
        await db.collection('brb_cache').createIndex({ "pid": 1, "request": 1 });
        await db.collection('brb_cache').createIndex({ "timestamp": 1 }, { expireAfterSeconds: 60 });
        console.log('      Module is installed!');
    };
};