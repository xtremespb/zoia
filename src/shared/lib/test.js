import puppeteer from "puppeteer";
import {
    assert
} from "chai";

export default class {
    constructor(zoia) {
        this.zoia = zoia;
        this.assert = assert;
        this.startTime = new Date().getTime();
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: this.zoia.config.test.headless,
            args: this.zoia.config.test.args,
            defaultViewport: this.zoia.config.test.defaultViewport
        });
    }

    getRunTimeMs() {
        return parseInt(new Date().getTime() - this.startTime, 10);
    }

    async close() {
        try {
            await this.browser.close();
        } catch {
            // Ignore
        }
    }
}
