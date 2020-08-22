module.exports = class {
    onCreate() {
        const state = {
            active: false,
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
        };
    }

    setActive(state) {
        this.state.active = state;
    }

    onCloseClick() {
        this.setActive(false);
    }

    onConfirmClick() {
        this.setActive(false);
        this.emit("confirm", {});
    }
};
