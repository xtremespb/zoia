/* eslint-disable no-console */

//
//
// Turn demo on or off
//
//

import colors from "colors/safe";

export default async (config, options, modulesConfig, db) => {
    console.log(`\n${colors.cyan(" Operation:")} turn demo mode on or off`);
    if (!db) {
        console.error(`${colors.red(" Error:")} database is not connected`);
        return;
    }
    const resultSave = await db.collection(config.collections.registry).updateOne({
        _id: "core_demo"
    }, {
        $set: {
            status: options.demo === "on"
        }
    }, {
        upsert: true
    });
    if (!resultSave || !resultSave.acknowledged) {
        console.error(`${colors.red(" Error:")} ${colors.white("could not set demo mode status")}`);
        return;
    }
    console.log(`${colors.green(" Success:")} ${colors.white(`demo mode is now "${options.demo}"`)}\n`);
};
