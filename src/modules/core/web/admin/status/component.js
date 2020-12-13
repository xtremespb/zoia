module.exports = class {
    onCreate() {
        const state = {
            active: false,
            message: "",
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
        };
    }

    setActive(state, message = "") {
        this.state.active = state;
        this.state.message = message;
    }

    onConfirmClick() {
        this.emit("confirm", this.state.url);
        this.setActive(false);
    }
};
