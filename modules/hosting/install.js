module.exports = function(data) {
    return async() => {
        const db = data.db;
        console.log('  └── Creating collection: hosting_accounts...');
        try {
            await db.createCollection('hosting_accounts');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Creating collection: hosting_counters...');
        try {
            await db.createCollection('hosting_counters');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Creating collection: hosting_payments...');
        try {
            await db.createCollection('hosting_payments');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Creating collection: hosting_transactions...');
        try {
            await db.createCollection('hosting_transactions');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Creating collection: hosting_tasks...');
        try {
            await db.createCollection('hosting_tasks');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Dropping indexes...');
        try {
            await db.collection('hosting_accounts').dropIndexes();
            await db.collection('hosting_counters').dropIndexes();
            await db.collection('hosting_payments').dropIndexes();
            await db.collection('hosting_transactions').dropIndexes();
            await db.collection('hosting_tasks').dropIndexes();
        } catch (e) {
            console.log('      [ ] Indexes are not dropped');
        }
        console.log('      Creating indexes...');
        await db.collection('hosting_accounts').createIndex({ username: 1, email: 1, ref_id: 1, id: 1 });
        await db.collection('hosting_accounts').createIndex({ username: -1, email: -1, ref_id: -1, id: -1 });
        await db.collection('hosting_transactions').createIndex({ id: 1, ref_id: 1 });
        await db.collection('hosting_transactions').createIndex({ id: -1, ref_id: -1 });
        console.log('      Module is installed!');
    };
};