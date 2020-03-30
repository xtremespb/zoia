import fs from "fs-extra";
import path from "path";
import pino from "pino";

const config = fs.readJsonSync(path.resolve(`${__dirname}/../../etc/zoia.json`));

export default pino({
    level: config.logLevel
});
