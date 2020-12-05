/* eslint-disable import/no-webpack-loader-syntax */
const axios = require("axios");
const ace = process.browser ? require("ace-builds") : null;
const throttle = require("lodash.throttle");
const Cookies = require("../../../../../shared/lib/cookies").default;
const Query = require("../../../../../shared/lib/query").default;

if (process.browser) {
    ace.config.setModuleUrl("ace/mode/html_worker", require("file-loader?name=npm.ace-builds.worker-html.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/worker-html.js"));
    ace.config.setModuleUrl("ace/mode/html", require("file-loader?name=npm.ace-builds.mode-html.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-html.js"));
    ace.config.setModuleUrl("ace/mode/css_worker", require("file-loader?name=npm.ace-builds.worker-css.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/worker-css.js"));
    ace.config.setModuleUrl("ace/mode/css", require("file-loader?name=npm.ace-builds.mode-css.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-css.js"));
    ace.config.setModuleUrl("ace/mode/javascript_worker", require("file-loader?name=npm.ace-builds.worker-javascript.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/worker-javascript.js"));
    ace.config.setModuleUrl("ace/mode/javascript", require("file-loader?name=npm.ace-builds.mode-javascript.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-javascript.js"));
    ace.config.setModuleUrl("ace/mode/text", require("file-loader?name=npm.ace-builds.mode-text.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-text.js"));
    ace.config.setModuleUrl("ace/mode/json_worker", require("file-loader?name=npm.ace-builds.worker-json.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/worker-json.js"));
    ace.config.setModuleUrl("ace/mode/json", require("file-loader?name=npm.ace-builds.mode-json.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-json.js"));
    ace.config.setModuleUrl("ace/mode/markdown", require("file-loader?name=npm.ace-builds.mode-markdown.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-markdown.js"));
    ace.config.setModuleUrl("ace/theme/chrome", require("file-loader?name=npm.ace-builds.theme-chrome.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/theme-chrome.js"));
}

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
            loadingFile: false,
            error: null,
            errorFile: null,
            currentMode: "list",
            currentFile: null
        };
        this.state = state;
        this.cookieOptions = out.global.cookieOptions;
        this.siteId = out.global.siteId;
        this.i18n = out.global.i18n;
    }

    async onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.query = new Query();
        this.token = cookies.get(`${this.siteId || "zoia3"}.authToken`);
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
        [this.aceEditorElement] = this.getEl("z3_ap_f_textEditorWrap").getElementsByTagName("div");
        this.aceEditor = ace.edit(this.aceEditorElement);
        this.aceOptions = {
            mode: "ace/mode/html",
            theme: "ace/theme/chrome",
            fontSize: "16px",
            wrap: true,
            useSoftTabs: true,
            tabSize: 2
        };
        this.aceEditor.setOptions(this.aceOptions);
        // Remove annotations, e.g.
        // "Non-space characters found without seeing a doctype first. Expected e.g. <!DOCTYPE html>."
        this.aceEditor.getSession().on("changeAnnotation", () => {
            const annotations = this.aceEditor.getSession().getAnnotations();
            const annotationsFiltered = annotations.filter(a => a && !a.text.match(/DOCTYPE html/));
            if (annotations.length > annotationsFiltered.length) {
                this.aceEditor.getSession().setAnnotations(annotationsFiltered);
            }
        });
    }

    setLoadingList(state) {
        this.state.loading = state;
        this.state.error = null;
    }

    setLoadingTree(state) {
        this.tree.func.setLoading(state);
        this.state.error = null;
    }

    setLoadingFile(state) {
        this.state.loadingFile = state;
        this.state.errorFile = null;
    }

    onWindowResize() {
        const tree = document.getElementById("z3_ap_f_tree");
        if (tree && tree.getBoundingClientRect()) {
            if (!window.matchMedia("only screen and (max-width: 768px)").matches) {
                const treeHeight = window.innerHeight - tree.getBoundingClientRect().top - 40;
                tree.style.minHeight = `${treeHeight}px`;
            } else {
                tree.style.minHeight = "unset";
            }
        }
    }

    onContextMenu(e) {
        e.preventDefault();
        this.getComponent("z3_ap_f_fileMenu").func.setActive(true, e.pageX, e.pageY, e.currentTarget.dataset.id, e.currentTarget.dataset.directory, e.currentTarget.dataset.ro, e.currentTarget.dataset.zip);
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

    onFileErrorDeleteClick() {
        this.state.errorFile = null;
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
        } else {
            Object.assign(document.createElement("a"), {
                target: "_blank",
                href: `/bin/files/download?dir=${this.state.dir}&name=${data.name}`
            }).click();
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
        case "unzip":
            this.processExtractZIP(data);
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
        case "zip":
            this.processCreateZIP(data);
            break;
        }
    }

    async onFileEdit(data) {
        this.setState("currentFile", data.uid);
        await this.loadFile();
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

    async loadFile() {
        if (this.loading) {
            return;
        }
        this.setLoadingList(true);
        this.setLoadingTree(true);
        try {
            const res = await axios({
                method: "post",
                url: "/api/files/load",
                data: {
                    dir: this.state.dir,
                    name: this.state.currentFile
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.setLoadingList(false);
            this.setLoadingTree(false);
            if (res && res.data) {
                if (res.data.mime) {
                    switch (res.data.mime) {
                    case "application/javascript":
                        this.aceOptions.mode = "ace/mode/javascript";
                        break;
                    case "text/css":
                        this.aceOptions.mode = "ace/mode/javascript";
                        break;
                    case "text/html":
                        this.aceOptions.mode = "ace/mode/html";
                        break;
                    case "application/json":
                        this.aceOptions.mode = "ace/mode/json";
                        break;
                    case "text/markdown":
                        this.aceOptions.mode = "ace/mode/markdown";
                        break;
                    default:
                        this.aceOptions.mode = "ace/mode/text";
                        break;
                    }
                    this.aceEditor.setOptions(this.aceOptions);
                }
                this.setState("currentMode", "edit");
                setTimeout(() => {
                    this.aceEditor.getSession().setValue(res.data.content || "");
                    this.aceEditor.focus();
                }, 10);
            }
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

    async onFileSave() {
        if (this.state.loadingFile) {
            return;
        }
        this.setLoadingFile(true);
        try {
            await axios({
                method: "post",
                url: "/api/files/save",
                data: {
                    dir: this.state.dir,
                    name: this.state.currentFile,
                    content: this.aceEditor.getSession().getValue()
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.setLoadingFile(false);
            this.setState("currentMode", "list");
            this.loadFilesList();
            setTimeout(() => this.getComponent(`files_mnotify`).func.show(this.i18n.t("operationSuccess"), "is-success"), 10);
        } catch (e) {
            this.setLoadingFile(false);
            this.state.errorFile = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotProcess");
            const files = e && e.response && e.response.data && e.response.data.error && e.response.data.error.files && e.response.data.error.files.length ? e.response.data.error.files.join(", ") : null;
            if (files) {
                this.state.error = `${this.state.errorFile}: ${files}`;
            }
        }
    }

    returnToListMode() {
        this.setState("currentMode", "list");
        this.loadFilesList();
    }

    onZIPClick() {
        if (this.loading || !this.state.checkedCount) {
            return;
        }
        this.inputModal.func.setMode("zip");
        this.inputModal.func.setTitle(this.i18n.t("doZIP"));
        this.inputModal.func.setFilename("");
        this.inputModal.func.setActive(true);
    }

    async processCreateZIP(data) {
        if (this.loading) {
            return;
        }
        this.setLoadingList(true);
        this.setLoadingTree(true);
        const name = data.dest.toLowerCase().match(/\.zip$/) ? data.dest : `${data.dest}.zip`;
        try {
            await axios({
                method: "post",
                url: "/api/files/zip",
                data: {
                    dir: this.state.dir,
                    name,
                    files: Object.keys(this.state.checked)
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

    async processExtractZIP(data) {
        if (this.loading) {
            return;
        }
        this.setLoadingList(true);
        this.setLoadingTree(true);
        try {
            await axios({
                method: "post",
                url: "/api/files/unzip",
                data: {
                    dir: this.state.dir,
                    name: data.uid
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
};
