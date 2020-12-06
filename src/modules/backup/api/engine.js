import {
    v4 as uuid
} from "uuid";
import path from "path";
import fs from "fs-extra";
import archiver from "archiver";

const backupData = fs.readJSONSync(path.resolve(`${__dirname}/../etc/backup.json`));

export default class {
    constructor(db, config, zoiaConfig) {
        this.id = uuid();
        this.db = db;
        this.moduleConfig = config;
        this.modules = Object.keys(backupData);
        this.config = {};
        this.modules.map(k => this.config[k] = backupData[k]);
        this.data = {};
        this.zoiaConfig = zoiaConfig;
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
                await fs.writeJSON(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/db/${m}/${c}.json`, data);
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

    async backupCore() {
        const dirs = [`core`, `core/build`, `core/root`];
        const core = {
            etc: "etc",
            logs: "logs",
            "package.json": `root/package.json`,
            "package-lock.json": `root/package-lock.json`,
        };
        await Promise.allSettled(dirs.map(async d => fs.ensureDir(path.resolve(`${__dirname}/../../${d}`))));
        await Promise.allSettled(Object.keys(core).map(async f => fs.copy(path.resolve(`${__dirname}/../../${f}`), path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/core/${core[f]}`))));
    }

    async saveData() {
        await fs.writeJSON(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/backup.json`), this.data);
    }

    saveBackup() {
        return new Promise((resolve, reject) => {
            const destFile = path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.files}/${this.moduleConfig.directory}/${this.id}.zip`);
            const archive = archiver("zip", {
                zlib: {
                    level: 9
                }
            });
            const output = fs.createWriteStream(destFile);
            archive.pipe(output);
            const dirs = ["core", "db", "dirs"];
            dirs.map(d => archive.directory(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/${d}`), d));
            archive.file(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}/backup.json`), {
                name: "backup.json"
            });
            archive.finalize();
            output.on("close", () => {
                resolve(this.id);
            });
            archive.on("error", e => {
                reject(e);
            });
        });
    }

    async cleanUp() {
        try {
            await fs.remove(path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.tmp}/${this.id}`));
        } catch {
            // Ignore
        }
    }
}
