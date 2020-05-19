import {
    ObjectId
} from "mongodb";
import crypto from "crypto";
import {
    v4 as uuid
} from "uuid";

export default class {
    constructor(db, fastify, req) {
        this.jwt = fastify.jwt;
        this.db = db;
        this.user = null;
        this.req = req;
        this.ip = crypto.createHmac("md5", this.req.zoiaConfig.secret).update(req.ip).digest("hex");
    }

    async getUserData(token) {
        if (!token) {
            return null;
        }
        try {
            const tokenData = this.jwt.verify(token);
            if (!tokenData || !tokenData.id || !tokenData.sid) {
                return null;
            }
            const user = await this.db.collection("users").findOne({
                _id: new ObjectId(tokenData.id)
            });
            if (!user || user.sid !== tokenData.sid) {
                return null;
            }
            if (this.req.zoiaConfig.token.ip && tokenData.ip !== this.ip) {
                return null;
            }
            this.user = user;
            return user;
        } catch (e) {
            return null;
        }
    }

    checkStatus(status) {
        if (!this.user || !this.user.status) {
            return false;
        }
        return this.user.status.indexOf(status) > -1;
    }

    generateSid() {
        return uuid();
    }

    signToken(id, sid) {
        const data = {
            id: String(id),
            sid,
        };
        if (this.req.zoiaConfig.token.ip) {
            data.ip = this.ip;
        }
        const signedToken = this.jwt.sign(data, {
            expiresIn: this.req.zoiaConfig.token.expires
        });
        return signedToken;
    }
}
