const path = require("path");

const config = require(path.resolve(`${__dirname}/etc/zoia.json`));

module.exports = {
    apps: [{
        name: config.siteOptions.id,
        script: "./build/bin/zoia.js",
        watch: false,
        exec_mode: "cluster",
        instances: 0,
        error_file: path.resolve(`${__dirname}/logs/${config.siteOptions.id}_error.log`),
        out_file: path.resolve(`${__dirname}/logs/${config.siteOptions.id}_out.log`),
        log_file: "/dev/null",
        merge_logs: true,
        time: false
    }]
};
