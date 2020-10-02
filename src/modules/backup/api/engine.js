import {
    v4 as uuid
} from "uuid";
import path from "path";
import fs from "fs-extra";

const backupData = fs.readJSONSync(path.resolve(`${__dirname}/../etc/backup.json`));

export default class {
    constructor(db) {
        this.id = uuid();
        this.db = db;
        this.config = {};
        this.modules = Object.keys(backupData);
        this.modules.map(k => this.config[k] = backupData[k]);
        this.data = {};
    }

    async backupCollections() {
        await Promise.allSettled(this.modules.map(async m => {
            this.data[m] = this.data[m] || {};
            this.data[m].db = [];
            await fs.ensureDir(path.resolve(`${__dirname}/../../tmp/backup/${this.id}/db/${m}`));
            const {
                collections
            } = this.config[m];
            await Promise.allSettled(collections.map(async c => {
                const data = await this.db.collection(c).find({}).toArray();
                await fs.writeJSON(`${__dirname}/../../tmp/backup/${this.id}/db/${m}/${c}.json`, data);
                this.data[m].db.push(c);
            }));
        }));
    }

    async backupDirs() {
        const dest = path.resolve(`${__dirname}/../../tmp/backup/${this.id}/dirs`);
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
            "build/public/zoia": `zoia`,
            "build/etc": `build/etc`,
            "build/bin": `bin`,
            "package.json": `root/package.json`,
            "package-lock.json": `root/package-lock.json`,
        };
        await Promise.allSettled(dirs.map(async d => fs.ensureDir(path.resolve(`${__dirname}/../../${d}`))));
        await Promise.allSettled(Object.keys(core).map(async f => fs.copy(path.resolve(`${__dirname}/../../${f}`), path.resolve(`${__dirname}/../../tmp/backup/${this.id}/core/${core[f]}`))));
    }

    async pack() {
        await fs.writeJSON(path.resolve(`${__dirname}/../../tmp/backup/${this.id}/backup.json`), this.data);
    }
}
