const axios = require("axios");
const Cookies = require("../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        const state = {};
        this.state = state;
        this.i18n = out.global.i18n;
        this.cookieOptions = out.global.cookieOptions;
        this.siteId = out.global.siteId;
    }

    onMount() {
        this.spinner = this.getComponent("z3_ap_ad_spinner");
        this.statusDialog = this.getComponent("z3_ap_ad_status");
        this.notify = this.getComponent("z3_ap_ad_mnotify");
        this.restartConfirm = this.getComponent("z3_ap_ad_restartConfirm");
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteId || "zoia3"}.authToken`);
    }

    onRestartClick() {
        this.restartConfirm.func.setActive(true, this.i18n.t("restartTitle"), this.i18n.t("restartMessage"));
    }

    async restartStatusCheck() {
        try {
            await axios({
                method: "get",
                url: "/api/core/alive"
            });
            clearInterval(this.restartInterval);
            this.statusDialog.setActive(false);
            this.notify.func.show(this.i18n.t("restartSuccess"), "is-success");
        } catch {
            // Ignore
        }
    }

    async onRestartConfirm() {
        this.spinner.func.setActive(true);
        try {
            await axios({
                method: "post",
                url: "/api/core/restart",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.spinner.func.setActive(false);
            this.restartInterval = setInterval(this.restartStatusCheck.bind(this), 3000);
            this.statusDialog.setActive(true, this.i18n.t("processRestarting"));
        } catch (e) {
            this.spinner.func.setActive(false);
            const error = e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotRestart");
            this.notify.func.show(error, "is-danger");
        }
    }
};
