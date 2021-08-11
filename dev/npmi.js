const path = require("path");
const fs = require("fs-extra");
const semver = require("semver");
const {
    exec
} = require("child_process");
const {
    format,
} = require("date-fns");

class NPMI {
    async isInstalled(name, version = "latest") {
        try {
            const packageJSON = await fs.readJSON(path.resolve(__dirname, "..", "node_modules", name, "package.json"));
            const packageJSONVersion = semver.coerce(packageJSON.version);
            const needVersion = semver.coerce(version);
            return semver.gte(packageJSONVersion, needVersion) ? packageJSON.version : false;
        } catch (e) {
            return false;
        }
    }

    async execCommand(cmd) {
        return new Promise((resolve, reject) => {
            let exitCode;
            const workerProcess = exec(cmd, (error, stdout, stderr) => {
                if (exitCode === 0) {
                    // eslint-disable-next-line no-control-regex
                    fs.ensureDirSync(path.resolve(`${__dirname}/../logs`));
                    fs.writeFileSync(path.resolve(`${__dirname}/../logs/build_${format(new Date(), "yyyyMMdd_HHmmss")}.log`), stdout.replace(/[^\x00-\x7F]/g, ""));
                    resolve(stdout);
                } else {
                    // eslint-disable-next-line prefer-promise-reject-errors
                    reject(new Error(`${stdout || ""}${stderr || ""}`));
                }
            });
            workerProcess.on("exit", code => exitCode = code);
        });
    }
}

module.exports = NPMI;
