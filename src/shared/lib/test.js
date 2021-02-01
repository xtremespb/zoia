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
            defaultViewport: this.zoia.config.test.defaultViewport,
            devtools: true
        });
    }

    getRunTimeMs() {
        return parseInt(new Date().getTime() - this.startTime, 10);
    }

    async close() {
        if (this.browser) {
            try {
                const pages = await this.browser.pages();
                await Promise.all(pages.map(page => page.close()));
            } catch {
                // Ignore
            }
            try {
                if (this.browser && this.browser.process() != null) {
                    this.browser.process().kill("SIGINT");
                }
            } catch {
                // Ignore
            }
        }
    }
}
