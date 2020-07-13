import { v4 as uuid } from 'uuid';
import Cryptr from 'cryptr';
import crypto from 'crypto';
import {
    ObjectId
} from 'mongodb';
import locale from './locale';

export default {
    verifyToken: async (token, fastify, db) => {
        try {
            const decodedToken = fastify.jwt.verify(token);
            if (!decodedToken || !decodedToken.userId || !decodedToken.sessionId || Math.floor(Date.now() / 1000) > decodedToken.exp) {
                return null;
            }
            const user = await db.collection('users').findOne({
                _id: new ObjectId(decodedToken.userId)
            });
            if (!user || !user.active || user.sessionId !== decodedToken.sessionId) {
                return null;
            }
            return user;
        } catch (e) {
            return null;
        }
    },
    getUserData: async (req, fastify, db) => {
        try {
            if (req.cookies[`${fastify.zoiaConfig.id}_auth`] && db) {
                const token = req.cookies[`${fastify.zoiaConfig.id}_auth`];
                const decodedToken = fastify.jwt.decode(token);
                if (!decodedToken || !decodedToken.userId || !decodedToken.sessionId || Math.floor(Date.now() / 1000) > decodedToken.exp) {
                    return {};
                }
                const user = await db.collection('users').findOne({
                    _id: new ObjectId(decodedToken.userId)
                });
                if (!user || !user.active || user.sessionId !== decodedToken.sessionId) {
                    return {};
                }
                return {
                    id: user._id,
                    active: user.active,
                    admin: user.admin,
                    username: user.username
                };
            }
        } catch (e) {
            // Ignore
        }
        return {};
    },
    decodeEncryptedJSON: (data, fastify) => {
        let dataJSON = {};
        const cryptr = new Cryptr(fastify.zoiaConfigSecure.secret);
        try {
            const decrypted = cryptr.decrypt(data);
            dataJSON = JSON.parse(decrypted) || {};
        } catch (e) {
            // Ignore
        }
        if (dataJSON.t) {
            const captchaValidityMs = fastify.zoiaConfigSecure.captchaValidity * 1000 || 3600000;
            dataJSON.tDiff = new Date().getTime() - parseInt(dataJSON.t, 10);
            if (dataJSON.tDiff > captchaValidityMs) {
                dataJSON.overdue = true;
            }
        }
        return dataJSON;
    },
    validateCaptcha: async (captchaSecret, code, fastify, db) => {
        try {
            // Generate hash of a secret string
            const captchaSecretHash = crypto.createHmac('sha256', fastify.zoiaConfigSecure.secret).update(captchaSecret).digest('hex');
            // Check if this captcha has been already used before
            const invCaptcha = await db.collection('captcha').findOne({
                _id: captchaSecretHash
            });
            if (invCaptcha) {
                return false;
            }
            // Decrypt catcha secret and parse it to JSON
            const cryptr = new Cryptr(fastify.zoiaConfigSecure.secret);
            const decrypted = cryptr.decrypt(captchaSecret);
            const dataJSON = JSON.parse(decrypted) || {};
            // Check if captcha is valid and not outdated
            if (!dataJSON.c || dataJSON.c !== code || (dataJSON.t && new Date().getTime() - parseInt(dataJSON.t, 10) > (fastify.zoiaConfigSecure.captchaValidity * 1000 || 3600000))) {
                return false;
            }
            // All checks are passed
            // Invalidate captcha
            await db.collection('captcha').insertOne({
                _id: captchaSecretHash,
                createdAt: new Date()
            });
            return true;
        } catch (e) {
            return false;
        }
    },
    logout(req, rep) {
        const language = locale.getLocaleFromURL(req);
        const languagePrefixURL = language === Object.keys(req.zoiaConfig.languages)[0] ? '' : `${language}`;
        const redirectURL = `${languagePrefixURL}?_=${uuid()}`.replace(/\/\//, '/');
        return rep.sendClearCookieRedirect(rep, `${req.zoiaConfig.id}_auth`, req.zoiaConfig.cookieOptions, redirectURL);
    }
};
