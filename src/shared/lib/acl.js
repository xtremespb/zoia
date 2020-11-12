export default class {
    constructor(fastify) {
        this.fastify = fastify;
        this.groups = [];
        this.permissions = {};
        this.whitelist = {};
        this.blacklist = {};
        this.fastify.zoiaModules.map(m => {
            this.permissions[m.id] = {
                create: false,
                read: false,
                update: false,
                delete: false,
            };
            this.whitelist[m.id] = [];
            this.blacklist[m.id] = [];
        });
    }

    async initGroups(groups) {
        if (!this.fastify.zoiaModulesConfig["acl"]) {
            return;
        }
        try {
            const groupsDb = await this.fastify.mongo.db.collection(this.fastify.zoiaModulesConfig["acl"].collectionAcl).find({
                $or: groups.map(g => ({
                    group: g
                }))
            }).toArray();
            this.fastify.zoiaModules.map(m => {
                groupsDb.map(group => {
                    if (group[`${m.id}_access`]) {
                        this.permissions[m.id].create = group[`${m.id}_access`].indexOf("create") > -1 || this.permissions[m.id].create;
                        this.permissions[m.id].read = group[`${m.id}_access`].indexOf("read") > -1 || this.permissions[m.id].read;
                        this.permissions[m.id].update = group[`${m.id}_access`].indexOf("update") > -1 || this.permissions[m.id].update;
                        this.permissions[m.id].delete = group[`${m.id}_access`].indexOf("delete") > -1 || this.permissions[m.id].delete;
                    }
                    if (group[`${m.id}_whitelist`]) {
                        this.whitelist[m.id] = Array.from(new Set([...this.whitelist[m.id], ...group[`${m.id}_whitelist`]]));
                    }
                    if (group[`${m.id}_blacklist`]) {
                        this.blacklist[m.id] = Array.from(new Set([...this.blacklist[m.id], ...group[`${m.id}_blacklist`]]));
                    }
                });
            });
        } catch {
            // Ignore
        }
    }

    checkPermission(module, mode, id) {
        if (!module) {
            return false;
        }
        if (id && this.whitelist[module].indexOf(id) > -1) {
            return true;
        }
        if (this.permissions[module] && this.permissions[module][mode]) {
            if (id && this.blacklist[module].indexOf(id) > -1) {
                return false;
            }
            return true;
        }
        return false;
    }
}
