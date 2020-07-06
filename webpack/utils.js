/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const {
    v4: uuidv4
} = require("uuid");
const minify = require("@node-minify/core");
const htmlMinifier = require("@node-minify/html-minifier");
const packageJson = require("../package.json");

const cleanUpWeb = (argv) => {
    [argv.type === "update" ? "build/public/update" : "build/public/zoia", "build/scripts"].map(d => {
        console.log(`Cleaning up directory: "${d}"`);
        const pathWeb = path.resolve(`${__dirname}/../${d}`);
        try {
            fs.removeSync(pathWeb);
            fs.ensureDirSync(pathWeb);
        } catch (e) {
            console.log(`Info: unable to clean "${d}": ${e.message} (is the Web Server running?)`);
        }
    });
};

const generateTemplatesJSON = (argv) => {
    const available = fs.readdirSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/marko/zoia/templates`));
    const templatesJSON = {
        available: available.filter(i => !i.match(/^\./) && !i.match(/-shared$/))
    };
    available.map(t => {
        if (fs.existsSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/marko/zoia/templates/${t}/minify.json`))) {
            const files = fs.readJSONSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/marko/zoia/templates/${t}/minify.json`));
            files.map(f => {
                const htmlRaw = fs.readFileSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/marko/zoia/templates/${t}/${f.src}`), "utf8");
                minify({
                    compressor: htmlMinifier,
                    options: {
                        removeAttributeQuotes: true,
                        collapseWhitespace: true,
                        html5: true
                    },
                    content: htmlRaw
                }).then(htmlMin => fs.writeFileSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/marko/zoia/templates/${t}/${f.dest}`), htmlMin));
            });
        }
    });
    fs.writeJSONSync(path.resolve(`${__dirname}/../build/etc/templates.json`), templatesJSON);
};

const rebuildMarkoTemplates = (argv) => {
    const templates = require(`${__dirname}/../build/etc/templates.json`);
    console.log("Re-building Marko templates macro...");
    const root = `<!-- This file is auto-generated, do not modify -->\n${templates.available.map(t => `<if(out.global.template === "${t}")><${t}><i18n/><\${input.renderBody}/></${t}></if>\n`).join("")}\n`;
    fs.writeFileSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/marko/zoia/index.marko`), root);
};

const generateModulesConfig = (moduleDirs, languages, argv) => {
    const modules = [];
    fs.ensureDirSync(path.resolve(`${__dirname}/../logs`));
    fs.ensureDirSync(path.resolve(`${__dirname}/../etc/modules`));
    fs.ensureDirSync(path.resolve(`${__dirname}/../build/scripts`));
    moduleDirs.map(dir => {
        // In production / non-update mode, copy the configs of each module to etc/modules
        if (argv.mode === "production" && argv.type !== "update" && !fs.existsSync(path.resolve(`${__dirname}/../etc/modules/${dir}.json`)) && fs.existsSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/config.dist.json`))) {
            fs.copyFileSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/config.dist.json`), path.resolve(`${__dirname}/../etc/modules/${dir}.json`));
        }
        const moduleData = require(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/module.json`));
        const moduleConfig = fs.existsSync(path.resolve(`${__dirname}/../etc/modules/${dir}.json`)) ? require(path.resolve(`${__dirname}/../etc/modules/${dir}.json`)) : require(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/config.dist.json`));
        moduleData.title = {};
        languages.map(language => {
            try {
                const catalog = require(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/locales/${language}.json`));
                moduleData.title[language] = catalog.moduleTitle;
            } catch (e) {
                // Ignore
            }
        });
        modules.push(moduleData);
        if (moduleConfig.setup && fs.existsSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/setup.js`))) {
            fs.copyFileSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/setup.js`), path.resolve(`${__dirname}/../build/scripts/${dir}.js`));
        }
    });
    console.log("Writing modules.json...");
    fs.writeJSONSync(`${__dirname}/../build/etc/modules.json`, modules);
    console.log("Writing build.json...");
    fs.writeJSONSync(`${__dirname}/../build/etc/build.json`, {
        date: new Date(),
        mode: argv.mode,
        version: packageJson.version,
        id: uuidv4()
    });
};

const ensureDirectories = () => {
    const dirs = ["logs", "build/etc", "build/bin", "build/public"];
    console.log(`Ensuring directories: ${dirs.join(", ")}`);
    dirs.map(d => fs.ensureDirSync(path.resolve(`${__dirname}/../${d}`)));
};

module.exports = {
    cleanUpWeb,
    generateTemplatesJSON,
    rebuildMarkoTemplates,
    generateModulesConfig,
    ensureDirectories
};
