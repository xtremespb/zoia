/* eslint-disable no-console */

//
//
// Create/reset password for an user
//
//

import colors from "colors/safe";
import crypto from "crypto";

export default async (config, options, modulesConfig, db) => {
    console.log(`\n${colors.cyan(" Operation:")} create an user or reset password`);
    const password = crypto.createHmac("sha256", config.secret).update("password").digest("hex");
    await db.collection(modulesConfig["users"].collectionUsers).updateOne({
        username: options.user
    }, {
        $set: {
            username: options.user,
            password,
            email: options.email,
            status: ["active", "admin"],
            groups: ["admin"],
            createdAt: new Date()
        }
    }, {
        upsert: true
    });
    console.log(`${colors.green(" Success:")} ${colors.white(`User "${options.user}" with password "password" has been created/updated`)}\n`);
};
