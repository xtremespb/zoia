import fastifyPlugin from "fastify-plugin";
import Busboy from "busboy";
import {
    PassThrough
} from "stream";
import fs from "fs-extra";
import path from "path";
import {
    v4 as uuid
} from "uuid";
import os from "os";

const kMultipart = Symbol("multipart");
// const kMultipartHandler = Symbol("multipartHandler");

const setMultipart = (req, payload, done) => {
    req.raw[kMultipart] = true;
    done();
};

const getBusboyInstance = options => {
    try {
        return new Busboy(options);
    } catch (e) {
        const errorEmitter = new PassThrough();
        process.nextTick(() => errorEmitter.emit("error", e));
        return errorEmitter;
    }
};

const fastifyMultipart = (fastify, options, done) => {
    // Function: Save file
    const saveFile = (file, filePath) => new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filePath);
        file.pipe(fileStream);
        fileStream.on("finish", () => resolve());
        fileStream.on("error", e => reject(e));
    });
    // Function: Process multipart request
    function processMultipartRequest() {
        const request = this.raw;
        return new Promise((resolve, reject) => {
            const multipartFields = {};
            const multipartFiles = {};
            let filesCount = 0;
            let filesProcessed = 0;
            // Get Busboy instance
            const busboy = getBusboyInstance({
                headers: request.headers
            });
            // Resolve Files
            const resolveFiles = async () => {
                if (filesProcessed === filesCount) {
                    resolve({
                        fields: multipartFields,
                        files: multipartFiles
                    });
                }
            };
            // onFile Handler
            const onFile = async (fieldname, file, filename, encoding, mimeType) => {
                filesCount += 1;
                const tempName = uuid();
                try {
                    const filePath = fastify.zoiaConfig.directories.tmp ? path.resolve(`${__dirname}/../../${fastify.zoiaConfig.directories.tmp}/${tempName}`) : path.join(os.tmpdir(), tempName);
                    await saveFile(file, filePath);
                    const fileStat = await fs.stat(filePath);
                    multipartFiles[fieldname] = {
                        filePath,
                        filename,
                        tempName,
                        encoding,
                        mimeType,
                        size: fileStat.size
                    };
                    filesProcessed += 1;
                    await resolveFiles();
                } catch (e) {
                    filesCount -= 1;
                    await resolveFiles();
                }
            };
            // onField Handler
            const onField = (fieldname, val) => { // , fieldnameTruncated, valTruncated, encoding, mimetype
                multipartFields[fieldname] = val;
            };
            // onError Handler
            const onError = e => reject(e);
            // Request close handler
            const cleanup = async () => {
                request.removeListener("close", cleanup);
                busboy.removeListener("field", onField);
                busboy.removeListener("file", onFile);
                busboy.removeListener("close", cleanup);
            };
            // onFinish Handler
            const onFinish = () => {
                cleanup();
                if (!filesCount) {
                    resolve({
                        fields: multipartFields,
                        files: multipartFiles
                    });
                }
            };
            busboy.on("file", onFile);
            busboy.on("field", onField);
            busboy.on("error", onError);
            busboy.on("finish", onFinish);
            busboy.on("close", cleanup);
            request.on("close", cleanup);
            request.pipe(busboy);
        });
    }
    // Remove temporary files
    const removeTemporaryFiles = async (multipartFiles = {}) => {
        await Promise.allSettled(Object.keys(multipartFiles).map(async f => {
            const file = multipartFiles[f];
            try {
                await fs.unlink(file.filePath);
            } catch {
                // Ignore
            }
        }));
    };
    // Add hanlders
    fastify.addContentTypeParser("multipart", setMultipart);
    fastify.decorateRequest("processMultipart", processMultipartRequest);
    fastify.decorateRequest("removeMultipartTempFiles", removeTemporaryFiles);
    // fastify.decorateRequest("cleanMultipartFiles", cleanMultipartFiles);
    done();
};

export default fastifyPlugin(fastifyMultipart, {
    fastify: ">= 0.39.0",
    name: "fastify-multipart"
});
