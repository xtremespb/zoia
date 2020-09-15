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
        };
        this.state = state;
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
        this.i18n = out.global.i18n;
    }

    setError(msg) {
        this.setState("error", msg);
    }

    onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
        this.uploadModal = this.getComponent("z3_cr_images_uploadModal");
        this.loadFiles();
    }

    async loadFiles(dir = this.state.dir) {
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
            this.setState("selected", selected);
        }
    }

    async onToolbarButtonClick(e) {
        e.preventDefault();
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        switch (dataset.id) {
        case "refresh":
            this.loadFiles();
            break;
        case "selectAll":
            this.setState("selected", this.state.files.map(f => f.name));
            break;
        case "selectNone":
            this.setState("selected", []);
            break;
        case "levelUp":
            if (this.loading || !this.state.dir.length) {
                return;
            }
            const dir = cloneDeep(this.state.dir);
            dir.pop();
            if (await this.loadFiles(dir)) {
                this.setState("dir", dir);
            }
            break;
        case "upload":
            this.setError(null);
            this.uploadModal.func.setDir(this.state.dir.join("/"));
            this.uploadModal.func.setActive(true);
            break;
        }
    }

    async onChDir(data) {
        const dir = cloneDeep(this.state.dir);
        dir.push(data.file.name);
        if (await this.loadFiles(dir)) {
            this.setState("selected", []);
            this.setState("dir", dir);
        }
    }

    onUploadSuccess() {
        this.setError(null);
        this.loadFiles();
    }

    onUploadError() {
        this.setError(this.i18n.t("couldNotUpload"));
    }
};
