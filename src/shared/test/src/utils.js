/* eslint-disable no-await-in-loop */
import crypto from "crypto";
import {
    ObjectId
} from "mongodb";

export default class {
    constructor(config, modulesConfig, db, redis) {
        this.config = config;
        this.modulesConfig = modulesConfig;
        this.db = db;
        this.redis = redis;
    }

    getRandomString(len = 8) {
        return crypto.randomBytes(len).toString("hex");
    }

    async insertRandomUser(admin = true) {
        const username = this.getRandomString();
        const password = this.getRandomString();
        const passwordHash = crypto.createHmac("sha256", this.config.secret).update(password).digest("hex");
        const data = {
            username,
            password: passwordHash,
            email: `${this.getRandomString()}@zoiajs.org`,
            status: admin ? ["active", "admin"] : [],
            createdAt: new Date()
        };
        const result = await this.db.collection(this.modulesConfig["users"].collectionUsers).insertOne(data);
        data._id = result.insertedId;
        data.password = password;
        data.passwordHash = passwordHash;
        return data;
    }

    async deleteRandomUser(userData) {
        await this.db.collection(this.modulesConfig["users"].collectionUsers).deleteOne({
            _id: new ObjectId(userData._id)
        });
    }

    async clickWithTimeout(page, selector, timeout = 15000) {
        await page.waitForSelector(selector, {
            visible: true,
            timeout
        });
        let error;
        while (timeout > 0) {
            try {
                await page.click(selector);
                return;
            } catch (e) {
                await page.waitFor(100);
                timeout -= 100;
                error = e;
            }
        }
        throw error;
    }
}
