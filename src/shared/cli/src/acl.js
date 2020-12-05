/* eslint-disable no-console */

//
//
// Create/reset ACL group
//
//

import colors from "colors/safe";

export default async (config, options, modulesConfig, db) => {
    console.log(`\n${colors.cyan(" Operation:")} create or update an ACL group`);
    if (!options.permissions || !options.permissions.match(/[crud]+/gi)) {
        console.error(`${colors.red(" Error:")} missing or invalid permissions`);
        return;
    }
    const update = {
        group: options.acl,
    };
    Object.keys(modulesConfig).map(m => {
        update[`${m}_access`] = [options.permissions.match(/c/gi) ? "create" : null, options.permissions.match(/r/gi) ? "read" : null, options.permissions.match(/u/gi) ? "update" : null, options.permissions.match(/d/gi) ? "delete" : null].filter(i => i);
        update[`${m}_blacklist`] = [];
        update[`${m}_whitelist`] = [];
    });
    await db.collection(modulesConfig["users"].collectionAcl).updateOne({
        group: options.acl
    }, {
        $set: update
    }, {
        upsert: true
    });
    console.log(`${colors.green(" Success:")} ${colors.white(`group "${options.acl}" has been created/updated`)}\n`);
};
