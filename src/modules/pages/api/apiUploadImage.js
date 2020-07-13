/* eslint no-param-reassign:0 */
import fs from 'fs-extra';
import { v4 as uuid } from 'uuid';
import Jimp from 'jimp';

export default fastify => ({
    async handler(req, rep) {
        // Start of Validation
        if (!req.body.token || !req.body.upload || !Array.isArray(req.body.upload) || typeof req.body.token !== 'string') {
            rep.logError(req, 'Missing token or file upload');
            return rep.sendBadRequestException(rep, 'Missing token or file upload');
        }
        // End of Validation
        // Check permissions
        const user = await req.verifyToken(req.body.token, fastify, this.mongo.db);
        if (!user || !user.admin) {
            rep.logError(req, 'Authentication failed');
            return rep.sendUnauthorizedException(rep, {
                default: {
                    username: '',
                    password: ''
                }
            });
        }
        // End of check permissions
        try {
            if (fastify.zoiaConfig.demo) {
                return rep.sendSuccessJSON(rep, {
                    url: `/zoia/logo_dark_small.png`
                });
            }
            await fs.ensureDir(`${__dirname}/../static/uploads`);
            const filename = uuid();
            const img = await Jimp.read(req.body.upload[0].data);
            const thumbBuffer = await img.getBufferAsync(Jimp.MIME_JPEG);
            await fs.writeFile(`${__dirname}/../static/uploads/${filename}.jpg`, thumbBuffer);
            return rep.sendSuccessJSON(rep, {
                url: `/uploads/${filename}.jpg`
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
