/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");

(async () => {
    await fs.remove(path.resolve(`${__dirname}/../../build`));
    await fs.remove(path.resolve(`${__dirname}/../../data`));
    await fs.remove(path.resolve(`${__dirname}/../../etc`));
    await fs.remove(path.resolve(`${__dirname}/../../logs`));
    await fs.remove(path.resolve(`${__dirname}/../../node_modules`));
})();
