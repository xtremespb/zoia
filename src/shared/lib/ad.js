import ActiveDirectory from "activedirectory";
import cloneDeep from "lodash/cloneDeep";

export default class {
    constructor(config, username, password) {
        this.username = username;
        const activeDirectory = config.activeDirectory ? cloneDeep(config.activeDirectory) : {};
        if (activeDirectory.enabled) {
            this.ad = [];
            config.activeDirectory.directories.map(adItem => {
                adItem.config.username = `${adItem.usernamePrefix || ""}${username}${adItem.usernameSuffix || ""}`.replace(/\\\\/g, "\\");
                adItem.config.password = password;
                const adInst = activeDirectory.enabled ? new ActiveDirectory(adItem.config) : null;
                this.ad.push(adInst);
            });
        }
    }

    findUser(ad) {
        return new Promise((resolve, reject) => {
            ad.findUser(this.username, (err, user) => {
                if (!err && user) {
                    resolve(user);
                }
                reject(new Error("User not found"));
            });
        });
    }

    async getUserData() {
        if (!this.ad || !this.ad.length) {
            throw new Error("No AD configuration");
        }
        for (const ad of this.ad) {
            try {
                const userData = await this.findUser(ad);
                if (userData) {
                    return userData;
                }
            } catch (e) {
                // Ignore
            }
        }
        throw new Error("User not found");
    }
}
