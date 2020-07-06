import {
    ObjectId
} from "mongodb";

module.exports = class {
    constructor(fastify) {
        this.fastify = fastify;
    }

    async verifyToken(token) {
        try {
            const decodedToken = this.fastify.jwt.verify(token);
            const dateNow = Math.floor(Date.now() / 1000);
            if (!decodedToken || !decodedToken.userId || !decodedToken.sessionId || dateNow > decodedToken.exp) {
                return null;
            }
            const user = await this.db.collection("users").findOne({
                _id: new ObjectId(decodedToken.userId)
            });
            if (!user || !user.active || user.sessionId !== decodedToken.sessionId) {
                return null;
            }
            return user;
        } catch (e) {
            return null;
        }
    }
};
