module.exports = class {
    onCreate(input, out) {
        const state = {
            active: false,
            errors: [],
            fatal: false
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
        };
        this.i18n = out.global.i18n;
    }

    setActive(state, errors, fatal) {
        this.state.errors = errors;
        this.state.fatal = fatal;
        this.state.active = state;
    }

    onCloseClick() {
        this.setActive(false);
    }

    async onConfirmClick() {
        if (this.state.fatal) {
            return;
        }
        this.setActive(false);
        this.emit("confirm-click");
    }
};
