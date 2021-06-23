const axios = require("axios");
const cloneDeep = require("lodash.clonedeep");
const Cookies = require("../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            files: [],
            selected: [],
            loading: false,
            dir: [],
            error: null,
            clipboard: {},
            selectedCount: 0,
        };
        this.state = state;
        this.cookieOptions = out.global.cookieOptions;
        this.siteId = out.global.siteId;
        this.i18n = out.global.i18n;
        this.routes = out.global.routes;
    }

    setError(msg) {
        this.setState("error", msg);
    }

    onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteId || "zoia3"}.authToken`);
        this.uploadModal = this.getComponent("z3_cr_images_uploadModal");
        this.contextMenu = this.getComponent("z3_cr_images_fileMenu");
        this.inputModal = this.getComponent("z3_cr_images_inputModal");
        this.deleteModal = this.getComponent("z3_cr_images_deleteModal");
        this.notify = this.getComponent("core_images_mnotify");
        document.addEventListener("click", () => this.contextMenu.setActive(false));
        this.loadFiles();
    }

    async loadFiles(dir = this.state.dir) {
        this.setError(null);
        this.state.loading = true;
        try {
            const res = await axios({
                method: "post",
                url: "/api/core/images/list",
                data: {
                    dir: dir.join("/")
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            this.state.files = res.data.files || [];
            return true;
        } catch (e) {
            this.state.loading = false;
            this.setError(e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer"));
            return false;
        }
    }

    onErrorDeleteClick() {
        this.setError(null);
    }

    onBrowserItemsClick(e) {
        this.contextMenu.setActive(false);
        if (e.target.parentNode && e.target.parentNode.dataset && e.target.parentNode.dataset.file) {
            e.stopPropagation();
            let selected = [];
            const {
                file
            } = e.target.parentNode.dataset;
            if (e.shiftKey && this.state.selected.length && file !== this.state.selected[0] && file !== this.state.selected[this.state.selected.length - 1]) {
                const firstItem = this.state.selected[0];
                const lastItem = this.state.selected[this.state.selected.length - 1];
                const firstItemIndex = this.state.files.findIndex(i => i.name === firstItem);
                const lastItemIndex = this.state.files.findIndex(i => i.name === lastItem);
                const fileIndex = this.state.files.findIndex(i => i.name === file);
                if (fileIndex < firstItemIndex) {
                    selected = cloneDeep(this.state.files).slice(fileIndex, firstItemIndex + 1).map(f => f.name);
                } else {
                    selected = cloneDeep(this.state.files).slice(lastItemIndex, fileIndex + 1).map(f => f.name);
                }
            } else if (e.ctrlKey) {
                selected = this.state.selected.find(i => i === file) ? cloneDeep(this.state.selected).filter(i => i !== file) : [...cloneDeep(this.state.selected), file];
            } else {
                selected = [file];
            }
            this.state.selectedCount = selected.length;
            this.setState("selected", selected);
        }
    }

    initClipboardData(mode) {
        return {
            src: this.state.dir.join("/"),
            mode,
            files: this.state.selected,
            filesCount: this.state.selected.length
        };
    }

    async onPasteClick() {
        if (this.loading || !this.state.clipboard.filesCount || this.state.clipboard.src === this.state.dir.join("/")) {
            return;
        }
        this.state.loading = true;
        try {
            await axios({
                method: "post",
                url: "/api/core/images/paste",
                data: {
                    srcDir: this.state.clipboard.src,
                    destDir: this.state.dir.join("/"),
                    files: this.state.clipboard.files,
                    mode: this.state.clipboard.mode
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            this.state.clipboard = {};
            this.state.selected = [];
            this.state.selectedCount = 0;
            this.notify.func.show(this.i18n.t("operationSuccess"), "is-success");
            this.loadFiles();
        } catch (e) {
            this.state.loading = false;
            let errorText = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotProcess");
            const files = e && e.response && e.response.data && e.response.data.error && e.response.data.error.files && e.response.data.error.files.length ? e.response.data.error.files.join(", ") : null;
            if (files) {
                errorText = `${errorText}: ${files}`;
            }
            this.setError(errorText);
        }
    }

    async onToolbarButtonClick(e) {
        e.preventDefault();
        this.setError(null);
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        switch (dataset.id) {
        case "refresh":
            this.loadFiles();
            break;
        case "selectAll":
            this.setState("selected", this.state.files.map(f => f.name));
            this.state.selectedCount = this.state.files.length;
            break;
        case "selectNone":
            this.setState("selected", []);
            this.state.selectedCount = 0;
            break;
        case "levelUp":
            if (this.loading || !this.state.dir.length) {
                return;
            }
            const dir = cloneDeep(this.state.dir);
            dir.pop();
            if (await this.loadFiles(dir)) {
                this.setState("dir", dir);
                this.state.selected = [];
                this.state.selectedCount = 0;
            }
            break;
        case "upload":
            this.setError(null);
            this.uploadModal.func.setDir(this.state.dir.join("/"));
            this.uploadModal.func.setActive(true);
            break;
        case "createDir":
            this.createDir();
            break;
        case "copy":
        case "cut":
            if (this.loading || !this.state.selectedCount) {
                break;
            }
            this.setState("clipboard", this.initClipboardData(dataset.id));
            break;
        case "paste":
            this.onPasteClick();
            break;
        case "delete":
            await this.delete();
            break;
        }
    }

    onContextMenu(e) {
        const fileData = e.target.parentNode && e.target.parentNode.dataset && e.target.parentNode.dataset.file ? e.target.parentNode.dataset.file : e.target.parentNode && e.target.parentNode.parentNode && e.target.parentNode.parentNode.dataset && e.target.parentNode.parentNode.dataset.file ? e.target.parentNode.parentNode.dataset.file : null;
        if (fileData) {
            e.stopPropagation();
            e.preventDefault();
            const file = this.state.files.find(i => i.name === fileData);
            this.contextMenu.setActive(true, e.pageX, e.pageY, file, true);
            this.setState("selected", [file.name]);
        }
    }

    async chDir(dir) {
        const dirState = cloneDeep(this.state.dir);
        dirState.push(dir);
        if (await this.loadFiles(dirState)) {
            this.setState("selected", []);
            this.setState("selectedCount", 0);
            this.setState("dir", dirState);
        }
    }

    async onChDir(data) {
        await this.chDir(data.file.name);
    }

    onUploadSuccess() {
        this.setError(null);
        this.loadFiles();
    }

    onUploadError() {
        this.setError(this.i18n.t("couldNotUpload"));
    }

    rename(name) {
        this.inputModal.func.setMode("rename");
        this.inputModal.func.setTitle(this.i18n.t("rename"));
        this.inputModal.func.setFilename(name);
        this.inputModal.func.setActive(true);
    }

    async onDeleteConfirm() {
        this.state.loading = true;
        try {
            await axios({
                method: "post",
                url: "/api/core/images/delete",
                data: {
                    dir: this.state.dir.join("/"),
                    files: this.state.selected
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.deleteItems = null;
            this.state.loading = false;
            this.state.selected = [];
            this.state.selectedCount = 0;
            this.notify.func.show(this.i18n.t("operationSuccess"), "is-success");
            this.loadFiles();
        } catch (e) {
            this.deleteItems = null;
            this.state.loading = false;
            const files = e && e.response && e.response.data && e.response.data.error && e.response.data.error.files && e.response.data.error.files.length ? e.response.data.error.files.join(", ") : null;
            let errorText = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotDelete");
            if (files) {
                errorText = `${errorText}: ${files}`;
            }
            this.setError(errorText);
        }
    }

    async processRename(data) {
        if (this.loading || data.src === data.dest) {
            return;
        }
        this.state.loading = true;
        try {
            await axios({
                method: "post",
                url: "/api/core/images/rename",
                data: {
                    dir: this.state.dir.join("/"),
                    src: data.src,
                    dest: data.dest
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            this.state.selectedCount = 0;
            this.setState("selected", []);
            this.loadFiles();
            this.notify.func.show(this.i18n.t("operationSuccess"), "is-success");
        } catch (e) {
            this.state.loading = false;
            let errorText = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotProcess");
            const files = e && e.response && e.response.data && e.response.data.error && e.response.data.error.files && e.response.data.error.files.length ? e.response.data.error.files.join(", ") : null;
            if (files) {
                errorText = `${errorText}: ${files}`;
            }
            this.setError(errorText);
        }
    }

    async processCreateDir(name) {
        if (this.loading) {
            return;
        }
        this.state.loading = true;
        try {
            await axios({
                method: "post",
                url: "/api/core/images/newDir",
                data: {
                    dir: this.state.dir.join("/"),
                    name,
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            this.setState("selected", []);
            this.loadFiles();
            this.notify.func.show(this.i18n.t("operationSuccess"), "is-success");
        } catch (e) {
            this.state.loading = false;
            let errorText = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotProcess");
            const files = e && e.response && e.response.data && e.response.data.error && e.response.data.error.files && e.response.data.error.files.length ? e.response.data.error.files.join(", ") : null;
            if (files) {
                errorText = `${errorText}: ${files}`;
            }
            this.setError(errorText);
        }
    }

    onInputConfirm(data) {
        switch (data.mode) {
        case "rename":
            this.processRename(data);
            break;
        case "createDir":
            this.processCreateDir(data.dest);
            break;
        }
    }

    async delete() {
        if (this.loading || !this.state.selected.length) {
            return;
        }
        this.deleteModal.func.setFiles(this.state.selected.join(", "));
        this.deleteModal.func.setActive(true);
    }

    createDir() {
        this.inputModal.func.setMode("createDir");
        this.inputModal.func.setTitle(this.i18n.t("createDir"));
        this.inputModal.func.setFilename("");
        this.inputModal.func.setActive(true);
    }

    async onMenuItemClick(data) {
        switch (data.cmd) {
        case "chdir":
            await this.chDir(data.name);
            break;
        case "rename":
            await this.rename(data.name);
            break;
        case "delete":
            await this.delete();
            break;
        case "copy":
        case "cut":
            if (this.loading || !this.state.selectedCount) {
                break;
            }
            this.setState("clipboard", this.initClipboardData(data.cmd));
        }
    }

    onCancel() {
        window.close();
    }

    onSelect() {
        if (this.state.selectedCount === 1 && window.opener) {
            const item = this.state.files.find(i => i.name === this.state.selected[0]);
            if (item && !item.dir) {
                window.opener.__zoiaCoreImagesBrowser.insertImageURL(`${this.routes.publicImages}/${this.state.dir.join("/")}/${item.name}`.replace(/\/+/g, "/"));
                window.close();
            }
        }
    }
};
