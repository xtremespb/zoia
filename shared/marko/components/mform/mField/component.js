const ace = process.browser ? require("ace-builds") : null;
const debounce = require("lodash.debounce");
const {
    v4: uuidv4
} = require("uuid");
const axios = require("axios");

if (process.browser) {
    require("ace-builds/webpack-resolver");
}

module.exports = class {
    onCreate(input) {
        const state = {
            captchaData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            captchaSecret: ""
        };
        this.state = state;
        this.item = input.item;
        this.func = {
            setFocus: this.setFocus.bind(this),
            reloadCaptcha: this.reloadCaptcha.bind(this)
        };
    }

    onUpdate() {
        switch (this.item.type) {
        case "ace":
            if (this.input.value !== this.aceEditor.getSession().getValue()) {
                this.aceEditor.getSession().setValue(this.input.value);
            }
            break;
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
            [this.aceEditorElement] = document.getElementById(this.item.id).getElementsByTagName("div");
            this.aceEditor = ace.edit(this.aceEditorElement);
            this.aceEditor.getSession().on("change", () => {
                const value = this.aceEditor.getSession().getValue();
                this.emit("value-change", {
                    type: "input",
                    id: this.item.id,
                    value
                });
            });
            break;
        }
    }

    setFocus() {
        let field;
        switch (this.item.type) {
        case "radio":
            field = this.getEl(`control_${this.item.id}_0`);
            break;
        default:
            field = this.getEl(`control_${this.item.id}`);
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
};
