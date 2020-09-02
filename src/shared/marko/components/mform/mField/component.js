/* eslint-disable import/no-webpack-loader-syntax */
const ace = process.browser ? require("ace-builds") : null;
const ClassicEditor = process.browser ? require("@ckeditor/ckeditor5-build-classic") : null;
const beautify = require("js-beautify");
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
    ace.config.setModuleUrl("ace/mode/html_worker", require("file-loader?name=npm.ace-builds.worker-html.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/worker-html.js"));
    ace.config.setModuleUrl("ace/mode/css_worker", require("file-loader?name=npm.ace-builds.worker-css.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/worker-css.js"));
    ace.config.setModuleUrl("ace/mode/javascript_worker", require("file-loader?name=npm.ace-builds.worker-javascript.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/worker-javascript.js"));
    ace.config.setModuleUrl("ace/mode/html", require("file-loader?name=npm.ace-builds.mode-html.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-html.js"));
    ace.config.setModuleUrl("ace/mode/javascript", require("file-loader?name=npm.ace-builds.mode-javascript.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-javascript.js"));
    ace.config.setModuleUrl("ace/mode/css", require("file-loader?name=npm.ace-builds.mode-css.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-css.js"));
    ace.config.setModuleUrl("ace/theme/chrome", require("file-loader?name=npm.ace-builds.theme-chrome.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/theme-chrome.js"));
}

module.exports = class {
    onCreate(input) {
        const state = {
            captchaData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            captchaSecret: "",
            toggleAce: {},
            modeAce: "ace"
        };
        this.state = state;
        this.item = input.item;
        this.func = {
            setFocus: this.setFocus.bind(this),
            reloadCaptcha: this.reloadCaptcha.bind(this),
            performUpdate: this.performUpdate.bind(this)
        };
        this.beautifyOptions = {
            indent_size: "2",
            indent_char: " ",
            max_preserve_newlines: "5",
            preserve_newlines: true,
            keep_array_indentation: false,
            break_chained_methods: false,
            indent_scripts: "normal",
            brace_style: "expand",
            space_before_conditional: true,
            unescape_strings: false,
            jslint_happy: false,
            end_with_newline: false,
            wrap_line_length: "80",
            indent_inner_html: true,
            comma_first: false,
            e4x: false
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
        const value = this.state.modeAce === "ace" ? beautify.html(this.input.value, this.beautifyOptions) : this.input.value;
        this.aceEditor.getSession().setValue(value);
        if (this.item.wysiwyg) {
            this.ckEditor.setData(value);
        }
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
            [this.aceEditorElement] = document.getElementById(`${this.item.id}_ace`).getElementsByTagName("div");
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
                // if (this.item.wysiwyg) {
                //     this.wysiwygNoUpdate = true;
                //     this.ckEditor.setData(value);
                // }
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
            if (this.item.wysiwyg) {
                this.ckEditorElement = this.getEl(`mf_ctl_ckeditor_${this.input.item.id}`);
                this.ckEditor = await ClassicEditor.create(this.ckEditorElement);
                this.ckEditor.model.document.on("change:data", () => {
                    const value = this.ckEditor.getData();
                    this.emit("value-change", {
                        type: "input",
                        id: this.item.id,
                        value
                    });
                });
            }
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
            if (this.item.wysiwyg) {
                setTimeout(() => this.ckEditor.setData(this.input.value || ""), 100);
            }
        }
        this.setState("toggleAce", toggle);
        this.forceUpdate();
    }

    onKeyValueButtonClick(e) {
        e.preventDefault();
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        this.emit("get-key-value", {
            id: dataset.id,
        });
    }

    onAceModeChange(e) {
        e.preventDefault();
        const {
            id
        } = e.target.dataset;
        if (id !== this.state.modeAce) {
            this.setState("modeAce", id);
            const value = id === "ace" ? beautify.html(this.input.value, this.beautifyOptions) : this.input.value;
            setTimeout(() => this.aceEditor.getSession().setValue(value || ""), 10);
            setTimeout(() => this.ckEditor.setData(this.input.value || ""), 10);
        }
    }
};
