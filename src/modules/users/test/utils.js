import crypto from "crypto";
import {
    ObjectID
} from "mongodb";

export default class {
    constructor(zoia) {
        this.zoia = zoia;
    }

    getRandomString(len = 8) {
        return crypto.randomBytes(len).toString("hex");
    }

    async insertRandomUser(admin = true) {
        const username = this.getRandomString();
        const password = this.getRandomString();
        const passwordHash = crypto.createHmac("sha256", this.zoia.config.secret).update(password).digest("hex");
        const data = {
            username,
            password: passwordHash,
            email: `${this.getRandomString()}@zoiajs.org`,
            status: admin ? ["active", "admin"] : [],
            createdAt: new Date()
        };
        const result = await this.zoia.db.collection(this.zoia.modulesConfig["users"].collectionUsers).insertOne(data);
        data._id = result.insertedId;
        data.password = password;
        data.passwordHash = passwordHash;
        return data;
    }

    async deleteRandomUser(userData) {
        await this.zoia.db.collection(this.zoia.modulesConfig["users"].collectionUsers).deleteOne({
            _id: new ObjectID(userData._id)
        });
    }
}
