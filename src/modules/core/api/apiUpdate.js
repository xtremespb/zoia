import fs from "fs-extra";
import path from "path";
import axios from "axios";
import os from "os";
import extract from "extract-zip";
import {
    v4 as uuid
} from "uuid";
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
            if (!auth.statusAdmin()) {
                response.unauthorizedError();
                return;
            }
            if (!acl.checkPermission("core", "update")) {
                response.requestAccessDeniedError();
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
                let updateData;
                try {
                    updateData = (await axios({
                        method: "get",
                        url: req.zoiaConfig.update,
                    })).data;
                } catch (e) {
                    log.error(e);
                }
                if (!updateData) {
                    await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_ERROR, "Could not download update tags");
                    return;
                }
                if (this.zoiaPackageJson.version === updateData.tag_name) {
                    await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_ERROR, "Current version is up-to-date");
                    return;
                }
                const tempDir = path.resolve(`${os.tmpdir()}/${uuid()}`);
                const tempFile = `${uuid()}.zip`;
                const workingDir = path.resolve(`${__dirname}/../..`);
                const updateDir = path.resolve(`${__dirname}/../../update`);
                const srcDir = path.resolve(`${__dirname}/../../src/`);
                const currentServerScript = path.resolve(`${__dirname}/../../build/bin/zoia.js`);
                const currentTestScript = path.resolve(`${__dirname}/../../build/bin/test.js`);
                const currentCliScript = path.resolve(`${__dirname}/../../build/bin/cli.js`);
                const currentPublicDir = path.resolve(`${__dirname}/../../build/public/zoia`);
                const updateServerScript = path.resolve(`${__dirname}/../../build/bin/zoia_update.js`);
                const updateTestScript = path.resolve(`${__dirname}/../../build/bin/test_update.js`);
                const updateCliScript = path.resolve(`${__dirname}/../../build/bin/cli_update.js`);
                const updatePublicDir = path.resolve(`${__dirname}/../../build/public/update`);
                try {
                    await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_COPY_SRC_DIR);
                    // Clean up update directory
                    await fs.remove(updateDir);
                    await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_DOWNLOAD);
                    // Create update directory
                    await fs.ensureDir(tempDir);
                    // Download update file from remote repository
                    const updateFile = await axios({
                        method: "get",
                        url: updateData.zipball_url,
                        responseType: "arraybuffer"
                    });
                    // Save update file to the temporary directory
                    const archivePath = path.resolve(tempDir, tempFile);
                    await fs.writeFile(archivePath, updateFile.data);
                    // Extract update archive to the temporary directory
                    await extract(archivePath, {
                        dir: tempDir
                    });
                    // Remove update archive
                    await fs.remove(archivePath);
                    // Get update contents
                    const tempDirContents = await fs.readdir(tempDir);
                    await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_COPY_SRC_DIR);
                    // Copy "src" directory to the update directory
                    await fs.copy(path.resolve(tempDir, tempDirContents[0], "src"), updateDir);
                    // Create backup of the "package.json" file
                    await fs.copy(path.resolve(`${__dirname}/../../package.json`), path.resolve(`${__dirname}/../../package.json.bak`), {
                        overwrite: true,
                        errorOnExist: false
                    });
                    // Create backup of the "package-lock.json" file
                    await fs.copy(path.resolve(`${__dirname}/../../package-lock.json`), path.resolve(`${__dirname}/../../package-lock.json.bak`), {
                        overwrite: true,
                        errorOnExist: false
                    });
                    // Create backup of the "package-core.json" file
                    await fs.copy(path.resolve(`${__dirname}/../../package-core.json`), path.resolve(`${__dirname}/../../package-core.json.bak`), {
                        overwrite: true,
                        errorOnExist: false
                    });
                    // Copy "package.json" file to the root directory
                    await fs.copy(path.resolve(tempDir, tempDirContents[0], "package.json"), path.resolve(`${__dirname}/../../package.json`), {
                        overwrite: true,
                        errorOnExist: false
                    });
                    // Copy "package-lock.json" file to the root directory
                    await fs.copy(path.resolve(tempDir, tempDirContents[0], "package-lock.json"), path.resolve(`${__dirname}/../../package-lock.json`), {
                        overwrite: true,
                        errorOnExist: false
                    });
                    // Copy "package-core.json" file to the root directory
                    await fs.copy(path.resolve(tempDir, tempDirContents[0], "package-core.json"), path.resolve(`${__dirname}/../../package-core.json`), {
                        overwrite: true,
                        errorOnExist: false
                    });
                    await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_SUCCESS);
                    // Copy missing modules from "src/modules" to "update/modules"
                    const currentModules = (await fs.readdir(path.resolve(`${__dirname}/../../src/modules`))).filter(d => !d.match(/^\./));
                    const updateModules = (await fs.readdir(path.resolve(`${__dirname}/../../update/modules`))).filter(d => !d.match(/^\./));
                    await Promise.all(currentModules.filter(m => updateModules.indexOf(m) === -1).map(async m => {
                        await fs.copy(path.resolve(`${__dirname}/../../src/modules/${m}`), path.resolve(`${__dirname}/../../update/modules/${m}`));
                    }));
                    // Execute "npm install" to install the latest versions of NPM modules
                    await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_NPM_INSTALL);
                    await utils.execShellCommand("npm install", workingDir);
                    // Execute "npm run build-update" to build the update package
                    await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_NPM_BUILD_UPDATE);
                    await utils.execShellCommand("npm run build-update", workingDir);
                    // Check if update files are generated
                    await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_NPM_UPDATE_COPY);
                    try {
                        await fs.promises.access(updateServerScript);
                        await fs.promises.access(updatePublicDir);
                    } catch (e) {
                        log.error(e);
                        await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_ERROR, e.message);
                        return;
                    }
                    // Remove old files and directories
                    await fs.remove(srcDir);
                    await fs.rename(updateDir, srcDir);
                    await fs.rename(updateServerScript, currentServerScript);
                    await fs.rename(updateTestScript, currentTestScript);
                    await fs.rename(updateCliScript, currentCliScript);
                    await fs.remove(currentPublicDir);
                    await fs.rename(updatePublicDir, currentPublicDir);
                    await fs.remove(path.resolve(`${__dirname}/../../package.json.bak`));
                    await fs.remove(path.resolve(`${__dirname}/../../package-lock.json.bak`));
                    await fs.remove(path.resolve(`${__dirname}/../../package-core.json.bak`));
                    // Running "setup all" script
                    await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_SETUP_ALL);
                    await utils.execShellCommand("npm run setup-all", workingDir);
                    // Success
                    await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_SUCCESS);
                } catch (e) {
                    log.error(e);
                    await updateStatus(req, this.mongo.db, C.UPDATE_STATUS_ERROR, e.message);
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
