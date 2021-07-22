/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const {
    v4: uuidv4
} = require("uuid");
const {
    format,
} = require("date-fns");
const {
    exec
} = require("child_process");
const minify = require("@node-minify/core");
const htmlMinifier = require("@node-minify/html-minifier");
const packageJson = require("../package.json");

const execCommand = cmd => new Promise((resolve, reject) => {
    let exitCode;
    const workerProcess = exec(cmd, (error, stdout, stderr) => {
        if (exitCode === 0) {
            // eslint-disable-next-line no-control-regex
            fs.writeFileSync(path.resolve(`${__dirname}/../logs/npm_${format(new Date(), "yyyyMMdd_HHmmss")}.log`), stdout.replace(/[^\x00-\x7F]/g, ""));
            resolve(stdout);
        } else {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject(new Error(`${stdout || ""}${stderr || ""}`));
        }
    });
    workerProcess.on("exit", code => exitCode = code);
});

const cleanUpWeb = argv => {
    [argv.update ? "build/public/update_" : "build/public/zoia_", "build/scripts"].map(d => {
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
    fs.copySync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/shared/mail/templates`), path.resolve(`${__dirname}/../build/mail/templates`));
    fs.copySync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/shared/mail/components`), path.resolve(`${__dirname}/../build/mail/components`));
    fs.copySync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/shared/mail/images`), path.resolve(`${__dirname}/../build/mail/images`));
};

const generateTemplatesJSON = argv => {
    const available = fs.readdirSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/design/templates`));
    const templatesJSON = available.filter(i => !i.match(/^\./) && !i.match(/-shared$/));
    available.map(t => {
        if (fs.existsSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/design/templates/${t}/minify.json`))) {
            const files = fs.readJSONSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/design/templates/${t}/minify.json`));
            files.map(f => {
                const htmlRaw = fs.readFileSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/design/templates/${t}/${f.src}`), "utf8");
                minify({
                    compressor: htmlMinifier,
                    options: {
                        removeAttributeQuotes: true,
                        collapseWhitespace: true,
                        html5: true
                    },
                    content: htmlRaw
                }).then(htmlMin => fs.writeFileSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/design/templates/${t}/${f.dest}`), htmlMin));
            });
        }
    });
    fs.writeJSONSync(path.resolve(`${__dirname}/../build/etc/templates.json`), templatesJSON);
};

const generateVariablesSCSS = async argv => {
    const variablesSrcDir = `${__dirname}/../${argv.update ? "update" : "src"}/shared/scss`;
    const variablesDestDir = `${__dirname}/../${argv.update ? "update" : "src"}/design/variables`;
    await fs.ensureDir(variablesDestDir);
    await Promise.allSettled(["frontend", "admin", "components"].map(async s => {
        if (!fs.existsSync(path.resolve(`${variablesDestDir}/${s}.scss`))) {
            await fs.copy(path.resolve(`${variablesSrcDir}/${s}.scss`), path.resolve(`${variablesDestDir}/${s}.scss`));
        }
    }));
};

const rebuildMarkoTemplates = argv => {
    const templates = require(`${__dirname}/../build/etc/templates.json`);
    console.log("Re-building Marko templates macro...");
    const root = `<!-- This file is auto-generated, do not modify -->\n${templates.map(t => `<if(out.global.template === "${t}")><${t}><i18n/><socketIO/><\${input.renderBody}/></${t}></if>\n`).join("")}\n`;
    fs.writeFileSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/design/index.marko`), root);
};

const generateModulesConfig = (moduleDirs, languages, argv) => {
    const modules = [];
    const admin = [];
    const backup = {};
    const defaults = {};
    const meta = {};
    fs.ensureDirSync(path.resolve(`${__dirname}/../logs`));
    fs.ensureDirSync(path.resolve(`${__dirname}/../etc/modules`));
    fs.ensureDirSync(path.resolve(`${__dirname}/../build/scripts`));
    fs.ensureDirSync(path.resolve(`${__dirname}/../build/mail/modules`));
    moduleDirs.map(moduleDir => {
        let moduleData;
        try {
            moduleData = require(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDir}/module.json`));
        } catch {
            // Ignore
        }
        if (!moduleData) {
            return;
        }
        const dirs = moduleData.meta ? moduleData.dirs : [moduleDir];
        if (moduleData.meta) {
            meta[moduleData.id] = moduleData.dirs;
        }
        for (const dir of dirs) {
            let moduleDirPath = dir;
            let moduleDataCurrent;
            if (moduleData.meta) {
                moduleDirPath = moduleData.meta ? `${moduleData.id}/${dir}` : dir;
                try {
                    moduleDataCurrent = require(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDirPath}/module.json`));
                    moduleDataCurrent.parentModule = moduleData.id;
                } catch {
                    console.log(`Could not read module data for meta-module: ${moduleDirPath}`);
                    process.exit(1);
                }
            } else {
                moduleDataCurrent = moduleData;
            }
            // In production / non-update mode, copy the configs of each module to etc/modules
            if (argv.mode === "production" && argv.type !== "update" && !fs.existsSync(path.resolve(`${__dirname}/../etc/modules/${moduleDataCurrent.id}.json`)) && fs.existsSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDirPath}/config.dist.json`))) {
                fs.copyFileSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDirPath}/config.dist.json`), path.resolve(`${__dirname}/../etc/modules/${moduleDataCurrent.id}.json`));
            }
            if (fs.existsSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDirPath}/mail`)) && !fs.existsSync(path.resolve(`${__dirname}/../build/mail/modules/${moduleDataCurrent.id}`))) {
                fs.copy(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDirPath}/mail`), path.resolve(`${__dirname}/../build/mail/modules/${moduleDataCurrent.id}`));
            }
            // Load defaults
            try {
                defaults[dir] = require(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDirPath}/defaults.json`));
            } catch {
                // Ignore
            }
            const moduleConfig = fs.existsSync(path.resolve(`${__dirname}/../etc/modules/${moduleDirPath}.json`)) ? require(path.resolve(`${__dirname}/../etc/modules/${dir}.json`)) : require(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDirPath}/config.dist.json`));
            if (moduleConfig.setup && fs.existsSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDirPath}/setup.js`))) {
                fs.copyFileSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDirPath}/setup.js`), path.resolve(`${__dirname}/../build/scripts/${moduleDirPath}.js`));
            }
            modules.push(moduleDataCurrent);
            if (moduleDataCurrent.admin) {
                try {
                    const adminConfig = require(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDirPath}/admin.json`));
                    const trans = {};
                    languages.map(language => {
                        const catalog = require(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDirPath}/locales/${language}.json`));
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
                } catch (e) {
                    console.log(e);
                    // Ignore
                }
            }
            try {
                const backupConfig = require(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${moduleDirPath}/backup.json`));
                backup[dir] = backupConfig;
            } catch {
                // Ignore
            }
        }
    });
    console.log("Writing modules.json...");
    fs.writeJSONSync(`${__dirname}/../build/etc/modules.json`, modules);
    console.log("Writing meta.json...");
    fs.writeJSONSync(`${__dirname}/../build/etc/meta.json`, meta);
    console.log("Writing defaults.json...");
    fs.writeJSONSync(`${__dirname}/../build/etc/defaults.json`, defaults);
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
    const packageJsonMain = require(path.resolve(`${__dirname}/../package.json`));
    const packageJsonCore = require(path.resolve(`${__dirname}/../package-core.json`));
    packageJsonMain.dependencies = packageJsonCore.dependencies;
    packageJsonMain.devDependencies = packageJsonCore.devDependencies;
    await fs.writeJSON(path.resolve(`${__dirname}/../package-update.json`), packageJsonMain, {
        spaces: "\t"
    });
    await fs.copy(path.resolve(`${__dirname}/../package-update.json`), path.resolve(`${__dirname}/../package.json`), {
        overwrite: true,
        errorOnExist: false
    });
    await fs.remove(path.resolve(`${__dirname}/../package-update.json`));
    for (const dir of moduleDirs) {
        let npmData;
        try {
            npmData = require(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${dir}/npm.json`));
        } catch {
            // Ignore
        }
        if (!npmData) {
            // eslint-disable-next-line no-continue
            continue;
        }
        const cmd = Object.keys(npmData).map(m => {
            if (!packageJsonCore.dependencies[m] || packageJsonCore.dependencies[m] !== npmData[m] || !packageJsonCore.devDependencies[m] || packageJsonCore.devDependencies[m] !== npmData[m]) {
                try {
                    require(m);
                    const modulePackageJson = require(`${__dirname}/../node_modules/${m}/package.json`);
                    if (modulePackageJson.version === npmData[m].replace(/[^0-9.]/gm, "")) {
                        return null;
                    }
                } catch {
                    // Ignore
                }
                return `${m}@${npmData[m]}`;
            }
        }).filter(i => i).join(" ");
        if (cmd && cmd.length) {
            try {
                console.log(`Installing NPM packages for module "${dir}"...`);
                await execCommand(`npm i ${cmd} --loglevel=error`);
            } catch (e) {
                console.error(e);
                process.exit(1);
            }
        }
    }
};

const ensureDirectories = (config) => {
    const dirs = ["etc", config.directories.tmp, "logs", "build/etc", "build/bin", "build/public", config.directories.files, "build/mail", config.directories.publicFiles, config.directories.publicImages];
    console.log(`Ensuring directories: ${dirs.join(", ")}`);
    dirs.map(d => fs.ensureDirSync(path.resolve(`${__dirname}/../${d}`)));
};

const copyPublic = argv => {
    const publicFiles = [{
        src: "favicon.ico",
        dest: `${argv.update ? "update_" : "zoia_"}/favicon.ico`
    }];
    publicFiles.map(i => fs.copyFileSync(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/public/${i.src}`), path.resolve(`${__dirname}/../build/public/${i.dest}`)));
};

const runBuildScripts = (moduleDirs, argv) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const dir of moduleDirs) {
        let script;
        try {
            script = require(path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/modules/${dir}/build.js`));
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
    runBuildScripts,
    generateVariablesSCSS,
};
