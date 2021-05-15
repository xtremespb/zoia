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
        this.setState("active", state);
        this.setState("title", title);
        this.setState("message", message);
    }

    onCloseClick() {
        this.setActive(false);
    }

    onConfirmClick() {
        this.emit("confirm", this.state.url);
        this.setActive(false);
    }
};
