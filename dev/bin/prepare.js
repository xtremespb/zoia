/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");

const packageJsonMain = require(path.resolve(`${__dirname}/../../package.json`));
const packageJsonCore = require(path.resolve(`${__dirname}/../../package-core.json`));
packageJsonMain.dependencies = packageJsonCore.dependencies;
packageJsonMain.devDependencies = packageJsonCore.devDependencies;
fs.writeJSONSync(path.resolve(`${__dirname}/../package.json`), packageJsonMain, {
    spaces: "\t"
});
fs.removeSync(path.resolve(`${__dirname}/../../update`));
fs.removeSync(path.resolve(`${__dirname}/../../build/public/zoia_`));
