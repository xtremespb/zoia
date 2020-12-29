/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const {
    v4: uuidv4
} = require("uuid");
const {
    execSync
} = require("child_process");
const minify = require("@node-minify/core");
const htmlMinifier = require("@node-minify/html-minifier");
const packageJson = require("../package.json");
const packageLock = require("../package-lock.json");

const cleanUpWeb = argv => {
    [argv.type === "update" ? "build/public/update_" : "build/public/zoia_", "build/scripts"].map(d => {
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

const copyMailTemplates = argv => {
    fs.copySync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/mail/templates`), path.resolve(`${__dirname}/../build/mail/templates`));
    fs.copySync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/mail/components`), path.resolve(`${__dirname}/../build/mail/components`));
    fs.copySync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/mail/images`), path.resolve(`${__dirname}/../build/mail/images`));
};

const generateTemplatesJSON = argv => {
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
    fs.writeJSONSync(path.resolve(`${__dirname}/../build/etc/templates.json`), templatesJSON);
};

const rebuildMarkoTemplates = argv => {
    const templates = require(`${__dirname}/../build/etc/templates.json`);
    console.log("Re-building Marko templates macro...");
    const root = `<!-- This file is auto-generated, do not modify -->\n${templates.map(t => `<if(out.global.template === "${t}")><${t}><i18n/><socketIO/><\${input.renderBody}/></${t}></if>\n`).join("")}\n`;
    fs.writeFileSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/marko/zoia/index.marko`), root);
};

const generateModulesConfig = (moduleDirs, languages, argv) => {
    const modules = [];
    const admin = [];
    const backup = {};
    fs.ensureDirSync(path.resolve(`${__dirname}/../logs`));
    fs.ensureDirSync(path.resolve(`${__dirname}/../etc/modules`));
    fs.ensureDirSync(path.resolve(`${__dirname}/../build/scripts`));
    fs.ensureDirSync(path.resolve(`${__dirname}/../build/mail/modules`));
    moduleDirs.map(dir => {
        // In production / non-update mode, copy the configs of each module to etc/modules
        if (argv.mode === "production" && argv.type !== "update" && !fs.existsSync(path.resolve(`${__dirname}/../etc/modules/${dir}.json`)) && fs.existsSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/config.dist.json`))) {
            fs.copyFileSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/config.dist.json`), path.resolve(`${__dirname}/../etc/modules/${dir}.json`));
        }
        if (fs.existsSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/mail`)) && !fs.existsSync(path.resolve(`${__dirname}/../build/mail/modules/${dir}`))) {
            fs.copy(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/mail`), path.resolve(`${__dirname}/../build/mail/modules/${dir}`));
        }
        let moduleData;
        try {
            moduleData = require(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/module.json`));
        } catch {
            // Ignore
        }
        if (!moduleData) {
            return;
        }
        const moduleConfig = fs.existsSync(path.resolve(`${__dirname}/../etc/modules/${dir}.json`)) ? require(path.resolve(`${__dirname}/../etc/modules/${dir}.json`)) : require(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/config.dist.json`));
        modules.push(moduleData);
        if (moduleData.admin) {
            try {
                const adminConfig = require(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/admin.json`));
                const trans = {};
                languages.map(language => {
                    const catalog = require(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/locales/${language}.json`));
                    trans[language] = catalog;
                });
                adminConfig.map(ac => {
                    const data = {
                        priority: ac.priority || 10000,
                        id: ac.id,
                        icon: ac.icon,
                        link: moduleConfig.routes[ac.id],
                        title: {}
                    };
                    languages.map(language => data.title[language] = trans[language].moduleTitle || trans[language][`moduleTitle.${ac.id}`] || ac.id);
                    admin.push(data);
                });
            } catch {
                // Ignore
            }
        }
        if (moduleConfig.setup && fs.existsSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/setup.js`))) {
            fs.copyFileSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/setup.js`), path.resolve(`${__dirname}/../build/scripts/${dir}.js`));
        }
        try {
            const backupConfig = require(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/backup.json`));
            backup[dir] = backupConfig;
        } catch {
            // Ignore
        }
    });
    console.log("Writing modules.json...");
    fs.writeJSONSync(`${__dirname}/../build/etc/modules.json`, modules);
    console.log("Writing admin.json...");
    fs.writeJSONSync(`${__dirname}/../build/etc/admin.json`, admin.sort((a, b) => (a.priority > b.priority) ? 1 : (b.priority > a.priority) ? -1 : 0));
    console.log("Writing backup.json...");
    fs.writeJSONSync(`${__dirname}/../build/etc/backup.json`, backup);
    console.log("Writing build.json...");
    fs.writeJSONSync(`${__dirname}/../build/etc/build.json`, {
        date: new Date(),
        mode: argv.mode,
        version: packageJson.version,
        id: uuidv4()
    });
};

const installRequiredPackages = async (moduleDirs, argv) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const dir of moduleDirs) {
        let npmData;
        try {
            npmData = require(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/npm.json`));
        } catch {
            // Ignore
        }
        if (!npmData) {
            // eslint-disable-next-line no-continue
            continue;
        }
        const cmd = Object.keys(npmData).map(m => {
            if (!packageLock.dependencies[m] || packageLock.dependencies[m].version !== npmData[m].replace(/\^/gm, "")) {
                return `${m}@${npmData[m]}`;
            }
        }).filter(i => i).join(" ");
        if (cmd && cmd.length) {
            try {
                console.log(`Installing NPM packages for module "${dir}"...`);
                // eslint-disable-next-line no-await-in-loop
                execSync(`npm i ${cmd} --loglevel=error --save`);
            } catch (e) {
                console.error(e);
                process.exit(1);
            }
        }
    }
};

const ensureDirectories = (config) => {
    const dirs = ["etc", config.directories.tmp, "logs", "build/etc", "build/bin", "build/public", config.directories.files, "build/mail", config.directories.publicFiles, config.directories.images];
    console.log(`Ensuring directories: ${dirs.join(", ")}`);
    dirs.map(d => fs.ensureDirSync(path.resolve(`${__dirname}/../${d}`)));
};

const copyPublic = argv => {
    const publicFiles = [{
        src: "favicon.ico",
        dest: `${argv.type === "update" ? "update_" : "zoia_"}/favicon.ico`
    }];
    publicFiles.map(i => fs.copyFileSync(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/public/${i.src}`), path.resolve(`${__dirname}/../build/public/${i.dest}`)));
};

const runBuildScripts = (moduleDirs, argv) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const dir of moduleDirs) {
        let script;
        try {
            script = require(path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/modules/${dir}/build.js`));
            script();
        } catch {
            // Ignore
        }
    }
};

module.exports = {
    cleanUpWeb,
    generateTemplatesJSON,
    rebuildMarkoTemplates,
    generateModulesConfig,
    ensureDirectories,
    copyPublic,
    copyMailTemplates,
    installRequiredPackages,
    runBuildScripts
};
