/* eslint-disable no-console */
const commandLineArgs = require("command-line-args");
const fs = require("fs-extra");
const path = require("path");
const NPMI = require("./npmi");

const options = commandLineArgs([{
    name: "dev",
    type: Boolean
}, {
    name: "maps",
    type: Boolean
}, {
    name: "update",
    type: Boolean
}, {
    name: "production",
    type: Boolean
}]);

if (Object.keys(options).length !== 1) {
    console.error("Build parameter missing or invalid");
    return;
}

let buildMode = "production";
try {
    const buildConfig = fs.readJSONSync(path.resolve(`${__dirname}/../build/etc/build.json`));
    buildMode = buildConfig.mode;
} catch {
    // Ignore
}
const command = Object.keys(options)[0];
const params = {
    dev: "--mode development --config ./dev/config.js",
    maps: "--progress --mode development --config ./dev/config.js --env=maps=true",
    update: `--progress --mode ${buildMode} --config ./dev/config.js --env=update=true`,
    production: "--progress --mode production --config ./dev/config.js",
};

if (!params[command]) {
    console.error("Build parameter missing or invalid");
    return;
}

const installAnimation = (module, version) => {
    const h = ["|", "/", "-", "\\"];
    let i = 0;
    return setInterval(() => {
        i = (i > 3) ? 0 : i;
        const msg = `- Installing ${module}@${version}... ${h[i]}`;
        process.stdout.write(`\r${msg}`);
        i += 1;
    }, 100);
};

const buildAnimation = () => {
    const h = ["|", "/", "-", "\\"];
    let i = 0;
    return setInterval(() => {
        i = (i > 3) ? 0 : i;
        const msg = `Building ZOIA, this may take ${options.production ? "LONG" : "some"} time... ${h[i]}`;
        process.stdout.write(`\r${msg}`);
        i += 1;
    }, 100);
};

(async () => {
    const packageJson = require(path.resolve(`${__dirname}/../package.json`));
    console.log(`ZOIA Build Script, mode: ${buildMode}, version: ${packageJson.version}\nStart time: ${new Date()}\n`);
    const timestampStart = new Date().getTime() / 1000;
    const dir = command === "update" ? "update" : "zoia";
    let loading;
    try {
        const npmi = new NPMI();
        // Create backups of all files
        if (fs.existsSync(path.resolve(`${__dirname}/../build/bin/zoia.js`))) {
            fs.copySync(path.resolve(`${__dirname}/../build/bin/zoia.js`), path.resolve(`${__dirname}/../build/bin/zoia.js.bak`));
        }
        if (fs.existsSync(path.resolve(`${__dirname}/../build/bin/test.js`))) {
            fs.copySync(path.resolve(`${__dirname}/../build/bin/test.js`), path.resolve(`${__dirname}/../build/bin/test.js.bak`));
        }
        if (fs.existsSync(path.resolve(`${__dirname}/../build/bin/cli.js`))) {
            fs.copySync(path.resolve(`${__dirname}/../build/bin/cli.js`), path.resolve(`${__dirname}/../build/bin/cli.js.bak`));
        }
        if (fs.existsSync(path.resolve(`${__dirname}/../build/public/${dir}`))) {
            fs.copySync(path.resolve(`${__dirname}/../build/public/${dir}`), path.resolve(`${__dirname}/../build/public/${dir}_bak`));
        }
        // Get list of modules
        const moduleDirs = (await fs.readdir(path.resolve(`${__dirname}/../${command === "update" ? "update" : "src"}/modules`))).filter(d => !d.match(/^\./));
        // Build a list of "3rd-party" NPM modules
        let extraModules = {};
        for (const moduleDir of moduleDirs) {
            try {
                const npmData = require(path.resolve(`${__dirname}/../${command === "update" ? "update" : "src"}/modules/${moduleDir}/npm.json`));
                extraModules = {
                    ...extraModules,
                    ...npmData
                };
            } catch {
                // Ignore
            }
        }
        const extraModuleNames = Object.keys(extraModules);
        // Install 3rd-party modules when necessary
        if (extraModuleNames.length) {
            console.log(`${extraModuleNames.length} additional NPM module(s) will be installed:\n`);
            for (const m of extraModuleNames) {
                const moduleIsInstalled = await npmi.isInstalled(m, extraModules[m]);
                if (!moduleIsInstalled) {
                    loading = installAnimation(m, extraModules[m]);
                    await npmi.execCommand(`npm i ${m}@${extraModules[m]} --loglevel=info`);
                    clearTimeout(loading);
                    process.stdout.write(`\r- Successfully installed NPM module: ${m}@${extraModules[m]}\n`);
                } else {
                    console.log(`- Already up-to-date, skipping: ${m}@${extraModules[m]}`);
                }
            }
            console.log("");
        }
        // Overwrite dependencies and devDependencies from package-core.json
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
        // Start building
        loading = buildAnimation();
        await npmi.execCommand(`node node_modules/webpack-cli/bin/cli ${params[command]}`);
        // Remove backups
        fs.removeSync(path.resolve(`${__dirname}/../build/bin/zoia.js.bak`));
        fs.removeSync(path.resolve(`${__dirname}/../build/bin/test.js.bak`));
        fs.removeSync(path.resolve(`${__dirname}/../build/bin/cli.js.bak`));
        fs.removeSync(path.resolve(`${__dirname}/../build/public/${dir}`));
        fs.removeSync(path.resolve(`${__dirname}/../build/public/${dir}_bak`));
        fs.removeSync(path.resolve(`${__dirname}/../package-update.json`));
        fs.moveSync(path.resolve(`${__dirname}/../build/public/${dir}_`), path.resolve(`${__dirname}/../build/public/${dir}`));
        clearTimeout(loading);
    } catch (e) {
        try {
            if (fs.existsSync(path.resolve(`${__dirname}/../build/public/${dir}_`))) {
                fs.removeSync(path.resolve(`${__dirname}/../build/public/${dir}_`));
            }
        } catch {
            // Ignore
        }
        if (loading) {
            clearTimeout(loading);
        }
        console.log(`Failed:\n`);
        console.log(e);
        process.exit(1);
    }
    console.log(`\rAll done, ${command} version of ZOIA has been built successfully in ${parseInt(new Date().getTime() / 1000 - timestampStart, 10)} second(s).\n`);
})();
