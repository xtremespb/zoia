/* eslint-disable import/no-webpack-loader-syntax */
const ace = process.browser ? require("ace-builds") : null;
const ClassicEditor = process.browser ? require("@ckeditor/ckeditor5-build-classic") : null;
const beautify = require("js-beautify");
const throttle = require("lodash.throttle");
const {
    v4: uuidv4
} = require("uuid");
const {
    parse,
} = require("date-fns");
const axios = require("axios");
const cloneDeep = require("lodash.clonedeep");
const CKEditorImageUploadAdapter = require("./CKEditorImageUploadAdapter");
const postmodern = require("./postmodern.json");

// Polyfill for Object.fromEntries (missing in CKEditor)
if (!Object.fromEntries) {
    Object.defineProperty(Object, "fromEntries", {
        value(entries) {
            if (!entries || !entries[Symbol.iterator]) {
                throw new Error("Object.fromEntries() requires a single iterable argument");
            }
            const o = {};
            Object.keys(entries).forEach((key) => {
                const [k, v] = entries[key];
                o[k] = v;
            });
            return o;
        },
    });
}

if (process.browser) {
    // require("ace-builds/webpack-resolver");
    ace.config.setModuleUrl("ace/mode/html_worker", require("file-loader?name=npm.ace-builds.worker-html.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/worker-html.js"));
    ace.config.setModuleUrl("ace/mode/css_worker", require("file-loader?name=npm.ace-builds.worker-css.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/worker-css.js"));
    ace.config.setModuleUrl("ace/mode/javascript_worker", require("file-loader?name=npm.ace-builds.worker-javascript.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/worker-javascript.js"));
    ace.config.setModuleUrl("ace/mode/html", require("file-loader?name=npm.ace-builds.mode-html.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-html.js"));
    ace.config.setModuleUrl("ace/mode/javascript", require("file-loader?name=npm.ace-builds.mode-javascript.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-javascript.js"));
    ace.config.setModuleUrl("ace/mode/css", require("file-loader?name=npm.ace-builds.mode-css.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-css.js"));
    ace.config.setModuleUrl("ace/theme/chrome", require("file-loader?name=npm.ace-builds.theme-chrome.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/theme-chrome.js"));
    ace.config.setModuleUrl("ace/mode/json", require("file-loader?name=npm.ace-builds.mode-json.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/mode-json.js"));
    ace.config.setModuleUrl("ace/mode/json_worker", require("file-loader?name=npm.ace-builds.worker-json.[contenthash:8].js&esModule=false!../../../../../../node_modules/ace-builds/src-noconflict/worker-json.js"));
}

// eslint-disable-next-line no-unused-vars
function AddClassToAllHeading1(editor) {
    // Both the data and the editing pipelines are affected by this conversion.
    // editor.conversion.for("downcast").add(dispatcher => {
    //     // Headings are represented in the model as a "heading1" element.
    //     // Use the "low" listener priority to apply the changes after the headings feature.
    //     dispatcher.on("insert:heading1", (evt, data, conversionApi) => {
    //         const viewWriter = conversionApi.writer;
    //         viewWriter.addClass("title", conversionApi.mapper.toViewElement(data.item));
    //         viewWriter.addClass("is-1", conversionApi.mapper.toViewElement(data.item));
    //     }, {
    //         priority: "low"
    //     });
    // });
}

module.exports = class {
    onCreate(input, out) {
        const state = {
            captchaData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            captchaSecret: "",
            toggleAce: {},
            modeAce: input.item.source ? "ace" : "ck",
            visible: true,
            enabled: true,
            mandatory: input.item.mandatory,
            item: input.item,
            imageDragging: false,
            calendarValue: null,
            tags: [],
            tagInputValue: null,
            pmCurrentItem: Object.keys(postmodern.items)[0],
            pmEditItem: null,
            pmItemDragging: false,
            pmItemDeleteIndex: null,
        };
        this.state = state;
        this.func = {
            setFocus: this.setFocus.bind(this),
            reloadCaptcha: this.reloadCaptcha.bind(this),
            performUpdate: this.performUpdate.bind(this),
            insertImage: this.insertImage.bind(this),
            setHeaders: this.setHeaders.bind(this),
            setVisible: this.setVisible.bind(this),
            setEnabled: this.setEnabled.bind(this),
            setMandatory: this.setMandatory.bind(this),
            setData: this.setData.bind(this),
            getData: this.getData.bind(this),
            setAceValue: this.setAceValue.bind(this),
            getAceInstance: this.getAceInstance.bind(this),
            setOptions: this.setOptions.bind(this),
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
        this.i18n = out.global.i18n;
    }

    performUpdate() {
        switch (this.state.item.type) {
        case "ace":
            throttle(this.updateAce.bind(this), 300)();
            break;
        case "tags":
            this.setState("tags", this.input.value || []);
            break;
        case "datepicker":
            this.updateDatePicker(this.input.value);
            break;
        case "imask":
            this.emit("value-change", {
                type: "imask",
                id: this.state.item.id,
                value: this.input.value,
            });
            break;
        }
    }

    insertImage(url) {
        switch (this.state.item.type) {
        case "ace":
            if (this.state.modeAce === "ace") {
                const imgTag = `<img src="${url}" alt=""/>`;
                this.aceEditor.getSession().insert(this.aceEditor.getCursorPosition(), imgTag);
            } else if (this.ckEditor) {
                const viewFragment = this.ckEditor.data.processor.toView(`<img src="${url}" alt=""/>`);
                const modelFragment = this.ckEditor.data.toModel(viewFragment);
                this.ckEditor.model.change(writer => {
                    writer.insert(modelFragment, this.ckEditor.model.document.selection.getFirstPosition());
                });
            }
            break;
        }
    }

    setAceValue(value) {
        if (!this.aceEditor) {
            return;
        }
        this.aceEditor.getSession().setValue(value);
    }

    getAceInstance() {
        if (!this.aceEditor) {
            return;
        }
        return this.aceEditor;
    }

    updateAce() {
        if (!this.aceEditor) {
            return;
        }
        const value = (this.state.modeAce === "ace" && this.state.item.aceOptions && this.state.item.aceOptions.mode === "ace/mode/html" ? beautify.html(this.input.value, this.beautifyOptions) : this.input.value) || "";
        this.aceEditor.getSession().setValue(value);
        if (this.state.item.wysiwyg && this.ckEditor) {
            this.ckEditor.setData(value);
        }
    }

    async reloadCaptcha() {
        if (this.state.item.type === "captcha") {
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

    async initCkEditor() {
        this.ckEditorElement = this.getEl(`mf_ctl_ckeditor_${this.input.item.id}`) || document.getElementById(`mf_ctl_ckeditor_${this.input.item.id}`);
        const ckEditorConfig = {
            link: {
                decorators: {
                    isExternal: {
                        mode: "manual",
                        label: this.i18n.t("mForm.ck.newTab"),
                        attributes: {
                            target: "_blank"
                        }
                    }
                }
            },
        };
        if (this.input.item.simple) {
            ClassicEditor.defaultConfig = {
                ...ckEditorConfig,
                removePlugins: ["ImageToolbar", "ImageCaption", "ImageStyle"],
                toolbar: {
                    items: [
                        "bold",
                        "italic",
                        "|",
                        "link",
                        "|",
                        "bulletedList",
                        "numberedList",
                        "|",
                        "undo",
                        "redo"
                    ]
                },
            };
        }
        this.ckEditor = await ClassicEditor.create(this.ckEditorElement, {
            extraPlugins: [AddClassToAllHeading1],
        });
        if (!this.input.item.simple) {
            this.ckEditor.plugins.get("FileRepository").createUploadAdapter = loader => {
                this.ckEditorImageUploadAdapter = new CKEditorImageUploadAdapter(loader, {
                    url: "/api/core/mform/image/upload",
                    headers: this.headers
                });
                return this.ckEditorImageUploadAdapter;
            };
        }
        this.ckEditor.model.document.on("change:data", () => {
            const value = this.ckEditor.getData();
            this.emit("value-change", {
                type: "input",
                id: this.state.item.id,
                value
            });
        });
    }

    updateDatePicker(value) {
        if (value) {
            this.calendarField.func.setDate(value);
            this.setState("calendarValue", value);
            const dateObject = typeof value === "string" ? parse(value, "yyyyMMdd", new Date()) : value;
            this.emit("value-change", {
                type: "datepicker",
                id: this.state.item.id,
                value: dateObject,
            });
        } else {
            this.emit("value-change", {
                type: "datepicker",
                id: this.state.item.id,
                value: null,
            });
        }
    }

    async onMount() {
        await this.reloadCaptcha();
        switch (this.state.item.type) {
        case "ace":
            if (!document.getElementById(`${this.input.id}_${this.state.item.id}_ace`)) {
                return;
            }
            setTimeout(() => {
                [this.aceEditorElement] = document.getElementById(`${this.input.id}_${this.state.item.id}_ace`).getElementsByTagName("div");
                this.aceEditor = ace.edit(this.aceEditorElement);
                const aceDefaults = {
                    mode: "ace/mode/html",
                    theme: "ace/theme/chrome",
                    fontSize: "16px",
                    wrap: true,
                    useSoftTabs: true,
                    tabSize: 2
                };
                this.aceEditor.setOptions(this.state.item.aceOptions ? {
                    ...aceDefaults,
                    ...this.state.item.aceOptions
                } : aceDefaults);
                this.aceEditor.getSession().on("change", () => {
                    const value = this.aceEditor.getSession().getValue();
                    this.emit("value-change", {
                        type: "input",
                        id: this.state.item.id,
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
                if (this.state.item.wysiwyg && !this.state.item.source) {
                    this.initCkEditor();
                }
            });
            break;
        case "tags":
            document.addEventListener("click", e => {
                const tagsWrap = document.getElementById(`${this.input.id}_${this.state.item.id}_wrap`);
                if (tagsWrap && !tagsWrap.contains(e.target)) {
                    tagsWrap.classList.remove("z3-mf-tags-wrap-focus");
                }
            });
            break;
        case "datepicker":
            this.calendarField = this.getComponent(`${this.input.id}_${this.state.item.id}_datepicker_field`);
            this.setState("calendarValue", this.input.value);
            document.addEventListener("click", e => {
                const calendarArea = document.getElementById(`${this.input.id}_${this.state.item.id}_datepicker`);
                if (this.state.calendarVisible && calendarArea && !calendarArea.contains(e.target)) {
                    document.dispatchEvent(new CustomEvent("z3HideCalendar", {
                        reopen: false
                    }));
                }
                this.setCalendarNullValue();
            });
            document.addEventListener("z3HideCalendar", () => {
                this.hideCalendar();
            }, false);
            break;
        }
        this.emit("settled");
    }

    setFocus() {
        let field;
        switch (this.state.item.type) {
        case "radio":
            field = this.getEl(`mf_ctl_${this.state.item.id}_0`);
            break;
        default:
            field = this.getEl(`mf_ctl_${this.state.item.id}`);
        }
        if (field) {
            field.focus();
            if (this.getAceInstance()) {
                this.getAceInstance().focus();
            }
        }
    }

    onRangeFieldValueChange(e) {
        const field = this.getEl(`mf_ctl_${this.state.item.id}`);
        if (field) {
            field.focus();
        }
        this.onFieldValueChange(e);
    }

    onFieldValueChange(e) {
        const event = Object.keys(e.target.dataset).length ? {
            dataset: e.target.dataset,
            value: e.target.value
        } : Object.keys(e.target.parentNode.dataset).length ? {
            dataset: e.target.parentNode.dataset,
            value: e.target.parentNode.value
        } : Object.keys(e.target.parentNode.parentNode.dataset).length ? {
            dataset: e.target.parentNode.parentNode.dataset,
            value: e.target.parentNode.parentNode.value
        } : {};
        this.emit("value-change", {
            type: "input",
            id: event.dataset.id,
            value: event.value
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

    onImageInputChange(e) {
        this.emit("value-change", {
            id: e.target.dataset.id,
            type: "images",
            value: Array.from(e.target.files).map((file, index) => {
                const fileData = e.target.files[index];
                const uid = uuidv4();
                fileData.zuid = uid;
                return {
                    type: "image",
                    name: file.name,
                    id: uid,
                    data: e.target.files[index],
                };
            })
        });
    }

    onSingleImageInputChange(e) {
        this.emit("value-change", {
            id: e.target.dataset.id,
            type: "image",
            value: Array.from(e.target.files).map((file, index) => {
                const fileData = e.target.files[index];
                const uid = uuidv4();
                fileData.zuid = uid;
                return {
                    type: "image",
                    name: file.name,
                    id: uid,
                    data: e.target.files[index],
                    instant: this.input.item.instant,
                };
            })
        });
    }

    onSingleImageRemove(e) {
        e.preventDefault();
        const dataset = e.target ? (Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {}) : e;
        this.emit("value-change", {
            id: dataset.id,
            type: "image",
            value: []
        });
    }

    onFileRemove(e) {
        const dataset = e.target ? (Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {}) : e;
        this.emit("remove-arr-item", {
            id: dataset.id,
            itemid: dataset.itemid
        });
    }

    onButtonClick(e) {
        const dataset = e.target ? (Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {}) : e;
        this.emit("button-click", {
            id: dataset.id
        });
    }

    onAceToggleClick(e) {
        e.preventDefault();
        const dataset = e.target ? (Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {}) : e;
        const toggle = cloneDeep(this.state.toggleAce);
        toggle[dataset.id] = !toggle[dataset.id];
        if (toggle[dataset.id]) {
            setTimeout(() => this.aceEditor.getSession().setValue(this.input.value || ""), 100);
            if (this.state.item.wysiwyg && this.ckEditor) {
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

    async onAceModeChange(e) {
        e.preventDefault();
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        if (dataset.id !== this.state.modeAce) {
            this.setState("modeAce", dataset.id);
            const value = dataset.id === "ace" ? beautify.html(this.input.value, this.beautifyOptions) : this.input.value;
            if (dataset.id === "ace") {
                if (this.ckEditor) {
                    this.ckEditor.destroy();
                }
                setTimeout(() => this.aceEditor.getSession().setValue(value || ""), 10);
            } else {
                await this.initCkEditor();
                setTimeout(() => this.ckEditor.setData(this.input.value || ""), 10);
            }
        }
    }

    onImageBrowser(e) {
        e.preventDefault();
        const width = window.screen.width > 768 ? window.screen.width / 2 : window.screen.width;
        const height = window.screen.width > 768 ? window.screen.height / 2 : window.screen.height;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 4;
        window.open(this.i18n.getLocalizedURL("/z3/core/images"), "", `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`);
    }

    setHeaders(headers) {
        this.headers = headers;
    }

    onContextMenu(e) {
        const fileId = e.target.dataset ? e.target.dataset.mfimageid : e.target.parentNode && e.target.parentNode.dataset && e.target.parentNode.dataset.mfimageid ? e.target.parentNode.dataset.mfimageid : e.target.parentNode && e.target.parentNode.parentNode && e.target.parentNode.parentNode.dataset && e.target.parentNode.parentNode.dataset.mfimageid ? e.target.parentNode.parentNode.dataset.mfimageid : null;
        if (fileId) {
            e.stopPropagation();
            e.preventDefault();
            this.emit("context-menu", {
                x: e.pageX,
                y: e.pageY,
                id: fileId,
                fieldId: this.input.item.id
            });
        }
    }

    setVisible(flag) {
        this.state.visible = flag;
    }

    setEnabled(flag) {
        this.state.enabled = flag;
    }

    setMandatory(flag) {
        this.state.mandatory = flag;
    }

    setData(data) {
        this.setState("item", {
            ...this.state.item,
            ...data
        });
    }

    getData() {
        return this.state.item;
    }

    onImageDragStart(e) {
        const dataset = e.target ? (Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {}) : e;
        e.dataTransfer.setData("text/plain", `__z3_mform_${this.input.item.id}_${dataset.mfimageid}`);
        this.state.imageDragging = true;
    }

    onImageDragEnd() {
        this.state.imageDragging = false;
    }

    onImageDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        e.target.classList.add("z3-mf-drop-area-over");
    }

    onImageDrop(e) {
        e.preventDefault();
        const value = cloneDeep(this.input.value);
        const data = e.dataTransfer.getData("text/plain");
        const rx = new RegExp(`^__z3_mform_${this.input.item.id}_`);
        if (!data || typeof data !== "string" || !rx.test(data)) {
            return false;
        }
        const id = data.replace(rx, "");
        let idxDest = parseInt(e.target.dataset.index, 10);
        if (idxDest === value.length - 1) {
            idxDest -= 1;
        }
        const idx = value.findIndex(i => i.id === id);
        if (idxDest === -1) {
            value.splice(value.length - 1, 0, value.splice(idx, 1)[0]);
        } else if (idx !== idxDest) {
            value.splice(idxDest, 0, value.splice(idx, 1)[0]);
        }
        this.emit("value-set", {
            id: this.input.item.id,
            value
        });
    }

    onImageDragLeave(e) {
        e.target.classList.remove("z3-mf-drop-area-over");
    }

    onImageDragEnter(e) {
        e.preventDefault();
    }

    onDatePickerInputClick(e) {
        e.stopPropagation();
        document.dispatchEvent(new Event("z3HideCalendar"));
        this.setState("calendarVisible", true);
    }

    onCalendarValueChange(value) {
        this.updateDatePicker(value);
        this.setState("calendarVisible", false);
    }

    onCalendarClearClick() {
        this.updateDatePicker(null);
        this.setState("calendarVisible", false);
    }

    setCalendarNullValue() {
        const element = document.getElementById(`${this.input.id}_${this.state.item.id}`);
        if (element && element.value.match(/_/)) {
            this.setState("calendarValue", null);
            this.emit("value-change", {
                type: "datepicker",
                id: this.state.item.id,
                value: null,
                noMaskUpdate: null,
            });
        }
    }

    onDatePickerKeyPress(e) {
        if ((e.which || e.keyCode) === 9) {
            this.setCalendarNullValue();
            this.setState("calendarVisible", false);
            return;
        }
        setTimeout(() => {
            const element = document.getElementById(`${this.input.id}_${this.state.item.id}`);
            if (element && !element.value.match(/_/)) {
                const dateObject = parse(element.value, this.i18n.t("global.dateFormatShort"), new Date());
                this.setState("calendarValue", dateObject);
                this.emit("value-change", {
                    type: "datepicker",
                    id: this.state.item.id,
                    value: dateObject,
                    noMaskUpdate: true,
                });
                this.calendarField.func.setDate(dateObject);
            }
        });
    }

    onIMaskKeyPress() {
        setTimeout(() => {
            const element = document.getElementById(`${this.input.id}_${this.state.item.id}`);
            const value = (element.value || "").trim();
            this.emit("value-change", {
                type: "imask",
                id: this.state.item.id,
                value,
                noMaskUpdate: true,
            });
        });
    }

    hideCalendar(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        this.setState("calendarVisible", false);
    }

    onTagsWrapClick() {
        document.getElementById(`${this.input.id}_${this.state.item.id}_input`).focus();
    }

    onTagCloseClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(e.target.dataset.index, 10);
        const tags = cloneDeep(this.state.tags).filter((t, i) => i !== index);
        this.setState("tags", tags);
        document.getElementById(`${this.input.id}_${this.state.item.id}_input`).focus();
        this.emit("value-change", {
            type: "tags",
            id: this.state.item.id,
            value: tags
        });
    }

    onTagClick(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById(`${this.input.id}_${this.state.item.id}_wrap`).classList.add("z3-mf-tags-wrap-focus");
    }

    onTagsInputFocus() {
        document.getElementById(`${this.input.id}_${this.state.item.id}_wrap`).classList.add("z3-mf-tags-wrap-focus");
    }

    onTagsInputBlur() {
        document.getElementById(`${this.input.id}_${this.state.item.id}_wrap`).classList.remove("z3-mf-tags-wrap-focus");
    }

    onTagsInputKeyup(e) {
        const inputField = document.getElementById(`${this.input.id}_${this.state.item.id}_input`);
        const value = inputField.value ? inputField.value.trim() : null;
        let changed;
        if (value && e.keyCode === 13) {
            e.preventDefault();
            const tags = cloneDeep(this.state.tags);
            tags.push(value);
            this.setState("tags", tags);
            inputField.value = "";
            changed = true;
        }
        if (!value && this.state.tags.length && e.keyCode === 8) {
            e.preventDefault();
            const tags = cloneDeep(this.state.tags).filter((t, i) => i !== this.state.tags.length - 1);
            this.setState("tags", tags);
            changed = true;
        }
        if (changed) {
            this.emit("value-change", {
                type: "tags",
                id: this.state.item.id,
                value: this.state.tags
            });
        }
    }

    onTagsInputChange(e) {
        const {
            value
        } = e.target;
        this.setState("tagInputValue", value);
    }

    setOptions(options) {
        const item = cloneDeep(this.state.item);
        item.options = options;
        this.setState("item", item);
    }

    onSelectPmChange(e) {
        e.preventDefault();
        this.setState("pmCurrentItem", e.target.value);
    }

    onPmAddClick(e) {
        e.preventDefault();
        const pmEditItem = this.state.pmCurrentItem;
        this.setState("pmEditItem", pmEditItem);
        this.getComponent(`${this.input.id}_${this.input.item.id}_pm`).func.showModal(this.state.pmEditItem);
    }

    onPmPreviewClick(e) {
        e.preventDefault();
        const value = cloneDeep(this.input.value);
        this.getComponent(`${this.input.id}_${this.input.item.id}_preview`).func.showModal(value);
    }

    pmMove(e, direction) { // 1 = up, 2 = down
        e.preventDefault();
        const datasetButton = e.target.closest(".z3-mf-pm-list-button").dataset;
        const index = parseInt(datasetButton.index, 10);
        const value = cloneDeep(this.input.value);
        if (direction === "up") {
            [value[index - 1], value[index]] = [value[index], value[index - 1]];
            if (!value[index - 1] || !value[index]) {
                return;
            }
        } else {
            [value[index], value[index + 1]] = [value[index + 1], value[index]];
            if (!value[index] || !value[index + 1]) {
                return;
            }
        }
        this.emit("value-change", {
            type: "postmodern",
            id: this.state.item.id,
            value,
        });
    }

    onPmMoveUpClick(e) {
        this.pmMove(e, "up");
    }

    onPmMoveDownClick(e) {
        this.pmMove(e, "down");
    }

    onPmEditClick(e) {
        e.preventDefault();
        const datasetButton = e.target.closest(".z3-mf-pm-list-button").dataset;
        const index = parseInt(datasetButton.index, 10);
        const value = cloneDeep(this.input.value);
        this.setState("pmEditItem", value[index].type);
        this.getComponent(`${this.input.id}_${this.input.item.id}_pm`).func.showModal(value[index].type, index, value[index]);
    }

    onPmDeleteClick(e) {
        e.preventDefault();
        const datasetButton = e.target.closest(".z3-mf-pm-list-button").dataset;
        const index = parseInt(datasetButton.index, 10);
        this.setState("pmItemDeleteIndex", index);
        this.getComponent(`${this.input.id}_${this.input.item.id}_confirm`).func.setActive(true, this.i18n.t("mForm.pm.itemDeleteConfirmTitle"), this.i18n.t("mForm.pm.itemDeleteConfirmText"));
    }

    onPmItemDragStart(e) {
        this.state.pmItemDragging = true;
        const datasetItem = e.target.closest(".z3-mf-pm-list-text").dataset;
        const index = parseInt(datasetItem.index, 10);
        e.dataTransfer.setData("text/plain", `__z3_mform_${this.input.id}_${this.input.item.id}_${index}`);
    }

    onPmItemDragEnd() {
        this.state.pmItemDragging = false;
        Array.from(document.querySelectorAll(".z3-mf-pm-list-divider")).forEach((el) => el.classList.remove("z3-mf-pm-list-divider-hover"));
    }

    onPmItemDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        e.target.classList.add("z3-mf-pm-list-divider-hover");
    }

    onPmItemDragLeave(e) {
        e.target.classList.remove("z3-mf-pm-list-divider-hover");
    }

    onPmItemDrop(e) {
        e.preventDefault();
        const value = cloneDeep(this.input.value);
        const dataTransfer = e.dataTransfer.getData("text/plain");
        const rx = new RegExp(`^__z3_mform_${this.input.id}_${this.input.item.id}_`);
        if (!dataTransfer || typeof dataTransfer !== "string" || !rx.test(dataTransfer)) {
            return false;
        }
        const datasetDest = e.target.closest(".z3-mf-pm-list-divider").dataset;
        const indexSrc = parseInt(dataTransfer.replace(rx, ""), 10);
        let indexDest = parseInt(datasetDest.index, 10);
        if (indexSrc === indexDest) {
            return false;
        }
        if (indexDest === value.length - 1) {
            indexDest -= 1;
        }
        if (indexDest === -1) {
            value.splice(value.length - 1, 0, value.splice(indexSrc, 1)[0]);
        } else if (indexSrc !== indexDest) {
            value.splice(indexDest, 0, value.splice(indexSrc, 1)[0]);
        }
        this.emit("value-change", {
            type: "postmodern",
            id: this.state.item.id,
            value,
        });
    }

    onPmItemDeleteConfirm() {
        const value = cloneDeep(this.input.value);
        value.splice(this.state.pmItemDeleteIndex, 1);
        this.emit("value-change", {
            type: "postmodern",
            id: this.state.item.id,
            value,
        });
    }

    onPmItemSave(obj) {
        const value = cloneDeep(this.input.value);
        const item = obj && obj.index ? value[obj.index] : {};
        item.title = obj.data.title;
        item.type = this.state.pmEditItem;
        item.id = item.id || uuidv4();
        item.data = obj.data;
        if (obj.index !== null) {
            value[obj.index] = item;
        } else {
            value.push(item);
        }
        this.emit("value-change", {
            type: "postmodern",
            id: this.state.item.id,
            value,
        });
    }
};
