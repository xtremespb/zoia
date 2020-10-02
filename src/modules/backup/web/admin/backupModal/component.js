const axios = require("axios");
const Cookies = require("../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            active: false,
            loading: false,
            running: false,
            error: null

        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
        };
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
        this.i18n = out.global.i18n;
    }

    onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
    }

    setActive(state) {
        this.state.error = false;
        this.state.loading = false;
        this.state.running = false;
        this.state.active = state;
    }

    onCloseClick() {
        if (this.state.loading || this.state.running) {
            return;
        }
        this.setActive(false);
    }

    async checkStatus() {
        try {
            this.state.loading = true;
            const res = await axios({
                method: "post",
                url: "/api/backup/status",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            if (res && res.data && res.data.backup) {
                if (res.data.backup.running) {
                    setTimeout(this.checkStatus.bind(this), 1000);
                    return;
                }
                if (res.data.backup.complete) {
                    this.setActive(false);
                    this.emit("backup-finish");
                    return;
                }
            }
            this.state.running = false;
            this.state.error = res && res.data && res.data.backup && res && res.data && res.data.backup.errorKeyword ? this.i18n.t(res.data.backup.errorKeyword) : this.i18n.t("couldNotBackup");
        } catch (e) {
            this.state.loading = false;
            this.state.running = false;
            const errorText = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("serverError");
            this.state.error = errorText;
        }
    }

    async onConfirmClick() {
        if (this.state.loading || this.state.running) {
            return;
        }
        this.state.error = null;
        try {
            this.state.loading = true;
            await axios({
                method: "post",
                url: "/api/backup/start",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            this.state.running = true;
            setTimeout(this.checkStatus.bind(this), 1000);
        } catch (e) {
            this.state.loading = false;
            const errorText = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("serverError");
            this.state.error = errorText;
        }
    }
};
