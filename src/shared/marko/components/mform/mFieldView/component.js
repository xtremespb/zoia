/* eslint-disable import/no-webpack-loader-syntax */
const {
    parse,
} = require("date-fns");
const postmodern = require("../mField/postmodern.json");

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
            setFocus: this.dummy.bind(this),
            reloadCaptcha: this.dummy.bind(this),
            performUpdate: this.performUpdate.bind(this),
            insertImage: this.dummy.bind(this),
            setHeaders: this.setHeaders.bind(this),
            setVisible: this.setVisible.bind(this),
            setEnabled: this.setEnabled.bind(this),
            setMandatory: this.setMandatory.bind(this),
            setData: this.setData.bind(this),
            getData: this.getData.bind(this),
            setOptions: this.dummy.bind(this),
        };
        this.i18n = out.global.i18n;
    }

    performUpdate() {
        switch (this.state.item.type) {
        case "tags":
            this.setState("tags", this.input.value || []);
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

    dummy() {}

    async onMount() {
        switch (this.state.item.type) {
            case "datepicker":
                this.setState("calendarValue", this.input.value);
                break;
        }
        this.emit("settled");
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

    onButtonClick(e) {
        const dataset = e.target ? (Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {}) : e;
        this.emit("button-click", {
            id: dataset.id
        });
    }

    setHeaders(headers) {
        this.headers = headers;
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
};
