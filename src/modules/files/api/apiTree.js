import path from "path";
import fs from "fs-extra";
import utils from "../../../shared/lib/utils";

const recursiveReadDir = async (root, tree = {
    id: "/",
    c: []
}) => {
    const files = (await fs.readdir(root)).filter(i => i !== "node_modules" && !i.match(/^\./));
    await Promise.all(files.map(async f => {
        const dir = path.resolve(`${root}/${f}`);
        const stats = await fs.lstat(path.resolve(`${root}/${f}`));
        if (stats.isDirectory()) {
            const data = {};
            data.id = f;
            data.c = [];
            const res = await recursiveReadDir(dir, data);
            if (res.c && !res.c.length) {
                delete res.c;
            }
            tree.c.push(res);
        }
    }));
    if (tree.c) {
        tree.c = tree.c.sort(utils.sortById);
        if (!tree.c.length) {
            delete tree.c;
        }
    }
    return tree;
};

export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl,
        } = req.zoia;
        const root = path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}`).replace(/\\/gm, "/");
        try {
            // Check permissions
            if (!auth.statusAdmin()) {
                response.unauthorizedError();
                return;
            }
            if (!acl.checkPermission("files", "read")) {
                response.requestAccessDeniedError();
                return;
            }
            // Read directory tree
            const tree = await recursiveReadDir(root);
            // Send result
            response.successJSON({
                tree
            });
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
