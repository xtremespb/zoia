const axios = require("axios");
const Cookies = require("../../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            active: false,
            files: [],
            progress: false,
            percentCompleted: 0,
            error: null,
            dropAreaHighlight: false
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
            setDir: this.setDir.bind(this),
        };
        this.i18n = out.global.i18n;
        this.siteOptions = out.global.siteOptions;
    }

    onMount() {
        this.fileInput = this.getEl("z3_ap_f_upload_files");
        this.dropArea = this.getEl("z3_ap_f_upload_area");
        this.dropArea.addEventListener("drop", this.handleDragDrop.bind(this), false);
        ["dragenter", "dragover"].map(en => this.dropArea.addEventListener(en, e => {
            e.preventDefault();
            this.state.dropAreaHighlight = true;
        }, false));
        ["dragleave", "drop"].map(en => this.dropArea.addEventListener(en, e => {
            e.preventDefault();
            this.state.dropAreaHighlight = false;
        }, false));
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
    }

    handleDragDrop(e) {
        e.preventDefault();
        const {
            files
        } = e.dataTransfer;
        if (files && files.length) {
            this.changeFiles(files);
        }
    }

    setActive(state) {
        this.state.active = state;
        this.state.progress = false;
        this.setState("files", state ? [] : this.state.files);
        this.setState("error", null);
    }

    setDir(dir) {
        this.dir = dir;
    }

    onCloseClick() {
        if (this.state.progress) {
            return;
        }
        this.setActive(false);
    }

    formatBytes(bytes, decimals = 2) {
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        if (bytes === 0) {
            return {
                size: 0,
                unit: sizes[0]
            };
        }
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return {
            size: parseFloat((bytes / (k ** i)).toFixed(dm)),
            unit: sizes[i]
        };
    }

    changeFiles(filesData) {
        const files = Array.from(filesData).map((f, i) => {
            const size = this.formatBytes(f.size);
            return {
                name: f.name,
                size: `${size.size} ${this.i18n.t(size.unit)}`,
                data: filesData[i]
            };
        });
        this.setState("files", files);
    }

    onFileInputChange(e) {
        const filesData = e.target.files;
        this.changeFiles(filesData);
    }

    onFileRemoveClick(e) {
        e.preventDefault();
        const dataset = e.target ? (Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {}) : e;
        const id = parseInt(dataset.id, 10);
        const {
            files
        } = this.state;
        files.splice(id, 1);
        this.setStateDirty("files", files);
    }

    async onConfirmClick() {
        if (this.state.progress || !this.state.files.length) {
            return;
        }
        this.state.percentCompleted = 0;
        this.state.progress = true;
        const formData = new FormData();
        this.state.files.map(f => {
            formData.append(f.name, f.data);
        });
        formData.append("filesList", JSON.stringify(this.state.files.map(f => f.name)));
        formData.append("currentDir", this.dir);
        try {
            await axios({
                method: "post",
                url: "/api/files/upload",
                data: formData,
                headers: {
                    Authorization: `Bearer ${this.token}`
                },
                onUploadProgress: progressEvent => this.state.percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            });
            this.setActive(false);
            this.emit("upload-success");
        } catch (e) {
            this.state.progress = false;
            this.state.error = e && e.response && e.response.data && e.response.data.error ? (e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotProcess")) : e.message;
            const filesError = e && e.response && e.response.data && e.response.data.error && e.response.data.error.files && e.response.data.error.files.length ? e.response.data.error.files : null;
            if (filesError) {
                const {
                    files
                } = this.state;
                const filesUpdate = files.map(f => {
                    if (filesError.indexOf(f.name) > -1) {
                        f.error = true;
                        return f;
                    }
                    return null;
                }).filter(i => i);
                this.setState("files", filesUpdate);
            }
            this.emit("upload-error");
        }
    }

    onErrorDeleteClick() {
        this.state.error = null;
    }
};
