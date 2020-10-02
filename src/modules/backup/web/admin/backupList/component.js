const axios = require("axios");
const Cookies = require("../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        this.state = {
            processValue: null,
            backupDb: out.global.backupDb || {},
            loading: false
        };
        this.i18n = out.global.i18n;
        this.language = out.global.language;
        this.routes = out.global.routes;
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
        this.i18n = out.global.i18n;
    }

    onMount() {
        this.state.processValue = (id, value) => value;
        this.backupModal = this.getComponent("z3_ap_backupModal");
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
        this.notify = this.getComponent("backupList_mnotify");
        if (this.state.backupDb.running) {
            setTimeout(this.checkStatus.bind(this), 1000);
        }
    }

    async checkStatus() {
        try {
            const res = await axios({
                method: "post",
                url: "/api/backup/status",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            if (res && res.data && res.data.backup) {
                if (res.data.backup.running) {
                    setTimeout(this.checkStatus.bind(this), 1000);
                    return;
                }
                if (res.data.backup.complete) {
                    this.state.backupDb.running = false;
                    await this.onBackupFinish();
                    return;
                }
            }
            this.state.backupDb.running = false;
            this.state.error = res && res.data && res.data.backup && res && res.data && res.data.backup.errorKeyword ? this.i18n.t(res.data.backup.errorKeyword) : this.i18n.t("couldNotBackup");
        } catch (e) {
            const errorText = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("serverError");
            this.notify.func.show(this.i18n.t(errorText), "is-danger");
        }
    }

    onActionClick(data) {
        switch (data.action) {
        case "btnEdit":
            break;
        }
    }

    onTopButtonClick(data) {
        switch (data.button) {
        case "btnReload":
            this.getComponent("backupTable").func.dataRequest();
            break;
        case "btnAdd":
            this.backupModal.func.setActive(true);
            break;
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }

    async onAbortBackup() {
        if (this.state.loading) {
            return;
        }
        try {
            this.state.loading = true;
            await axios({
                method: "post",
                url: "/api/backup/abort",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            this.state.backupDb.running = false;
            this.notify.func.show(this.i18n.t("operationSuccess"), "is-success");
        } catch (e) {
            this.state.loading = false;
            const errorText = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("serverError");
            this.notify.func.show(this.i18n.t(errorText), "is-danger");
        }
    }

    async onBackupFinish() {
        await this.getComponent("backupTable").func.dataRequest();
        this.notify.func.show(this.i18n.t("operationSuccess"), "is-success");
    }
};
