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
    argv.maps = env.maps || null;
    argv.update = env.update || null;
    console.log(`Building ZOIA, mode: ${argv.mode}${argv.update ? " (update)" : ""}`);
    const moduleDirs = fs.readdirSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules`)).filter(d => !d.match(/^\./));
    const configWebClient = require("./client")(moduleDirs, markoPlugin, argv);
    const configWebServer = require("./server")(markoPlugin, argv);
    const configTest = require("./test")(argv);
    const configCli = require("./cli")(argv);
    utils.cleanUpWeb(argv);
    utils.ensureDirectories(config);
    utils.generateModulesConfig(moduleDirs, languages, argv);
    utils.generateTemplatesJSON(argv);
    utils.generateVariablesSCSS(argv);
    utils.rebuildMarkoTemplates(argv);
    utils.copyPublic(argv);
    utils.copyMailTemplates(argv);
    utils.runBuildScripts(moduleDirs, argv);
    console.log("Starting Webpack...");
    webpackConfig.push(configWebClient, configWebServer, configTest, configCli);
    return webpackConfig;
};
