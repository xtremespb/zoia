const axios = require("axios");
const Cookies = require("../../../../../shared/lib/cookies").default;
const C = require("../../../../../shared/lib/constants").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            progress: false,
            warnRebuild: false,
            error: null,
            status: null
        };
        this.state = state;
        this.cookieOptions = out.global.cookieOptions;
        this.siteId = out.global.siteId;
        this.i18n = out.global.i18n;
    }

    onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteId || "zoia3"}.authToken`);
    }

    onRebuildClick() {
        this.state.warnRebuild = true;
    }

    onWarnRebuildDelete() {
        this.state.warnRebuild = false;
    }

    onErrorDelete() {
        this.state.error = null;
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
            this.state.status = null;
            document.location.reload();
        } catch {
            // Ignore
        }
    }

    async sendRestartRequest() {
        try {
            await axios({
                method: "post",
                url: "/api/update/restart",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.status = this.i18n.t("processRestarting");
            this.restartInterval = setInterval(this.restartStatusCheck.bind(this), 3000);
        } catch (e) {
            this.state.progress = false;
            this.state.status = null;
            this.state.error = e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("updateRestartGeneralError");
        }
    }

    async updateStatusCheck() {
        try {
            const res = await axios({
                method: "post",
                url: "/api/update/status",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            if (res && res.data) {
                const status = res.data.status === null ? null : parseInt(res.data.status, 10);
                this.state.status = this.getStatus(status);
                if (status === C.REBUILD_STATUS_SUCCESS) {
                    clearInterval(this.statusInterval);
                    this.sendRestartRequest();
                }
            } else {
                clearInterval(this.statusInterval);
                this.state.progress = false;
                this.state.status = null;
                this.state.error = this.i18n.t("updateStatusGeneralError");
            }
        } catch (e) {
            clearInterval(this.statusInterval);
            this.state.progress = false;
            this.state.status = null;
            this.state.error = e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("updateStatusGeneralError");
        }
    }

    async onRebuildConfirmClick() {
        this.state.warnRebuild = false;
        this.state.progress = true;
        try {
            await axios({
                method: "post",
                url: "/api/update/rebuild",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
        } catch (e) {
            this.state.progress = false;
            this.state.error = e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("updateGeneralError");
            return;
        }
        this.state.status = this.getStatus();
        this.statusInterval = setInterval(this.updateStatusCheck.bind(this), 1000);
    }
};
