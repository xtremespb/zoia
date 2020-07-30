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
        this.uploadModal = this.getComponent("z3_ap_f_uploadModal");
        this.inputModal = this.getComponent("z3_ap_f_inputModal");
        this.onWindowResize();
        window.addEventListener("resize", throttle(this.onWindowResize.bind(this), 1000));
        window.addEventListener("click", this.onContextMenuHide.bind(this));
        this.state.dir = this.query.get("d") || this.state.dir;
        await this.loadFilesList();
        await this.loadTree();
        if (this.query.get("d")) {
            this.tree.func.selectNode(this.state.dir.split("/").filter(i => i));
        }
    }

    setLoadingList(state) {
        this.state.loading = state;
        this.state.error = null;
    }

    setLoadingTree(state) {
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

    onContextMenu(e) {
        e.preventDefault();
        this.getComponent("z3_ap_f_fileMenu").func.setActive(true, e.pageX, e.pageY, e.currentTarget.dataset.id, e.currentTarget.dataset.directory);
    }

    onContextMenuHide(e) {
        const menu = document.getElementById("z3_ap_f_menu");
        if (menu && !menu.contains(e.target)) {
            this.getComponent("z3_ap_f_fileMenu").func.setActive(false);
        }
    }

    bindContextMenu() {
        const items = document.querySelectorAll(".z3-ap-f-item-wrap");
        Array.from(items).map(i => {
            i.addEventListener("contextmenu", this.onContextMenu.bind(this));
            i.addEventListener("longtap", this.onContextMenu.bind(this));
        });
    }

    unbindContextMenu() {
        const items = document.querySelectorAll(".z3-ap-f-item-wrap");
        Array.from(items).map(i => {
            i.removeEventListener("contextmenu", this.onContextMenu.bind(this));
            i.removeEventListener("longtap", this.onContextMenu.bind(this));
        });
    }

    async loadFilesList(dir = this.state.dir) {
        this.onSelectNoneClick();
        this.setLoadingList(true);
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
            this.setLoadingList(false);
            this.unbindContextMenu();
            this.state.files = res.data.files || [];
            setTimeout(this.bindContextMenu.bind(this), 300);
        } catch (e) {
            this.setLoadingList(false);
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer");
        }
    }

    async loadTree() {
        this.setLoadingTree(true);
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
            this.setLoadingTree(false);
        } catch (e) {
            this.setLoadingTree(false);
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer");
        }
    }

    async loadData() {
        await Promise.all([this.loadTree(), this.loadFilesList()]);
        this.setState("clipboard", {});
        this.onSelectNoneClick();
        this.tree.func.selectNode(this.state.dir.split("/").filter(i => i));
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
        this.setLoadingList(true);
        this.setLoadingTree(true);
        try {
            await axios({
                method: "post",
                url: "/api/files/delete",
                data: {
                    dir: this.state.dir,
                    files: this.deleteItems || Object.keys(this.state.checked)
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.deleteItems = null;
            this.setLoadingList(false);
            this.setLoadingTree(false);
            this.getComponent(`files_mnotify`).func.show(this.i18n.t("operationSuccess"), "is-success");
            await this.loadData();
        } catch (e) {
            this.deleteItems = null;
            this.setLoadingList(false);
            this.setLoadingTree(false);
            const files = e && e.response && e.response.data && e.response.data.error && e.response.data.error.files && e.response.data.error.files.length ? e.response.data.error.files.join(", ") : null;
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotDelete");
            if (files) {
                this.state.error = `${this.state.error}: ${files}`;
            }
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
        this.loadData();
    }

    async onPasteClick() {
        if (this.loading || !this.state.clipboard.src || this.state.clipboard.src === this.state.dir) {
            return;
        }
        this.setLoadingList(true);
        this.setLoadingTree(true);
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
            this.setLoadingList(false);
            this.setLoadingTree(false);
            this.getComponent(`files_mnotify`).func.show(this.i18n.t("operationSuccess"), "is-success");
            this.loadData();
        } catch (e) {
            this.setLoadingList(false);
            this.setLoadingTree(false);
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotProcess");
            const files = e && e.response && e.response.data && e.response.data.error && e.response.data.error.files && e.response.data.error.files.length ? e.response.data.error.files.join(", ") : null;
            if (files) {
                this.state.error = `${this.state.error}: ${files}`;
            }
        }
    }

    onUploadClick() {
        this.uploadModal.func.setDir(this.state.dir);
        this.uploadModal.func.setActive(true);
    }

    onUploadSuccess() {
        this.loadFilesList();
        this.getComponent(`files_mnotify`).func.show(this.i18n.t("operationSuccess"), "is-success");
    }

    onUploadError() {
        this.loadFilesList();
        this.state.error = this.i18n.t("couldNotUpload");
    }

    onMenuItemClick(data) {
        switch (data.cmd) {
        case "rename":
            this.onFileRename(data);
            break;
        case "edit":
            this.onFileEdit(data);
            break;
        case "cut":
        case "copy":
            this.onFileCutCopy(data, data.cmd);
            break;
        case "delete":
            this.deleteItems = [data.uid];
            this.deleteModal.func.setFiles(data.uid);
            this.deleteModal.func.setActive(true);
            break;
        }
    }

    onFileRename(data) {
        this.inputModal.func.setMode("rename");
        this.inputModal.func.setTitle(this.i18n.t("rename"));
        this.inputModal.func.setFilename(data.uid);
        this.inputModal.func.setActive(true);
    }

    onCreateDir() {
        this.inputModal.func.setMode("createDir");
        this.inputModal.func.setTitle(this.i18n.t("createDir"));
        this.inputModal.func.setFilename("");
        this.inputModal.func.setActive(true);
    }

    onCreateFile() {
        this.inputModal.func.setMode("createFile");
        this.inputModal.func.setTitle(this.i18n.t("doCreateFile"));
        this.inputModal.func.setFilename("");
        this.inputModal.func.setActive(true);
    }

    async processRename(data) {
        if (this.loading || data.src === data.dest) {
            return;
        }
        this.setLoadingList(true);
        this.setLoadingTree(true);
        try {
            await axios({
                method: "post",
                url: "/api/files/rename",
                data: {
                    dir: this.state.dir,
                    src: data.src,
                    dest: data.dest
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.setLoadingList(false);
            this.setLoadingTree(false);
            this.getComponent(`files_mnotify`).func.show(this.i18n.t("operationSuccess"), "is-success");
            this.loadData();
        } catch (e) {
            this.setLoadingList(false);
            this.setLoadingTree(false);
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotProcess");
            const files = e && e.response && e.response.data && e.response.data.error && e.response.data.error.files && e.response.data.error.files.length ? e.response.data.error.files.join(", ") : null;
            if (files) {
                this.state.error = `${this.state.error}: ${files}`;
            }
        }
    }

    async processCreateNew(data, mode) {
        if (this.loading || data.src === data.dest) {
            return;
        }
        this.setLoadingList(true);
        this.setLoadingTree(true);
        try {
            await axios({
                method: "post",
                url: "/api/files/new",
                data: {
                    dir: this.state.dir,
                    name: data.dest,
                    mode
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.setLoadingList(false);
            this.setLoadingTree(false);
            this.getComponent(`files_mnotify`).func.show(this.i18n.t("operationSuccess"), "is-success");
            this.loadData();
        } catch (e) {
            this.setLoadingList(false);
            this.setLoadingTree(false);
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotProcess");
            const files = e && e.response && e.response.data && e.response.data.error && e.response.data.error.files && e.response.data.error.files.length ? e.response.data.error.files.join(", ") : null;
            if (files) {
                this.state.error = `${this.state.error}: ${files}`;
            }
        }
    }

    onInputConfirm(data) {
        switch (data.mode) {
        case "rename":
            this.processRename(data);
            break;
        case "createDir":
            this.processCreateNew(data, "dir");
            break;
        case "createFile":
            this.processCreateNew(data, "file");
            break;
        }
    }

    onFileEdit(data) {
        console.log(data.uid);
    }

    onFileCutCopy(data, mode) {
        const clipboardData = {
            src: this.state.dir,
            mode,
            files: [data.uid],
            filesCount: 1
        };
        this.setState("clipboard", clipboardData);
    }
};
