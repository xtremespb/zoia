import auth from './auth';
import logout from './logout';
import register from './register';
import activate from './activate';
import reset from './reset';
import resetConfirm from './resetConfirm';

export default fastify => {
    fastify.get('/users/auth', auth(fastify));
    fastify.get('/:language/users/auth', auth(fastify));
    fastify.get('/users/register', register(fastify));
    fastify.get('/:language/users/register', register(fastify));
    fastify.get('/users/logout', logout(fastify));
    fastify.get('/:language/users/logout', logout(fastify));
    fastify.get('/users/activate', activate(fastify));
    fastify.get('/:language/users/activate', activate(fastify));
    fastify.get('/users/reset', reset(fastify));
    fastify.get('/:language/users/reset', reset(fastify));
    fastify.get('/users/resetConfirm', resetConfirm(fastify));
    fastify.get('/:language/users/resetConfirm', resetConfirm(fastify));
};
