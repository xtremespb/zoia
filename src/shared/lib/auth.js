import {
    ObjectId
} from "mongodb";
import crypto from "crypto";
import Cryptr from "cryptr";
import {
    v4 as uuid
} from "uuid";
import C from "./constants";

export default class {
    constructor(db, fastify, req, rep, token = C.USE_COOKIE_FOR_TOKEN) {
        const log = new fastify.LoggerHelpers(req, fastify);
        try {
            this.jwt = fastify.jwt;
        } catch (e) {
            log.info(`JWT token cannot be decoded: ${e.message}`);
        }
        this.db = db;
        this.user = null;
        this.rep = rep;
        this.fastify = fastify;
        this.zoiaConfig = fastify.zoiaConfig;
        this.collectionUsers = fastify.zoiaModulesConfig["users"].collectionUsers;
        this.ip = req ? crypto.createHmac("md5", fastify.zoiaConfig.secret).update(req.ip).digest("hex") : null;
        if (typeof token === "string") {
            this.token = token;
        } else if (token === C.USE_EVERYTHING_FOR_TOKEN) {
            this.token = req.headers.authorization && typeof req.headers.authorization === "string" ? req.headers.authorization.replace(/^Bearer /, "") : req.cookies[`${fastify.zoiaConfig.id || "zoia3"}.authToken`];
        } else if (token && req.headers.authorization) {
            this.token = req.headers.authorization && typeof req.headers.authorization === "string" ? req.headers.authorization.replace(/^Bearer /, "") : null;
        } else if (!token) {
            this.token = req.cookies[`${fastify.zoiaConfig.id || "zoia3"}.authToken`];
        }
    }

    getToken() {
        return this.token;
    }

    clearAuthCookie() {
        if (!this.rep) {
            return;
        }
        this.rep.clearCookie(`${this.zoiaConfig.id || "zoia3"}.authToken`, {
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
            const user = await this.db.collection(this.collectionUsers).findOne({
                _id: new ObjectId(tokenData.id)
            });
            if (!user || user.sid !== tokenData.sid) {
                return null;
            }
            if (this.zoiaConfig.token.ip && this.ip && tokenData.ip !== this.ip) {
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

    statusAdmin() {
        return this.checkStatus("admin") && this.checkStatus("active");
    }

    statusActive() {
        return this.checkStatus("active");
    }

    checkGroup(group) {
        if (!this.user || !this.user.groups) {
            return false;
        }
        return this.user.groups.indexOf(group) > -1;
    }

    getGroups() {
        return this.user.groups || [];
    }

    generateSid() {
        return uuid();
    }

    signToken(id, sid) {
        const data = {
            id: String(id),
            sid,
        };
        if (this.zoiaConfig.token.ip) {
            data.ip = this.ip;
        }
        const signedToken = this.jwt.sign(data, {
            expiresIn: this.zoiaConfig.token.expires
        });
        return signedToken;
    }

    async login(username, password) {
        try {
            const user = await this.db.collection(this.collectionUsers).findOne({
                username
            });
            const passwordHash = crypto.createHmac("sha256", this.zoiaConfig.secret).update(password).digest("hex");
            if (!user || user.password !== passwordHash || !user.status || user.status.indexOf("active") === -1) {
                return null;
            }
            const sid = user.sid || this.generateSid();
            const tokenSigned = this.signToken(user._id, sid);
            await this.db.collection(this.collectionUsers).updateOne({
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
                await this.db.collection(this.collectionUsers).updateOne({
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

    async validateCaptcha(captchaSecret, code) {
        if (!captchaSecret || typeof captchaSecret !== "string" || !code || typeof code !== "string") {
            return false;
        }
        try {
            // Generate hash of a secret string
            const captchaSecretHash = crypto.createHmac("sha256", this.fastify.zoiaConfig.secret).update(captchaSecret).digest("hex");
            // Check if this captcha has been already used before
            const invCaptcha = await this.db.collection("captcha").findOne({
                _id: captchaSecretHash
            });
            if (invCaptcha) {
                return false;
            }
            // Decrypt captcha secret and parse it to JSON
            const cryptr = new Cryptr(this.fastify.zoiaConfig.secret);
            const decrypted = cryptr.decrypt(captchaSecret);
            const dataJSON = JSON.parse(decrypted) || {};
            // Check if captcha is valid and not outdated
            if (!dataJSON.c || dataJSON.c !== code || (dataJSON.t && new Date().getTime() - parseInt(dataJSON.t, 10) > (this.fastify.zoiaConfig.captchaValidity * 1000 || 3600000))) {
                return false;
            }
            // All checks are passed
            // Invalidate captcha
            await this.db.collection("captcha").insertOne({
                _id: captchaSecretHash,
                createdAt: new Date()
            });
            return true;
        } catch (e) {
            return false;
        }
    }
}
