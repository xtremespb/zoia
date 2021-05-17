/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const {
    prettyPrintFile,
} = require("@marko/prettyprint");

const processMarkoFiles = async dir => {
    const files = await fs.readdir(dir);
    for (const file of files) {
        const filePath = path.resolve(`${dir}/${file}`);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            await processMarkoFiles(filePath);
        } else if (path.extname(filePath) === ".marko") {
            console.log(filePath);
            prettyPrintFile(filePath, {});
            const fileData = (await fs.readFile(filePath, "utf8")).replace(/\\\$\{/gm, "${").replace(/\\\$!\{/gm, "$!{").split(/\n|\r\n/);
            let tagFound = false;
            let fileDataNew = "";
            for (const line of fileData) {
                if (!tagFound && line.match(/^</)) {
                    tagFound = true;
                }
                if (tagFound && line.match(/^\n|\r\n$/)) {
                    // Do something, we're not adding an empty line
                } else {
                    // Add a new line, it's not empty
                    fileDataNew += `${line}\n`;
                }
            }
            fileDataNew = tagFound ? `${fileDataNew.trim()}\n` : `${fileData.join("\n")}\n`;
            await fs.writeFile(filePath, fileDataNew, "utf8");
        }
    }
};

(async () => {
    await processMarkoFiles(path.resolve(`${__dirname}/../../src`));
})();
