import {
    v4 as uuid
} from "uuid";
import path from "path";
import fs from "fs-extra";
import archiver from "archiver";
import {
    ObjectId
} from "mongodb";

const backupData = fs.readJSONSync(path.resolve(`${__dirname}/../etc/backup.json`));

export default class {
    constructor(db, config, zoiaConfig, fastify) {
        this.id = uuid();
        this.db = db;
        this.moduleConfig = config;
        this.modules = Object.keys(backupData);
        this.config = {};
        this.modules.map(k => this.config[k] = backupData[k]);
        this.data = {};
        this.zoiaConfig = zoiaConfig;
        this.fastify = fastify;
    }

    async backupCollections() {
        await Promise.allSettled(this.modules.map(async m => {
            this.data[m] = this.data[m] || {};
            this.data[m].db = [];
            await fs.ensureDir(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/db/${m}`));
            const {
                collections
            } = this.config[m];
            await Promise.allSettled(collections.map(async c => {
                const data = await this.db.collection(c).find({}).toArray();
                const types = {};
                if (data && data.length) {
                    Object.keys(data[0]).map(i => {
                        const val = data[0][i];
                        if (val instanceof ObjectId) {
                            types[i] = "objectid";
                        } else if (val instanceof Date) {
                            types[i] = "date";
                        } else {
                            types[i] = typeof val;
                        }
                    });
                }
                await fs.writeJSON(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/db/${m}/${c}.json`, {
                    types,
                    data
                });
                this.data[m].db.push(c);
            }));
        }));
    }

    async backupDirs() {
        const dest = path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/dirs`);
        await fs.ensureDir(dest);
        await Promise.allSettled(this.modules.map(async m => {
            this.data[m] = this.data[m] || {};
            this.data[m].dirs = {};
            const {
                dirs
            } = this.config[m];
            await Promise.allSettled(dirs.map(async d => {
                const id = uuid();
                await fs.copy(path.resolve(`${__dirname}/../../${d}`), path.join(dest, id));
                this.data[m].dirs[id] = d;
            }));
        }));
    }

    async backupDataDir() {
        try {
            const dataSubDirs = (await fs.readdir(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.files}`))).filter(d => d !== this.moduleConfig.directory);
            await fs.ensureDir(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/data`));
            await Promise.allSettled(dataSubDirs.map(async d => {
                try {
                    await fs.copy(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.files}/${d}`), path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/data/${d}`));
                } catch {
                    // Ignore
                }
            }));
        } catch {
            // Ignore
        }
    }

    async backupCore() {
        const dirs = [`core`, `core/root`];
        const core = {
            src: "src",
            etc: "etc",
            logs: "logs",
            "package.json": `root/package.json`,
            "package-lock.json": `root/package-lock.json`,
            "build/bin": `build/bin`,
            "build/etc": `build/etc`,
            "build/mail": `build/mail`,
            "build/public": `build/public`,
            "build/scripts": `build/scripts`,
        };
        await Promise.allSettled(dirs.map(async d => fs.ensureDir(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/${d}`))));
        await Promise.allSettled(Object.keys(core).map(async f => {
            try {
                await fs.copy(path.resolve(`${__dirname}/../../${f}`), path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/core/${core[f]}`));
            } catch {
                // Ignore
            }
        }));
    }

    async saveData() {
        const meta = {
            build: this.fastify.zoiaBuildJson,
            date: new Date(),
            modules: this.modules,
            api: 1,
        };
        await fs.writeJSON(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/backup.json`), this.data);
        await fs.writeJSON(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/meta.json`), meta);
    }

    saveBackup() {
        return new Promise((resolve, reject) => {
            try {
                const destFile = path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.files}/${this.moduleConfig.directory}/${this.id}.zip`);
                const archive = archiver("zip", {
                    zlib: {
                        level: 9
                    }
                });
                const output = fs.createWriteStream(destFile);
                output.on("error", e => {
                    reject(e);
                });
                archive.pipe(output);
                const dirs = ["core", "db", "dirs", "data"];
                dirs.map(d => archive.directory(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/${d}`), d));
                archive.file(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/backup.json`), {
                    name: "backup.json"
                });
                archive.file(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/meta.json`), {
                    name: "meta.json"
                });
                output.on("close", () => {
                    resolve(this.id);
                });
                archive.on("error", e => {
                    reject(e);
                });
                archive.finalize();
            } catch (e) {
                reject(e);
            }
        });
    }

    async cleanUp() {
        try {
            // await fs.remove(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}`));
        } catch {
            // Ignore
        }
    }
}
