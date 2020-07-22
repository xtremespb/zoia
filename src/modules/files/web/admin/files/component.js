const axios = require("axios");
const throttle = require("lodash.throttle");
const Cookies = require("../../../../../shared/lib/cookies").default;
const Query = require("../../../../../shared/lib/query").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            dir: "/",
            files: [],
            checked: {},
            checkedCount: 0,
            clipboard: {},
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
        this.query = new Query();
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
        this.tree = this.getComponent("z3_ap_f_tree");
        this.deleteModal = this.getComponent("z3_ap_f_deleteModal");
        this.onWindowResize();
        window.addEventListener("resize", throttle(this.onWindowResize.bind(this), 1000));
        this.state.dir = this.query.get("d") || this.state.dir;
        await this.loadFilesList();
        await this.loadTree();
        if (this.query.get("d")) {
            this.tree.func.selectNode(this.state.dir.split("/").filter(i => i));
        }
    }

    setLoading(state) {
        this.state.loading = state;
        this.tree.func.setLoading(state);
        this.state.error = null;
    }

    onWindowResize() {
        const tree = document.getElementById("z3_ap_f_tree");
        if (!window.matchMedia("only screen and (max-width: 768px)").matches) {
            const treeHeight = window.innerHeight - tree.getBoundingClientRect().top - 40;
            tree.style.minHeight = `${treeHeight}px`;
        } else {
            tree.style.minHeight = "unset";
        }
    }

    async loadFilesList(dir = this.state.dir) {
        this.onSelectNoneClick();
        this.setLoading(true);
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
            this.setLoading(false);
            this.state.files = res.data.files || [];
        } catch (e) {
            this.setLoading(false);
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer");
        }
    }

    async loadTree() {
        this.setLoading(true);
        try {
            const res = await axios({
                method: "post",
                url: "/api/files/tree",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.tree = res.data.tree || {};
            this.tree.func.initData(res.data.tree);
            this.setLoading(false);
        } catch (e) {
            this.setLoading(false);
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer");
        }
    }

    onErrorDeleteClick() {
        this.state.error = null;
    }

    async onTreeItemClick(data) {
        this.state.dir = data.path.length ? `/${data.path.join("/")}` : "/";
        this.query.replace({
            d: this.state.dir
        });
        await this.loadFilesList();
    }

    async onFileClick(data) {
        if (data.dir) {
            const currentPath = this.state.dir.split("/").filter(i => i);
            currentPath.push(data.name);
            this.state.dir = `/${currentPath.join("/")}`;
            this.query.replace({
                d: this.state.dir
            });
            await this.loadFilesList();
            this.tree.func.selectNode(currentPath);
        }
    }

    async onLevelUpClick() {
        if (this.loading || this.state.dir === "/") {
            return;
        }
        const currentPath = this.state.dir.split("/").filter(i => i);
        currentPath.pop();
        this.state.dir = `/${currentPath.join("/")}`;
        this.query.replace({
            d: this.state.dir
        });
        await this.loadFilesList();
        this.tree.func.selectNode(currentPath);
    }

    onCheckboxChange(data) {
        this.state.checked[data.id] = data.state;
        if (!data.state) {
            delete this.state.checked[data.id];
        }
        this.state.checkedCount = Object.keys(this.state.checked).length;
    }

    initClipboardData(mode) {
        return {
            src: this.state.dir,
            mode,
            files: Object.keys(this.state.checked),
            filesCount: Object.keys(this.state.checked).length
        };
    }

    onCopyClick() {
        if (this.loading || !this.state.checkedCount) {
            return;
        }
        this.setState("clipboard", this.initClipboardData("copy"));
    }

    onCutClick() {
        if (this.loading || !this.state.checkedCount) {
            return;
        }
        this.setState("clipboard", this.initClipboardData("cut"));
    }

    onDeleteClick() {
        if (this.loading || !this.state.checkedCount) {
            return;
        }
        this.deleteModal.func.setFiles(Object.keys(this.state.checked).join(", "));
        this.deleteModal.func.setActive(true);
    }

    async onDeleteConfirm() {
        this.setLoading(true);
        try {
            await axios({
                method: "post",
                url: "/api/files/delete",
                data: {
                    dir: this.state.dir,
                    files: Object.keys(this.state.checked)
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.setLoading(false);
            this.getComponent(`files_mnotify`).func.show(this.i18n.t("operationSuccess"), "is-success");
            await this.loadFilesList();
            this.setState("clipboard", {});
            this.onSelectNoneClick();
            await this.loadTree();
            this.tree.func.selectNode(this.state.dir.split("/").filter(i => i));
        } catch (e) {
            this.setLoading(false);
            const files = e && e.response && e.response.data && e.response.data.error && e.response.data.error.files && e.response.data.error.files.length ? e.response.data.error.files.join(", ") : null;
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotDelete");
            if (files) {
                this.state.error = `${this.state.error}: ${files}`;
            }
            await this.loadFilesList();
        }
    }

    onSelectAllClick() {
        const checked = {};
        this.state.files.map(f => checked[f.name] = true);
        this.state.checkedCount = this.state.files.length;
        this.state.checked = checked;
    }

    onSelectNoneClick() {
        this.state.checked = {};
        this.state.checkedCount = 0;
    }

    async onRefreshClick() {
        await this.loadFilesList();
        await this.loadTree();
        this.tree.func.selectNode(this.state.dir.split("/").filter(i => i));
    }

    async onPasteClick() {
        if (this.loading || !this.state.clipboard.src || this.state.clipboard.src === this.state.dir) {
            return;
        }
        this.setLoading(true);
        try {
            await axios({
                method: "post",
                url: "/api/files/paste",
                data: {
                    srcDir: this.state.clipboard.src,
                    destDir: this.state.dir,
                    files: this.state.clipboard.files,
                    mode: this.state.clipboard.mode
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.setLoading(false);
            this.getComponent(`files_mnotify`).func.show(this.i18n.t("operationSuccess"), "is-success");
            await this.loadFilesList();
            this.setState("clipboard", {});
            this.onSelectNoneClick();
            await this.loadTree();
            this.tree.func.selectNode(this.state.dir.split("/").filter(i => i));
        } catch (e) {
            this.setLoading(false);
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotProcess");
            const files = e && e.response && e.response.data && e.response.data.error && e.response.data.error.files && e.response.data.error.files.length ? e.response.data.error.files.join(", ") : null;
            if (files) {
                this.state.error = `${this.state.error}: ${files}`;
            }
            await this.loadFilesList();
            await this.loadTree();
            this.tree.func.selectNode(this.state.dir.split("/").filter(i => i));
        }
    }
};
