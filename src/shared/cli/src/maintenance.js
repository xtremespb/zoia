/* eslint-disable no-console */

//
//
// Turn maintenance on or off
//
//

import colors from "colors/safe";

export default async (config, options, modulesConfig, db) => {
    console.log(`\n${colors.cyan(" Operation:")} turn maintenance mode on or off`);
    const resultSave = await db.collection(config.collections.registry).updateOne({
        _id: "core_maintenance"
    }, {
        $set: {
            status: options.maintenance === "on"
        }
    }, {
        upsert: true
    });
    if (!resultSave || !resultSave.acknowledged) {
        console.error(`${colors.red(" Error:")} ${colors.white("could not save maintenance status")}`);
        return;
    }
    console.log(`${colors.green(" Success:")} ${colors.white(`maintenance mode is now "${options.maintenance}"\n`)}`);
};
