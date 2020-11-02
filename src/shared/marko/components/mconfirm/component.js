module.exports = class {
    onCreate() {
        const state = {
            active: false,
            title: "",
            message: "",
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
        };
    }

    setActive(state, title = "", message = "") {
        this.state.active = state;
        this.state.title = title;
        this.state.message = message;
    }

    onCloseClick() {
        this.setActive(false);
    }

    onConfirmClick() {
        this.emit("confirm", this.state.url);
        this.setActive(false);
    }
};
