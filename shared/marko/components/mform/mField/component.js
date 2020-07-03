/* eslint-disable import/no-webpack-loader-syntax */
const ace = process.browser ? require("ace-builds") : null;
const throttle = require("lodash.throttle");
const {
    v4: uuidv4
} = require("uuid");
const axios = require("axios");
const {
    cloneDeep
} = require("lodash");

if (process.browser) {
    // require("ace-builds/webpack-resolver");
    ace.config.setModuleUrl("ace/mode/html_worker", require("file-loader?name=npm.ace-builds.worker-html.[contenthash:8].js&esModule=false!../../../../../node_modules/ace-builds/src-noconflict/worker-html.js"));
    ace.config.setModuleUrl("ace/mode/css_worker", require("file-loader?name=npm.ace-builds.worker-css.[contenthash:8].js&esModule=false!../../../../../node_modules/ace-builds/src-noconflict/worker-css.js"));
    ace.config.setModuleUrl("ace/mode/javascript_worker", require("file-loader?name=npm.ace-builds.worker-javascript.[contenthash:8].js&esModule=false!../../../../../node_modules/ace-builds/src-noconflict/worker-javascript.js"));
    ace.config.setModuleUrl("ace/mode/html", require("file-loader?name=npm.ace-builds.mode-html.[contenthash:8].js&esModule=false!../../../../../node_modules/ace-builds/src-noconflict/mode-html.js"));
    ace.config.setModuleUrl("ace/mode/javascript", require("file-loader?name=npm.ace-builds.mode-javascript.[contenthash:8].js&esModule=false!../../../../../node_modules/ace-builds/src-noconflict/mode-javascript.js"));
    ace.config.setModuleUrl("ace/mode/css", require("file-loader?name=npm.ace-builds.mode-css.[contenthash:8].js&esModule=false!../../../../../node_modules/ace-builds/src-noconflict/mode-css.js"));
    ace.config.setModuleUrl("ace/theme/chrome", require("file-loader?name=npm.ace-builds.theme-chrome.[contenthash:8].js&esModule=false!../../../../../node_modules/ace-builds/src-noconflict/theme-chrome.js"));
}

module.exports = class {
    onCreate(input) {
        const state = {
            captchaData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            captchaSecret: "",
            toggleAce: {}
        };
        this.state = state;
        this.item = input.item;
        this.func = {
            setFocus: this.setFocus.bind(this),
            reloadCaptcha: this.reloadCaptcha.bind(this),
            performUpdate: this.performUpdate.bind(this)
        };
    }

    performUpdate() {
        switch (this.item.type) {
        case "ace":
            throttle(this.updateAce.bind(this), 300)();
            break;
        }
    }

    updateAce() {
        this.aceEditor.getSession().setValue(this.input.value || "");
    }

    async reloadCaptcha() {
        if (this.item.type === "captcha") {
            try {
                const res = await axios.post("/api/core/captcha");
                this.state.captchaData = res.data.imageData;
                this.state.captchaSecret = res.data.imageSecret;
                this.emit("captcha", this.state.captchaSecret);
            } catch (e) {
                // Ignore
            }
        }
    }

    async onMount() {
        await this.reloadCaptcha();
        switch (this.item.type) {
        case "ace":
            [this.aceEditorElement] = document.getElementById(this.item.id).getElementsByTagName("div");
            this.aceEditor = ace.edit(this.aceEditorElement);
            const aceDefaults = {
                mode: "ace/mode/html",
                theme: "ace/theme/chrome",
                fontSize: "16px",
                wrap: true,
                useSoftTabs: true,
                tabSize: 2
            };
            this.aceEditor.setOptions(this.item.aceOptions ? {
                ...aceDefaults,
                ...this.item.aceOptions
            } : aceDefaults);
            this.aceEditor.getSession().on("change", () => {
                const value = this.aceEditor.getSession().getValue();
                this.emit("value-change", {
                    type: "input",
                    id: this.item.id,
                    value
                });
            });
            // Remove annotations, e.g.
            // "Non-space characters found without seeing a doctype first. Expected e.g. <!DOCTYPE html>."
            this.aceEditor.getSession().on("changeAnnotation", () => {
                const annotations = this.aceEditor.getSession().getAnnotations();
                const annotationsFiltered = annotations.filter(a => a && !a.text.match(/DOCTYPE html/));
                if (annotations.length > annotationsFiltered.length) {
                    this.aceEditor.getSession().setAnnotations(annotationsFiltered);
                }
            });
            break;
        }
    }

    setFocus() {
        let field;
        switch (this.item.type) {
        case "radio":
            field = this.getEl(`mf_ctl_${this.item.id}_0`);
            break;
        default:
            field = this.getEl(`mf_ctl_${this.item.id}`);
        }
        if (field) {
            field.focus();
        }
    }

    onFieldValueChange(e) {
        this.emit("value-change", {
            type: "input",
            id: e.target.dataset.id,
            value: e.target.value
        });
    }

    onArrInputChange(e) {
        this.emit("value-change", {
            type: "arr",
            id: e.target.dataset.id,
            inputid: e.target.dataset.inputid,
            value: e.target.checked
        });
    }

    onBooleanInputChange(e) {
        this.emit("value-change", {
            type: "boolean",
            id: e.target.dataset.id,
            value: !!e.target.checked
        });
    }

    onFileInputChange(e) {
        this.emit("value-change", {
            id: e.target.dataset.id,
            type: "file",
            value: Array.from(e.target.files).map((file, index) => {
                const fileData = e.target.files[index];
                const uid = uuidv4();
                fileData.zuid = uid;
                return {
                    type: "file",
                    name: file.name,
                    id: uid,
                    data: e.target.files[index],
                };
            })
        });
    }

    onFileRemove(e) {
        this.emit("remove-arr-item", {
            id: e.target.dataset.id,
            itemid: e.target.dataset.itemid
        });
    }

    onButtonClick(e) {
        this.emit("button-click", {
            id: e.target.dataset.id
        });
    }

    onAceToggleClick(e) {
        e.preventDefault();
        const {
            id
        } = e.target.dataset;
        const toggle = cloneDeep(this.state.toggleAce);
        toggle[id] = !toggle[id];
        if (toggle[id]) {
            setTimeout(() => this.aceEditor.getSession().setValue(this.input.value || ""), 100);
        }
        this.setState("toggleAce", toggle);
        this.forceUpdate();
    }
};
