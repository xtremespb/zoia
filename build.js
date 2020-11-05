/* eslint-disable no-console */
const {
    exec
} = require("child_process");
const commandLineArgs = require("command-line-args");

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

const command = Object.keys(options)[0];
const params = {
    dev: "--display minimal --progress --mode development --config ./webpack/config.js",
    maps: "--display minimal --progress --mode development --config ./webpack/config.js --maps true",
    update: "webpack --display minimal --progress --mode production --config ./webpack/config.js --type update",
    production: "webpack --display minimal --progress --mode production --config ./webpack/config.js",
};

if (!params[command]) {
    console.error("Build parameter missing or invalid");
    return;
}

const execCommand = cmd => new Promise((resolve, reject) => {
    let error;
    let stdout;
    let stderr;
    const workerProcess = exec(cmd, (errorData, stdoutData, stderrData) => {
        error = errorData;
        stdout = stdoutData;
        stderr = stderrData;
    });
    workerProcess.on("exit", code => {
        console.log(`Child process exited with exit code ${code}`);
        console.log(error);
        console.log(stdout);
        console.log(stderr);
        if (code === 0) {
            resolve();
        } else {
            reject();
        }
    });
});

(async () => {
    const result = await execCommand(`node node_modules/webpack-cli/bin/cli ${params[command]}`);
})();
