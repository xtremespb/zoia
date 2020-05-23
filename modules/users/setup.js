/* eslint-disable no-console */
const crypto = require("crypto");

module.exports = async (config, moduleConfig, db) => {
    try {
        const password = crypto.createHmac("sha256", config.secret).update(moduleConfig.defaults.password).digest("hex");
        await db.collection(moduleConfig.collectionUsers).updateOne({
            username: moduleConfig.defaults.username
        }, {
            $set: {
                username: moduleConfig.defaults.username,
                password,
                email: "example@zoiajs.org",
                status: ["active", "admin"],
                createdAt: new Date()
            }
        }, {
            upsert: true
        });
    } catch (e) {
        console.error(e);
    }
};
