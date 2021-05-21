import ActiveDirectory from "activedirectory";
import cloneDeep from "lodash/cloneDeep";

export default class {
    constructor(config, username, password) {
        this.config = cloneDeep(config);
        this.username = username;
        this.config.activeDirectory = this.config.activeDirectory || {
            config: {}
        };
        this.config.activeDirectory.config.username = `${username}${this.config.activeDirectory.usernameSuffix}`;
        this.config.activeDirectory.config.password = password;
        this.ad = this.config.activeDirectory.enabled ? new ActiveDirectory(this.config.activeDirectory.config) : null;
    }

    getUserData() {
        return new Promise((resolve, reject) => {
            if (!this.ad) {
                reject(new Error("No AD configuration"));
            }
            this.ad.findUser(this.username, (err, user) => {
                if (err) {
                    reject(new Error(JSON.stringify(err)));
                    return;
                }
                if (!user) {
                    reject(new Error("User not found"));
                }
                resolve(user);
            });
        });
    }
}
