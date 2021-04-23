/* eslint-disable import/no-webpack-loader-syntax */
const ace = process.browser ? require("ace-builds") : null;
const ClassicEditor = process.browser ? require("@ckeditor/ckeditor5-build-classic") : null;
const beautify = require("js-beautify");
const throttle = require("lodash.throttle");
const {
    v4: uuidv4
} = require("uuid");
const {
    addDays,
    startOfWeek,
} = require("date-fns");
const axios = require("axios");
const {
    cloneDeep
} = require("lodash");
const CKEditorImageUploadAdapter = require("./CKEditorImageUploadAdapter");

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
            calendar: {
                data: [],
                year: new Date().getFullYear(),
                month: new Date().getMonth(),
                day: new Date().getDay(),
                visible: false,
                selected: {
                    d: null,
                    m: null,
                    y: null
                },
            }
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

    updateDatePicker() {
        if (!this.calendar) {
            return;
        }
        const value = this.input.value || {
            start: null,
            end: null,
        };
        if (value.start) {
            this.calendar.startDate = value.start;
        }
        if (value.end) {
            this.calendar.endDate = value.end;
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
        this.ckEditorElement = this.getEl(`mf_ctl_ckeditor_${this.input.item.id}`);
        this.ckEditor = await ClassicEditor.create(this.ckEditorElement, {
            extraPlugins: [AddClassToAllHeading1],
        });
        this.ckEditor.plugins.get("FileRepository").createUploadAdapter = loader => {
            this.ckEditorImageUploadAdapter = new CKEditorImageUploadAdapter(loader, {
                url: "/api/core/mform/image/upload",
                headers: this.headers
            });
            return this.ckEditorImageUploadAdapter;
        };
        this.ckEditor.model.document.on("change:data", () => {
            const value = this.ckEditor.getData();
            this.emit("value-change", {
                type: "input",
                id: this.state.item.id,
                value
            });
        });
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
        case "datepicker":
            const calendar = cloneDeep(this.state.calendar);
            calendar.data = this.updateCalendarData(this.state.calendar.year, this.state.calendar.month);
            this.setState("calendar", calendar);
            document.addEventListener("click", e => {
                const calendarArea = document.getElementById(`${this.input.id}_${this.state.item.id}_datepicker`);
                if (this.state.calendar.visible && !calendarArea.contains(e.target)) {
                    const calendarState = cloneDeep(this.state.calendar);
                    calendarState.visible = false;
                    this.setState("calendar", calendarState);
                }
            });
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

    updateCalendarData(year, month) {
        const startDate = startOfWeek(new Date(year, month, 1), {
            weekStartsOn: parseInt(this.i18n.t("global.weekStart"), 10)
        });
        const rows = 6;
        const cols = 7;
        const length = rows * cols;
        const data = Array.from({
                length
            })
            .map((_, index) => ({
                d: addDays(startDate, index).getDate(),
                m: addDays(startDate, index).getMonth(),
                y: addDays(startDate, index).getFullYear()
            }))
            .reduce((matrix, current, index, days) => !(index % cols !== 0) ? [...matrix, days.slice(index, index + cols)] : matrix, []);
        if (data[5][0].d < 10) {
            data.splice(5, 1);
        }
        return data;
    }

    onCalendarLeft(e) {
        e.preventDefault();
        const calendarOptions = cloneDeep(this.state.calendar);
        calendarOptions.month -= 1;
        if (calendarOptions.month < 0) {
            calendarOptions.month = 11;
            calendarOptions.year -= 1;
        }
        calendarOptions.data = this.updateCalendarData(calendarOptions.year, calendarOptions.month);
        this.setState("calendar", calendarOptions);
    }

    onCalendarRight(e) {
        e.preventDefault();
        const calendarOptions = cloneDeep(this.state.calendar);
        calendarOptions.month += 1;
        if (calendarOptions.month > 11) {
            calendarOptions.month = 0;
            calendarOptions.year += 1;
        }
        calendarOptions.data = this.updateCalendarData(calendarOptions.year, calendarOptions.month);
        this.setState("calendar", calendarOptions);
    }

    onDatePickerInputClick(e) {
        e.stopPropagation();
        const calendarOptions = cloneDeep(this.state.calendar);
        calendarOptions.visible = !calendarOptions.visible;
        this.setState("calendar", calendarOptions);
    }

    onCalendarCellClick(e) {
        if (e.target && e.target.dataset && e.target.dataset.y) {
            const {
                d,
                m,
                y
            } = e.target.dataset;
            const calendarOptions = cloneDeep(this.state.calendar);
            calendarOptions.selected = {
                d: parseInt(d, 10),
                m: parseInt(m, 10),
                y: parseInt(y, 10)
            };
            calendarOptions.visible = false;
            this.setState("calendar", calendarOptions);
        }
    }
};
