import fs from "fs-extra";
import path from "path";
import {
    v4 as uuid
} from "uuid";
import os from "os";
import Busboy from "busboy";

export default class {
    constructor(req) {
        this.req = req;
        this.fields = {};
        this.files = {};
    }

    saveFile(file, filePath) {
        return new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(filePath);
            file.pipe(fileStream);
            fileStream.on("finish", () => resolve());
            fileStream.on("error", () => reject());
        });
    }

    processRequest() {
        return new Promise((resolve, reject) => {
            let filesCount = 0;
            let filesProcessed = 0;
            const busboy = new Busboy({
                headers: this.req.headers
            });
            busboy.on("file", async (fieldname, file, filename, encoding, mimeType) => {
                filesCount += 1;
                const tempName = uuid();
                const filePath = path.join("..", "..", this.req.zoiaConfig.directories.tmp || os.tmpdir(), tempName);
                try {
                    await this.saveFile(file, filePath);
                    const fileStat = await fs.stat(filePath);
                    this.files[fieldname] = {
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
                            fields: this.fields,
                            files: this.files
                        });
                    }
                } catch (e) {
                    filesCount -= 1;
                    if (filesProcessed === filesCount) {
                        resolve({
                            fields: this.fields,
                            files: this.files
                        });
                    }
                }
            });
            busboy.on("field", (fieldname, val) => { // , fieldnameTruncated, valTruncated, encoding, mimetype
                this.fields[fieldname] = val;
            });
            busboy.on("error", e => reject(e));
            busboy.on("finish", () => {
                if (!filesCount) {
                    resolve({
                        fields: this.fields,
                        files: this.files
                    });
                }
            });
            this.req.raw.pipe(busboy);
        });
    }
}
