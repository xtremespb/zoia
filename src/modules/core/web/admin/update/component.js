const axios = require("axios");
const Cookies = require("../../../../../shared/lib/cookies").default;
const C = require("../../../../../shared/lib/constants").default;

module.exports = class {
    onCreate(input, out) {
        const state = {};
        this.state = state;
        this.i18n = out.global.i18n;
        this.cookieOptions = out.global.cookieOptions;
        this.siteId = out.global.siteId;
        this.updateStatus = out.global.updateStatus;
    }

    onMount() {
        this.spinner = this.getComponent("z3_ap_ad_spinner");
        this.statusDialog = this.getComponent("z3_ap_ad_status");
        this.notify = this.getComponent("z3_ap_ad_mnotify");
        this.updateConfirm = this.getComponent("z3_ap_ad_updateConfirm");
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteId || "zoia3"}.authToken`);
        if (this.updateStatus && this.updateStatus > -1) {
            this.statusDialog.func.setActive(true, this.getStatus(this.updateStatus));
            this.statusInterval = setInterval(this.updateStatusCheck.bind(this), 1000);
        }
    }

    onUpdateClick() {
        this.updateConfirm.func.setActive(true, this.i18n.t("update"), this.i18n.t("warnUpdateText"));
    }

    getStatus(code) {
        switch (code) {
        case C.REBUILD_STATUS_COPY_SRC_DIR:
            return this.i18n.t("processCopyFiles");
        case C.REBUILD_STATUS_NPM_INSTALL:
            return this.i18n.t("processInstallNPM");
        case C.REBUILD_STATUS_NPM_BUILD_UPDATE:
            return this.i18n.t("processBuildUpdate");
        case C.REBUILD_STATUS_NPM_UPDATE_COPY:
            return this.i18n.t("processUpdateCopy");
        case C.REBUILD_STATUS_SUCCESS:
            return this.i18n.t("processSuccess");
        case C.REBUILD_STATUS_ERROR:
            return this.i18n.t("processError");
        case C.REBUILD_STATUS_SETUP_ALL:
            return this.i18n.t("setupAll");
        default:
            return this.i18n.t("processStarted");
        }
    }

    async restartStatusCheck() {
        try {
            await axios({
                method: "get",
                url: "/api/core/alive"
            });
            clearInterval(this.restartInterval);
            this.statusDialog.func.setActive(false);
            this.spinner.func.setActive(true);
            document.location.reload();
        } catch {
            // Ignore
        }
    }

    async sendRestartRequest() {
        try {
            await axios({
                method: "post",
                url: "/api/core/update/restart",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.statusDialog.func.setActive(true, this.i18n.t("processRestarting"));
            this.restartInterval = setInterval(this.restartStatusCheck.bind(this), 3000);
        } catch (e) {
            this.spinner.func.setActive(false);
            const error = e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("updateRestartGeneralError");
            this.notify.func.show(error, "is-danger");
        }
    }

    async updateStatusCheck() {
        try {
            const res = await axios({
                method: "post",
                url: "/api/core/update/status",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            if (res && res.data) {
                const status = res.data.status === null ? null : parseInt(res.data.status, 10);
                this.statusDialog.func.setActive(true, this.getStatus(status));
                if (status === C.REBUILD_STATUS_SUCCESS) {
                    clearInterval(this.statusInterval);
                    this.sendRestartRequest();
                }
                if (status === C.REBUILD_STATUS_ERROR) {
                    clearInterval(this.statusInterval);
                    this.statusDialog.func.setActive(false);
                    this.notify.func.show(this.i18n.t("processError"), "is-danger");
                }
            } else {
                clearInterval(this.statusInterval);
                this.statusDialog.func.setActive(false);
                this.notify.func.show(this.i18n.t("updateStatusGeneralError"), "is-danger");
            }
        } catch (e) {
            clearInterval(this.statusInterval);
            this.statusDialog.func.setActive(false);
            const error = e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("updateStatusGeneralError");
            this.notify.func.show(error, "is-danger");
        }
    }

    async onUpdateConfirm() {
        this.spinner.func.setActive(true);
        try {
            await axios({
                method: "post",
                url: "/api/core/update/start",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.spinner.func.setActive(false);
            this.statusInterval = setInterval(this.updateStatusCheck.bind(this), 1000);
            this.statusDialog.setActive(true, this.i18n.t("processStarted"));
        } catch (e) {
            this.spinner.func.setActive(false);
            const error = e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("processError");
            this.notify.func.show(error, "is-danger");
        }
    }
};
