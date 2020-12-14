import fs from "fs-extra";
import path from "path";
import C from "../../../shared/lib/constants";
import utils from "../../../shared/lib/utils";

const updateStatus = async (req, db, status, error = null) => db.collection(req.zoiaConfig.collections.registry).updateOne({
    _id: "update"
}, {
    $set: {
        status,
        error
    }
}, {
    upsert: true
});

export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl
        } = req.zoia;
        try {
            // Check permissions
            if (!auth.checkStatus("admin")) {
                response.unauthorizedError();
                return;
            }
            if (!acl.checkPermission("core", "update")) {
                response.requestError({
                    failed: true,
                    error: "Access Denied",
                    errorKeyword: "accessDenied",
                    errorData: []
                });
                return;
            }
            const registry = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "update"
            });
            if (registry && registry.status > 0) {
                response.requestError({
                    failed: true,
                    error: "Update is in progress",
                    errorKeyword: "updateInProgress",
                    errorData: []
                });
                return;
            }
            setTimeout(async () => {
                const workingDir = path.resolve(`${__dirname}/../..`);
                const srcDir = path.resolve(`${__dirname}/../../src`);
                const updateDir = path.resolve(`${__dirname}/../../update`);
                const currentServerScript = path.resolve(`${__dirname}/../../build/bin/zoia.js`);
                const currentTestScript = path.resolve(`${__dirname}/../../build/bin/test.js`);
                const currentCliScript = path.resolve(`${__dirname}/../../build/bin/cli.js`);
                const currentPublicDir = path.resolve(`${__dirname}/../../build/public/zoia`);
                const updateServerScript = path.resolve(`${__dirname}/../../build/bin/zoia_update.js`);
                const updateTestScript = path.resolve(`${__dirname}/../../build/bin/test_update.js`);
                const updateCliScript = path.resolve(`${__dirname}/../../build/bin/cli_update.js`);
                const updatePublicDir = path.resolve(`${__dirname}/../../build/public/update`);
                try {
                    await updateStatus(req, this.mongo.db, C.REBUILD_STATUS_COPY_SRC_DIR);
                    // Check if update directory exists
                    try {
                        await fs.promises.access(updateDir);
                    } catch {
                        // Update directory doesn't exists, let's copy it from "src" directory
                        try {
                            // Check if "src" directory exists
                            await fs.promises.access(srcDir);
                            // Copy "src" directory to "update" directory
                            await fs.copy(srcDir, updateDir);
                        } catch (e) {
                            // The "src" directory doesn't exists or copy error
                            log.error(e);
                            await updateStatus(req, this.mongo.db, C.REBUILD_STATUS_ERROR, e.message);
                            return;
                        }
                    }
                    // Check for modules which are missing in "update" directory but do exist in the current installation
                    const currentModules = (await fs.readdir(path.resolve(`${__dirname}/../../src/modules`))).filter(d => !d.match(/^\./));
                    const updateModules = (await fs.readdir(path.resolve(`${__dirname}/../../update/modules`))).filter(d => !d.match(/^\./));
                    await Promise.all(currentModules.filter(m => updateModules.indexOf(m) === -1).map(async m => {
                        await fs.copy(path.resolve(`${__dirname}/../../src/modules/${m}`), path.resolve(`${__dirname}/../../update/modules/${m}`));
                    }));
                    // Execute "npm install" to install the latest versions of NPM modules
                    await updateStatus(req, this.mongo.db, C.REBUILD_STATUS_NPM_INSTALL);
                    await utils.execShellCommand("npm install", workingDir);
                    // Execute "npm run build-update" to build the update package
                    await updateStatus(req, this.mongo.db, C.REBUILD_STATUS_NPM_BUILD_UPDATE);
                    await utils.execShellCommand("npm run build-update", workingDir);
                    // Check if update files are generated
                    await updateStatus(req, this.mongo.db, C.REBUILD_STATUS_NPM_UPDATE_COPY);
                    try {
                        await fs.promises.access(updateServerScript);
                        await fs.promises.access(updatePublicDir);
                    } catch (e) {
                        log.error(e);
                        await updateStatus(req, this.mongo.db, C.REBUILD_STATUS_ERROR, e.message);
                        return;
                    }
                    // Remove old files and directories
                    await fs.remove(updateDir);
                    await fs.rename(updateServerScript, currentServerScript);
                    await fs.rename(updateTestScript, currentTestScript);
                    await fs.rename(updateCliScript, currentCliScript);
                    await fs.remove(currentPublicDir);
                    await fs.rename(updatePublicDir, currentPublicDir);
                    // Running "setup all" script
                    await updateStatus(req, this.mongo.db, C.REBUILD_STATUS_SETUP_ALL);
                    await utils.execShellCommand("npm run setup-all", workingDir);
                    // Success
                    await updateStatus(req, this.mongo.db, C.REBUILD_STATUS_SUCCESS);
                } catch (e) {
                    log.error(e);
                    await updateStatus(req, this.mongo.db, C.REBUILD_STATUS_ERROR, e.message);
                }
            }, 10);
            response.successJSON();
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
