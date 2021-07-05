/* eslint-disable no-console */
const commandLineArgs = require("command-line-args");
const fs = require("fs-extra");
const path = require("path");

const options = commandLineArgs([{
    name: "source",
    alias: "s",
    type: String
}, {
    name: "dest",
    alias: "d",
    type: String
}, {
    name: "default",
    alias: "v",
    type: Boolean
}]);

if (!options || !options.source || !String(options.source).match(/^[a-z]{2}(-[a-z]{2})?$/) || !options.dest || !String(options.dest).match(/^[a-z]{2}(-[a-z]{2})?$/)) {
    console.log("Usage: localize --source <language> --dest <language> [--default]");
    process.exit();
}

const notTranslated = {};

const processLanguageFiles = async dir => {
    const files = await fs.readdir(dir);
    for (const file of files) {
        const filePath = path.resolve(`${dir}/${file}`);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            await processLanguageFiles(filePath);
        } else if (file === `${options.source}.json`) {
            console.log(`${dir}/${options.source}.json`);
            const sourceData = await fs.readJSON(filePath);
            let destData = {};
            const filePathDest = path.resolve(`${dir}/${options.dest}.json`);
            try {
                destData = await fs.readJSON(filePathDest);
            } catch {
                // Ignore
            }
            for (const key of Object.keys(sourceData)) {
                if (!destData[key]) {
                    if (!notTranslated[filePathDest]) {
                        console.log(`Some items are not translated: ${filePathDest}`);
                        notTranslated[filePathDest] = true;
                    }
                    switch (typeof sourceData[key]) {
                    case "string":
                        destData[key] = options.default ? sourceData[key] : "";
                        break;
                    default:
                        destData[key] = sourceData[key];
                    }
                }
                await fs.writeJSON(filePath, sourceData, {
                    spaces: "\t"
                });
                await fs.writeJSON(filePathDest, destData, {
                    spaces: "\t"
                });
            }
        }
    }
};

(async () => {
    await processLanguageFiles(path.resolve(`${__dirname}/../../src`));
})();
