const config = require('../../core/config.js');

module.exports = function(data) {
    return async() => {
        const db = data.db;
        console.log('  └── Creating collection: blog...');
        try {
            await db.createCollection('blog');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Creating collection: blog_counters...');
        try {
            await db.createCollection('blog_counters');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Creating collection: blog_comments...');
        try {
            await db.createCollection('blog_comments');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Dropping indexes...');
        try {
            await db.collection('blog').dropIndexes();
            await db.collection('blog_comments').dropIndexes();
        } catch (e) {
            console.log('      [ ] Indexes are not dropped');
        }
        console.log('      Creating indexes...');
        await db.collection('blog').createIndex({ status: 1, timestamp: 1 });
        await db.collection('blog').createIndex({ status: -1, timestamp: -1 });
        for (let lng in config.i18n.localeNames) {
            let idx = {};
            idx[lng + '.title'] = 1;
            idx[lng + '.keywords'] = 1;
            await db.collection('blog').createIndex(idx);
            idx[lng + '.title'] = -1;
            idx[lng + '.keywords'] = -1;
            await db.collection('blog').createIndex(idx);
        }
        await db.collection('blog_comments').createIndex({ postId: 1, timestamp: 1 });
        await db.collection('blog_comments').createIndex({ postId: -1, timestamp: -1 });
        console.log('      Module is installed!');
    };
};