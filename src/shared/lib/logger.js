import fs from "fs-extra";
import path from "path";
import pino from "pino";

const config = fs.readJsonSync(path.resolve(`${__dirname}/../../etc/system.json`));

export default pino({
    level: config.logLevel,
    serializers: {
        req(request) {
            return {
                method: request.method,
                url: request.url,
                hostname: request.hostname,
                remoteAddress: request.ip,
                remotePort: request.socket.remotePort,
            };
        }
    }
});
