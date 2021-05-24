/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const commandLineArgs = require("command-line-args");

const options = commandLineArgs([{
    name: "name",
    alias: "n",
    type: String
}]);

if (!options.name) {
    console.log("Usage: npm run boilerplate -- --name=modulename");
    process.exit();
}

fs.copySync(path.resolve(`${__dirname}/../../src/modules/boilerplate`), path.resolve(`${__dirname}/../../src/modules/${options.name}`));
const jsonAdmin = fs.readJSONSync(path.resolve(`${__dirname}/../../src/modules/boilerplate/admin.json`));
const jsonBackup = fs.readJSONSync(path.resolve(`${__dirname}/../../src/modules/boilerplate/backup.json`));
const jsonConfig = fs.readJSONSync(path.resolve(`${__dirname}/../../src/modules/boilerplate/config.dist.json`));
const moduleConfig = fs.readJSONSync(path.resolve(`${__dirname}/../../src/modules/boilerplate/module.json`));
jsonAdmin[0].id = options.name;
jsonBackup.collections[0] = options.name;
jsonConfig.collectionName = options.name;
jsonConfig.database.collections[options.name] = jsonConfig.database.collections.boilerplate;
delete jsonConfig.database.collections.boilerplate;
jsonConfig.routes[options.name] = `/admin/${options.name}`;
delete jsonConfig.routes.boilerplate;
moduleConfig.id = options.name;
fs.writeJSONSync(path.resolve(`${__dirname}/../../src/modules/${options.name}/admin.json`), jsonAdmin, {
    spaces: "\t"
});
fs.writeJSONSync(path.resolve(`${__dirname}/../../src/modules/${options.name}/backup.json`), jsonBackup, {
    spaces: "\t"
});
fs.writeJSONSync(path.resolve(`${__dirname}/../../src/modules/${options.name}/config.dist.json`), jsonConfig, {
    spaces: "\t"
});
fs.writeJSONSync(path.resolve(`${__dirname}/../../src/modules/${options.name}/module.json`), moduleConfig, {
    spaces: "\t"
});
console.log(`All done. Don't forget to add "${options.name}" module to etc/system.json.`);
