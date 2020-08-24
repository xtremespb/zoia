const cloneDeep = require("lodash.clonedeep");
const {
    v4: uuidv4
} = require("uuid");

module.exports = class {
    onCreate(input, out) {
        const state = {
            active: false,
            title: "",
            error: null,
            uuid: null
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
            setTitle: this.setTitle.bind(this),
            setData: this.setData.bind(this),
            setUUID: this.setUUID.bind(this),
        };
        this.i18n = out.global.i18n;
        this.languages = out.global.languages;
        this.language = out.global.language;
    }

    setActive(active) {
        this.setState({
            active,
            error: false
        });
        if (active) {
            // setTimeout(() => this.getEl("").focus(), 10);
            setTimeout(() => this.getComponent("folderEditForm").func.autoFocus(), 10);
        }
    }

    setTitle(title = "") {
        this.setState({
            title
        });
    }

    setUUID(uuid = "") {
        this.setState({
            uuid
        });
    }

    onCloseClick() {
        this.setActive(false);
    }

    onConfirmClick(e) {
        e.preventDefault();
        this.getComponent("folderEditForm").func.submitForm();
    }

    onFormSubmit(data) {
        const langData = cloneDeep(data.__default);
        delete langData.id;
        const item = {
            id: data.__default.id,
            t: langData[this.language],
            data: langData,
            uuid: data.__default.uuid || uuidv4(),
            c: [],
            isVisible: true,
            isOpen: false,
        };
        this.emit("folder-save", {
            item,
            uuid: this.state.uuid
        });
        this.setActive(false);
    }

    setData(data) {
        this.getComponent("folderEditForm").func.setData(data);
    }
};
