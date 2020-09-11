const axios = require("axios");
const Cookies = require("../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            files: [],
            selected: null,
            loading: false,
            dir: "",
            error: null,
        };
        this.state = state;
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
        this.i18n = out.global.i18n;
    }

    onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
        this.loadFiles();
    }

    async loadFiles(dir = this.state.dir) {
        this.state.loading = true;
        try {
            const res = await axios({
                method: "post",
                url: "/api/core/images/list",
                data: {
                    dir
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            this.state.files = res.data.files || [];
        } catch (e) {
            this.state.loading = false;
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer");
        }
    }

    onErrorDeleteClick() {
        this.state.error = null;
    }

    onBrowserItemsClick(e) {
        if (e.target.parentNode && e.target.parentNode.dataset && e.target.parentNode.dataset.file) {
            e.stopPropagation();
            this.setState("selected", e.target.parentNode.dataset.file);
        }
    }
};
