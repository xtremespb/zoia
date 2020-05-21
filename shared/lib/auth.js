import {
    ObjectId
} from "mongodb";
import crypto from "crypto";
import {
    v4 as uuid
} from "uuid";
import C from "./constants";

export default class {
    constructor(db, fastify, req, rep, useBearer = C.USE_COOKIE_FOR_TOKEN) {
        this.jwt = fastify.jwt;
        this.db = db;
        this.user = null;
        this.req = req;
        this.rep = rep;
        this.ip = crypto.createHmac("md5", this.req.zoiaConfig.secret).update(req.ip).digest("hex");
        if (useBearer && req.headers.authorization) {
            this.token = req.headers.authorization.replace(/^Bearer /, "");
        } else if (!useBearer) {
            this.token = req.cookies[`${req.zoiaConfig.siteOptions.globalPrefix || "zoia3"}.authToken`];
        }
    }

    getToken() {
        return this.token;
    }

    clearAuthCookie() {
        this.rep.clearCookie(`${this.req.zoiaConfig.siteOptions.globalPrefix || "zoia3"}.authToken`, {
            path: "/"
        });
    }

    async getUserData() {
        if (!this.token) {
            return null;
        }
        try {
            const tokenData = this.jwt.verify(this.token);
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
            delete user.password;
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

    async login(username, password) {
        try {
            const user = await this.db.collection("users").findOne({
                username
            });
            const passwordHash = crypto.createHmac("sha256", this.req.zoiaConfig.secret).update(password).digest("hex");
            if (!user || user.password !== passwordHash || !user.status || user.status.indexOf("active") === -1) {
                return null;
            }
            const sid = user.sid || this.generateSid();
            const tokenSigned = this.signToken(user._id, sid);
            await this.db.collection("users").updateOne({
                _id: user._id
            }, {
                $set: {
                    sid
                }
            });
            return tokenSigned;
        } catch (e) {
            return null;
        }
    }

    getUser() {
        return this.user || {};
    }

    async logout() {
        // Get user data
        const user = await this.getUserData();
        // Authorized, let's remove SID
        if (user) {
            try {
                await this.db.collection("users").updateOne({
                    _id: this.user._id
                }, {
                    $set: {
                        sid: undefined
                    }
                });
            } catch (e) {
                // Ignore
            }
        }
        // Clear auth cookie
        this.clearAuthCookie();
    }
}
