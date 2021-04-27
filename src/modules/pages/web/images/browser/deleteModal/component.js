module.exports = class {
    onCreate() {
        const state = {
            active: false,
            files: ""
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
            setFiles: this.setFiles.bind(this),
        };
    }

    setActive(state) {
        this.state.active = state;
    }

    setFiles(files) {
        this.state.files = files;
    }

    onCloseClick() {
        this.setActive(false);
    }

    onConfirmClick() {
        this.setActive(false);
        this.emit("delete-confirm");
    }
};
