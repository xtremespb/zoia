import {
    ObjectId
} from "mongodb";
import sendToWormhole from "stream-wormhole";
import minify from "@node-minify/core";
import csso from "@node-minify/csso";
import terser from "@node-minify/terser";
import htmlMinifier from "@node-minify/html-minifier";
import Auth from "../../../shared/lib/auth";
import utils from "../../../shared/lib/utils";
import pageEdit from "./data/pageEdit.json";
import C from "../../../shared/lib/constants";

export default () => ({
    attachValidation: false,
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            rep.unauthorizedError(rep);
            return;
        }
        console.log("WE ARE IN!");
        const data = req.files();
        console.log(data);
        // eslint-disable-next-line no-restricted-syntax
        for await (const part of data) {
            if (part.file) {
                part.toBuffer();
                await sendToWormhole(part.file);
            }
            delete part.fields;
        }
        console.log("O U T !!! ==-=-=-=-=-=-=-=-=-=-=-=-==");
        // Initialize validator
        const extendedValidation = new req.ExtendedValidation(req.body, pageEdit.root, pageEdit.part, pageEdit.files, Object.keys(req.zoiaConfig.languages));
        // Perform validation
        const extendedValidationResult = await extendedValidation.validate();
        // Check if there are any validation errors
        if (extendedValidationResult.failed) {
            rep.logError(req, extendedValidationResult.message);
            rep.validationError(rep, extendedValidationResult);
            return;
        }
        // Get ID from body
        const bodyId = req.body.id ? await req.body.id.value : null;
        const id = bodyId && typeof bodyId === "string" && bodyId.match(/^[a-f0-9]{24}$/) ? bodyId : undefined;
        try {
            // Get data from form body
            const dataRaw = await extendedValidation.getData();
            const data = extendedValidation.filterDataFiles(dataRaw);
            // Get files from body
            const uploadFiles = await extendedValidation.getFiles();
            // Delete files which are removed
            if (id) {
                const dbItem = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).findOne({
                    _id: new ObjectId(id)
                });
                await utils.cleanRemovedFiles(req, this.mongo.db, extendedValidation, dbItem, data);
            }
            // Upload files
            if (uploadFiles && uploadFiles.length && !(await utils.saveFiles(req, rep, this.mongo.db, uploadFiles))) {
                return;
            }
            // Process case and trim
            data.filename = data.filename && typeof data.filename === "string" ? data.filename.trim().toLowerCase() : "";
            // Compute paths
            // ...
            // Check for path duplicates
            if (await rep.checkDatabaseDuplicates(rep, this.mongo.db, req.zoiaModulesConfig["pages"].collectionPages, {
                    dir: data.dir,
                    filename: data.filename,
                    _id: {
                        $ne: id ? new ObjectId(id) : null
                    }
                }, "pathAlreadyExists", "path")) {
                return;
            }
            const updateExtras = {};
            // Set createdAt timestamp if that's a new record
            if (!id) {
                updateExtras.createdAt = new Date();
            }
            // Compile contents
            await Promise.allSettled(Object.keys(req.zoiaConfig.languages).map(async k => {
                if (!data[k]) {
                    data[k] = undefined;
                } else {
                    data[k].contentMin = data[k].content;
                    data[k].cssMin = data[k].css;
                    data[k].jsMin = data[k].js;
                    try {
                        data[k].contentMin = await minify({
                            compressor: htmlMinifier,
                            options: {
                                removeAttributeQuotes: true,
                                collapseWhitespace: true,
                                html5: true
                            },
                            content: data[k].content
                        });
                        data[k].cssMin = await minify({
                            compressor: csso,
                            content: data[k].css
                        });
                        data[k].jsMin = await minify({
                            compressor: terser,
                            content: data[k].js
                        });
                    } catch {
                        // Ignore
                    }
                }
            }));
            // Update database
            const update = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).updateOne(id ? {
                _id: new ObjectId(id)
            } : {
                dir: data.dir,
                filename: data.filename,
            }, {
                $set: {
                    ...data,
                    modifiedAt: new Date(),
                    ...updateExtras
                }
            }, {
                upsert: true
            });
            // Check result
            if (!update || !update.result || !update.result.ok) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Database error",
                    errorKeyword: "databaseError",
                    errorData: []
                });
                return;
            }
            // Return "success" result
            rep.successJSON(rep);
            return;
        } catch (e) {
            // There is an exception, send error 500 as response
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
