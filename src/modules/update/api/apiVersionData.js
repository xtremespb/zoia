import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

export default fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                token: {
                    type: 'string'
                }
            },
            required: ['token']
        }
    },
    attachValidation: true,
    async handler(req, rep) {
        // Start of Validation
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            return rep.sendBadRequestException(rep, 'Request validation error', req.validationError);
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
            let data;
            const packageJson = await fs.readJSON(path.resolve(`${__dirname}/../../package.json`));
            try {
                const dataVersion = await axios.get(`https://xtremespb.github.io/zoia2/version.json`);
                if (dataVersion && dataVersion.data) {
                    data = dataVersion.data;
                }
            } catch (e) {
                // Ignore
            }
            if (!data || !data.code) {
                return rep.sendNotFoundError(rep, 'Version data could not be loaded');
            }
            // Send response
            return rep.sendSuccessJSON(rep, {
                remote: data.code,
                local: packageJson.version
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
