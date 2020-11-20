const axios = require("axios");
const Cookies = require("../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            loading: false,
        };
        this.state = state;
        this.i18n = out.global.i18n;
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
    }

    onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
        this.spinner = this.getComponent("z3_mnt_spinner");
        this.notify = this.getComponent("z3_mnt_notify");
    }

    async onMaintenanceChange(e) {
        const status = e.target.checked;
        this.prevStatus = !status;
        this.spinner.func.setActive(true);
        try {
            await axios({
                method: "post",
                url: "/api/core/maintenance",
                data: {
                    status,
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.notify.func.show(this.i18n.t("maintenanceChanged"), "is-success");
            this.spinner.func.setActive(false);
        } catch {
            this.notify.func.show(this.i18n.t("couldNotSwitchMaintenance"), "is-danger");
            document.getElementById("switchMaintenance").checked = this.prevStatus;
            this.spinner.func.setActive(false);
        }
    }
};
