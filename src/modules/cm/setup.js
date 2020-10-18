/* eslint-disable no-console */
const path = require("path");
const fs = require("fs-extra");

module.exports = async (config, moduleConfig, db) => {
    try {
        await fs.ensureDir(path.resolve(`${__dirname}/../../${config.directories.files}/${moduleConfig.directory}`));
        await db.collection(config.collections.counters).updateOne({
            _id: "cmLegacy"
        }, {
            $set: {
                value: moduleConfig.initalLegacyValue
            }
        }, {
            upsert: true
        });
    } catch (e) {
        console.error(e);
    }
};
