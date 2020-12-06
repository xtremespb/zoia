/* eslint-disable no-console */
const path = require("path");
const fs = require("fs-extra");

module.exports = async (config, moduleConfig) => {
    try {
        await fs.ensureDir(path.resolve(`${__dirname}/../../${config.directories.files}/${moduleConfig.directory}`));
    } catch (e) {
        console.error(e);
    }
};
