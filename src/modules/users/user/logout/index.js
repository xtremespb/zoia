export default () => ({
    async handler(req, rep) {
        return req.logout(req, rep);
    }
});
