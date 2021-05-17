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
        }
    }
};

(async () => {
    await processMarkoFiles(path.resolve(`${__dirname}/../../src`));
})();
