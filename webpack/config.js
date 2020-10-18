/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const MarkoPlugin = require("@marko/webpack/plugin").default;
const config = require("../etc/zoia.json");
const utils = require("./utils");

const languages = Object.keys(config.languages);
const webpackConfig = [];
const markoPlugin = new MarkoPlugin();

module.exports = (env, argv) => {
    console.log(`Building Zoia, mode: ${argv.mode}${argv.type === "update" ? " (update)" : ""}`);
    const moduleDirs = fs.readdirSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules`)).filter(d => !d.match(/^\./));
    const configWebClient = require("./client")(moduleDirs, markoPlugin, argv);
    const configWebServer = require("./server")(markoPlugin, argv);
    utils.cleanUpWeb(argv);
    utils.ensureDirectories();
    utils.generateModulesConfig(moduleDirs, languages, argv);
    utils.generateTemplatesJSON(argv);
    utils.rebuildMarkoTemplates(argv);
    utils.copyPublic();
    console.log("Starting Webpack...");
    webpackConfig.push(configWebClient, configWebServer);
    return webpackConfig;
};
