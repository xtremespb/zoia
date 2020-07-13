import {
    ObjectId
} from 'mongodb';

const editableColumns = ['username', 'email', 'active'];
const noDupes = ['username', 'email'];

export default fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                token: {
                    type: 'string'
                },
                columnId: {
                    type: 'string',
                    pattern: `^(${editableColumns.join('|')})$`
                },
                recordId: {
                    type: 'string',
                    minLength: 24,
                    maxLength: 24,
                    pattern: '^[a-f0-9]+$'
                },
                value: {
                    type: 'string',
                    minLength: 0,
                    maxLength: 128,
                }
            },
            required: ['token', 'columnId', 'recordId']
        }
    },
    attachValidation: true,
    async handler(req, rep) {
        // Start of Validation
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            return rep.sendBadRequestException(rep, 'Request validation error', req.validationError);
        }
        let value = req.body.value || '';
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
            // Check if record exists
            const userRecord = await this.mongo.db.collection('users').findOne({
                _id: new ObjectId(req.body.recordId)
            });
            if (!userRecord) {
                return rep.sendBadRequestError(rep, 'Non-existent record');
            }
            // Perform the format validation
            let formatValidationError;
            switch (req.body.columnId) {
            case 'username':
                formatValidationError = !value || !value.match(/^[a-z0-9_-]{4,32}$/i);
                if (!formatValidationError) {
                    value = value.toLowerCase();
                }
                break;
            case 'email':
                // eslint-disable-next-line no-control-regex
                formatValidationError = !value || !value.match(/^(?:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?(?:\.(?:[a-zA-Z0-9]|[^\u0000-\u007F])(?:(?:[a-zA-Z0-9-]|[^\u0000-\u007F]){0,61}(?:[a-zA-Z0-9]|[^\u0000-\u007F]))?)*$/);
                if (!formatValidationError) {
                    value = value.toLowerCase();
                }
                break;
            case 'active':
                // eslint-disable-next-line no-control-regex
                formatValidationError = !value.match(/^(0|1)$/);
                if (!formatValidationError) {
                    value = value === '1';
                }
                break;
            default:
                formatValidationError = false;
                break;
            }
            if (formatValidationError) {
                return rep.sendBadRequestError(rep, 'Invalid format', {}, 3);
            }
            // Check for dupes
            // eslint-disable-next-line consistent-return
            if (noDupes.indexOf(req.body.columnId) !== -1 && userRecord[req.body.columnId] !== value) {
                const dupeQuery = {};
                dupeQuery[req.body.columnId] = value;
                const dupeRecord = await this.mongo.db.collection('users').findOne(dupeQuery);
                if (dupeRecord) {
                    return rep.sendBadRequestError(rep, 'Duplicate value');
                }
            }
            if (fastify.zoiaConfig.demo && userRecord[req.body.columnId].match(/admin/i)) {
                return rep.sendSuccessJSON(rep, {
                    value: 'admin'
                });
            }
            // Update if value mismatches
            if (userRecord[req.body.columnId] !== value) {
                const update = {};
                update[req.body.columnId] = value;
                this.mongo.db.collection('users').updateOne({
                    _id: new ObjectId(req.body.recordId)
                }, {
                    $set: update
                });
            }
            // Set 1/0 for true/false if columnId === 'active'
            if (req.body.columnId === 'active') {
                value = value ? '1' : '0';
            }
            // Send response
            return rep.sendSuccessJSON(rep, {
                value
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
