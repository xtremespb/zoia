import cloneDeep from "lodash/cloneDeep";

export default class {
    constructor(fastify) {
        this.fastify = fastify;
        this.corePermissionsList = ["upload", "tableSettings"];
        this.groups = [];
        this.permissions = {};
        this.corePermissions = {};
        this.corePermissionsList.map(p => this.corePermissions[p] = false);
        this.whitelist = {};
        this.blacklist = {};
        this.zoiaModules = cloneDeep(fastify.zoiaModules);
        this.zoiaModules.push({
            id: "imagesBrowser"
        });
        this.zoiaModules.map(m => {
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
        if (!this.fastify.zoiaModulesConfig["users"]) {
            this.allowEverything();
            return;
        }
        try {
            if (!groups || !groups.length) {
                this.allowEverything();
                return;
            }
            const groupsDb = await this.fastify.mongo.db.collection(this.fastify.zoiaModulesConfig["users"].collectionAcl).find({
                $or: groups.map(g => ({
                    group: g
                }))
            }).toArray();
            if (groupsDb.length) {
                this.zoiaModules.map(m => {
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
                groupsDb.map(group => {
                    (group.corePermissions || []).map(p => this.corePermissions[p] = true);
                });
            } else {
                this.allowEverything();
            }
            if (this.permissions["users"]) {
                this.permissions["acl"] = this.permissions["users"];
            }
        } catch {
            // Ignore
        }
    }

    allowEverything() {
        this.zoiaModules.map(m => {
            // Everything is allowed by default
            this.permissions[m.id] = {
                create: true,
                read: true,
                update: true,
                delete: true,
            };
            this.whitelist[m.id] = [];
            this.blacklist[m.id] = [];
        });
        this.corePermissionsList.map(p => this.corePermissions[p] = true);
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

    checkCorePermission(permission) {
        return this.corePermissions[permission] || false;
    }
}
