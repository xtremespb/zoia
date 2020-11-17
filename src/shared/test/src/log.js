/* eslint-disable no-console */
const colors = require("colors/safe");

export default class {
    info(msg) {
        console.log(`${colors.gray("[*]")} ${colors.gray(new Date())} ${msg}`);
    }

    success(msg) {
        console.log(`${colors.green("[+]")} ${colors.gray(new Date())} ${msg}`);
    }

    warn(msg) {
        console.log(`${colors.yellow("[=]")} ${colors.gray(new Date())} ${msg}`);
    }

    error(msg) {
        console.log(`${colors.brightRed("[!]")} ${colors.gray(new Date())} ${msg}`);
    }

    step(msg) {
        console.log(`${colors.cyan("[-]")} ${colors.gray(new Date())} ${msg}`);
    }

    print(msg, level) {
        switch (level) {
        case "info":
            this.info(msg);
            break;
        case "success":
            this.success(msg);
            break;
        case "warn":
            this.warn(msg);
            break;
        case "error":
            this.error(msg);
            break;
        case "step":
            this.step(msg);
            break;
        }
    }
}
