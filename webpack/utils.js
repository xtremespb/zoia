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
    [argv.type === "update" ? "build_/public/update" : "build_/public/zoia", "build_/scripts"].map(d => {
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

const copyMailTemplates = (argv) => {
    fs.copySync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/mail/templates`), path.resolve(`${__dirname}/../build_/mail/templates`));
    fs.copySync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/mail/components`), path.resolve(`${__dirname}/../build_/mail/components`));
    fs.copySync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/mail/images`), path.resolve(`${__dirname}/../build_/mail/images`));
};

const generateTemplatesJSON = (argv) => {
    const available = fs.readdirSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/marko/zoia/templates`));
    const templatesJSON = available.filter(i => !i.match(/^\./) && !i.match(/-shared$/));
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
    fs.writeJSONSync(path.resolve(`${__dirname}/../build_/etc/templates.json`), templatesJSON);
};

const rebuildMarkoTemplates = (argv) => {
    const templates = require(`${__dirname}/../build_/etc/templates.json`);
    console.log("Re-building Marko templates macro...");
    const root = `<!-- This file is auto-generated, do not modify -->\n${templates.map(t => `<if(out.global.template === "${t}")><${t}><i18n/><socketIO/><\${input.renderBody}/></${t}></if>\n`).join("")}\n`;
    fs.writeFileSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/marko/zoia/index.marko`), root);
};

const generateModulesConfig = (moduleDirs, languages, argv) => {
    const modules = [];
    const backup = {};
    fs.ensureDirSync(path.resolve(`${__dirname}/../logs`));
    fs.ensureDirSync(path.resolve(`${__dirname}/../etc/modules`));
    fs.ensureDirSync(path.resolve(`${__dirname}/../build_/scripts`));
    fs.ensureDirSync(path.resolve(`${__dirname}/../build_/mail/modules`));
    moduleDirs.map(dir => {
        // In production / non-update mode, copy the configs of each module to etc/modules
        if (argv.mode === "production" && argv.type !== "update" && !fs.existsSync(path.resolve(`${__dirname}/../etc/modules/${dir}.json`)) && fs.existsSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/config.dist.json`))) {
            fs.copyFileSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/config.dist.json`), path.resolve(`${__dirname}/../etc/modules/${dir}.json`));
        }
        if (fs.existsSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/mail`)) && !fs.existsSync(path.resolve(`${__dirname}/../build_/mail/modules/${dir}`))) {
            fs.copy(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/mail`), path.resolve(`${__dirname}/../build_/mail/modules/${dir}`));
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
            fs.copyFileSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/setup.js`), path.resolve(`${__dirname}/../build_/scripts/${dir}.js`));
        }
        try {
            const backupConfig = require(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/backup.json`));
            backup[dir] = backupConfig;
        } catch {
            // Ignore
        }
    });
    console.log("Writing modules.json...");
    fs.writeJSONSync(`${__dirname}/../build_/etc/modules.json`, modules);
    console.log("Writing backup.json...");
    fs.writeJSONSync(`${__dirname}/../build_/etc/backup.json`, backup);
    console.log("Writing build.json...");
    fs.writeJSONSync(`${__dirname}/../build_/etc/build.json`, {
        date: new Date(),
        mode: argv.mode,
        version: packageJson.version,
        id: uuidv4()
    });
};

const ensureDirectories = () => {
    const dirs = ["tmp", "logs", "build_/etc", "build_/bin", "build_/public", "build_/files", "build_/mail", "build_/public/files", "build_/public/images"];
    console.log(`Ensuring directories: ${dirs.join(", ")}`);
    dirs.map(d => fs.ensureDirSync(path.resolve(`${__dirname}/../${d}`)));
};

const copyPublic = () => {
    const publicFiles = [{
        src: "favicon.ico",
        dest: "zoia/favicon.ico"
    }];
    publicFiles.map(i => fs.copyFileSync(path.resolve(`${__dirname}/../src/public/${i.src}`), path.resolve(`${__dirname}/../build_/public/${i.dest}`)));
};

module.exports = {
    cleanUpWeb,
    generateTemplatesJSON,
    rebuildMarkoTemplates,
    generateModulesConfig,
    ensureDirectories,
    copyPublic,
    copyMailTemplates
};
