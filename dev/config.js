/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const MarkoPlugin = require("@marko/webpack/plugin").default;
const utils = require("./utils");

const config = {
    ...require("../etc/system.json"),
    ...require("../etc/zoia.json")
};

const languages = Object.keys(config.languages);
const webpackConfig = [];
const markoPlugin = new MarkoPlugin();

module.exports = (env, argv) => {
    console.log(`Building ZOIA, mode: ${argv.mode}${argv.type === "update" ? " (update)" : ""}`);
    const moduleDirs = fs.readdirSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules`)).filter(d => !d.match(/^\./));
    const configWebClient = require("./client")(moduleDirs, markoPlugin, argv);
    const configWebServer = require("./server")(markoPlugin, argv);
    // const configTest = require("./test")(argv);
    // const configCli = require("./cli")(argv);
    utils.cleanUpWeb(argv);
    utils.ensureDirectories(config);
    utils.generateModulesConfig(moduleDirs, languages, argv);
    utils.installRequiredPackages(moduleDirs, argv);
    utils.generateTemplatesJSON(argv);
    utils.rebuildMarkoTemplates(argv);
    utils.copyPublic(argv);
    utils.copyMailTemplates(argv);
    utils.runBuildScripts(moduleDirs, argv);
    console.log("Starting Webpack...");
    // webpackConfig.push(configWebClient, configWebServer, configTest, configCli);
    webpackConfig.push(configWebClient, configWebServer);
    return webpackConfig;
};
