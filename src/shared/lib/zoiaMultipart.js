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
            const fields = {};
            const files = {};
            let filesCount = 0;
            let filesProcessed = 0;
            const busboy = getBusboyInstance({
                headers: request.headers
            });
            busboy.on("file", async (fieldname, file, filename, encoding, mimeType) => {
                filesCount += 1;
                const tempName = uuid();
                try {
                    const filePath = fastify.zoiaConfig.directories.tmp ? path.join("..", "..", fastify.zoiaConfig.directories.tmp, tempName) : path.join(os.tmpdir(), tempName);
                    await saveFile(file, filePath);
                    const fileStat = await fs.stat(filePath);
                    files[fieldname] = {
                        filePath,
                        filename,
                        tempName,
                        encoding,
                        mimeType,
                        size: fileStat.size
                    };
                    filesProcessed += 1;
                    if (filesProcessed === filesCount) {
                        resolve({
                            fields,
                            files
                        });
                    }
                } catch (e) {
                    filesCount -= 1;
                    if (filesProcessed === filesCount) {
                        resolve({
                            fields,
                            files
                        });
                    }
                }
            });
            busboy.on("field", (fieldname, val) => { // , fieldnameTruncated, valTruncated, encoding, mimetype
                fields[fieldname] = val;
            });
            busboy.on("error", e => reject(e));
            busboy.on("finish", () => {
                if (!filesCount) {
                    resolve({
                        fields,
                        files
                    });
                }
            });
            request.pipe(busboy);
        });
    }
    fastify.addContentTypeParser("multipart", setMultipart);
    fastify.decorateRequest("processMultipart", processMultipartRequest);
    done();
};

export default fastifyPlugin(fastifyMultipart, {
    fastify: ">= 0.39.0",
    name: "fastify-multipart"
});
