/* eslint-disable no-console */

//
//
// Create defaults in database
//
//

import colors from "colors/safe";
import {
    ObjectId
} from "mongodb";

export default async (config, options, modulesConfig, db, defaultsData) => {
    console.log(`\n${colors.cyan(" Operation:")} create database defaults\n`);
    if (!db) {
        console.error(`${colors.red(" Error:")} database is not connected`);
        return;
    }
    for (const m of Object.keys(defaultsData)) {
        console.log(`${colors.yellow(" Processing:")} ${m}`);
        for (const c of Object.keys(defaultsData[m])) {
            for (const item of defaultsData[m][c]) {
                Object.keys(item).map(i => {
                    if (String(item[i]).match(/ISODate\(now\)/)) {
                        item[i] = new Date();
                    }
                    if (String(item[i]).match(/^ObjectId:/)) {
                        const oid = item[i].replace(/^ObjectId:/, "");
                        item[i] = new ObjectId(oid);
                    }
                });
                try {
                    await db.collection(c).insertOne(item);
                } catch (e) {
                    console.log(`${colors.red(" Error:")} ${e.message}`);
                }
            }
        }
    }
    console.log(`${colors.green("\n Success:")} ${colors.white(`defaults are created\n`)}`);
};
