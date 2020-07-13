/* eslint max-len: 0 */
const fs = require('fs-extra');
const path = require('path');
module.exports = function(data) {
    return async() => {
    	const db = data.db;
    	console.log('  └── Creating collection: backup_tasks...');
        try {
            await db.createCollection('backup_tasks');
        } catch (e) {
            console.log('      [ ] Collection is not created');
        }
        console.log('      Creating storage directory...');
        try {
            await fs.mkdir(path.join(__dirname, 'static', 'storage'));
        } catch (e) {
            console.log('      [!] Not created. Already exists?');
        }
        console.log('      Module is installed!');
    };
};