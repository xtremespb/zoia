const path = require("path");

const config = require(path.resolve(`${__dirname}/etc/system.json`));

module.exports = {
    apps: [{
        ...config.pm2,
        name: config.id,
        error_file: config.pm2.error_file ? path.resolve(`${__dirname}/logs/${config.id}_error.log`) : "/dev/null",
        out_file: config.pm2.out_file ? path.resolve(`${__dirname}/logs/${config.id}_out.log`) : "/dev/null",
        log_file: config.pm2.log_file ? path.resolve(`${__dirname}/logs/${config.id}_combined.log`) : "/dev/null",
    }]
};
