const path = require("path");

const config = require(path.resolve(`${__dirname}/etc/zoia.json`));

module.exports = {
    apps: [{
        ...config.pm2,
        name: config.siteOptions.id,
        error_file: config.pm2.error_file ? path.resolve(`${__dirname}/logs/${config.siteOptions.id}_error.log`) : "/dev/null",
        out_file: config.pm2.out_file ? path.resolve(`${__dirname}/logs/${config.siteOptions.id}_out.log`) : "/dev/null",
        log_file: config.pm2.log_file ? path.resolve(`${__dirname}/logs/${config.siteOptions.id}_combined.log`) : "/dev/null",
    }]
};
