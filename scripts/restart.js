/* eslint-disable no-console */
const pm2 = require("pm2");

const config = require(`${__dirname}/../etc/system.json`);

if (config.pm2.enabled) {
    console.log("Connecting to PM2...");
    pm2.connect(err => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Restarting ${config.id}...`);
        pm2.restart(config.id, (rerr, proc) => {
            if (rerr) {
                console.error(rerr);
            } else {
                console.log(`Success, restarted ${proc.length} process(es)`);
            }
            pm2.disconnect();
        });
    });
} else {
    console.log("Please set pm2.enabled to true in etc/system.json");
}
