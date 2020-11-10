const axios = require("axios");
const Cookies = require("../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            loading: false,
            error: null
        };
        this.state = state;
        this.i18n = out.global.i18n;
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
    }

    onMount() {
        this.notify = this.getComponent("z3_ap_ad_mnotify");
        this.restartConfirm = this.getComponent("z3_ap_ad_restartConfirm");
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
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
            this.state.loading = false;
            this.notify.func.show(this.i18n.t("restartSuccess"), "is-success");
        } catch {
            // Ignore
        }
    }

    async onRestartConfirm() {
        this.state.loading = true;
        this.state.error = null;
        try {
            await axios({
                method: "post",
                url: "/api/admin/restart",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.restartInterval = setInterval(this.restartStatusCheck.bind(this), 3000);
        } catch (e) {
            this.state.loading = false;
            this.state.error = e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotRestart");
        }
    }
};
