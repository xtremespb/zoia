const axios = require("axios");
const throttle = require("lodash.throttle");
const Cookies = require("../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            dir: "/",
            files: [],
            tree: {},
            loading: false,
            error: null
        };
        this.state = state;
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
        this.i18n = out.global.i18n;
    }

    async onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
        await this.loadList(this.state.dir);
        this.onWindowResize();
        window.addEventListener("resize", throttle(this.onWindowResize.bind(this), 1000));
    }

    onWindowResize() {
        const tree = document.getElementById("z3_ap_f_tree");
        if (!window.matchMedia("only screen and (max-width: 768px)").matches) {
            const treeHeight = window.innerHeight - tree.getBoundingClientRect().top - 20;
            tree.style.minHeight = `${treeHeight}px`;
        } else {
            tree.style.minHeight = "unset";
        }
    }

    async loadList(dir) {
        this.state.loading = true;
        try {
            const res = await axios({
                method: "post",
                url: "/api/files/list",
                data: {
                    dir
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            this.state.files = res.data.files || [];
            this.state.tree = res.data.tree || {};
            this.getComponent("z3_ap_f_tree").func.initData(res.data.tree);
            this.getComponent("z3_ap_f_tree").func.selectNode(["src", "modules", "update", "web", "admin"]);
        } catch (e) {
            this.state.loading = false;
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer");
        }
    }

    onErrorDeleteClick() {
        this.state.error = null;
    }
};
