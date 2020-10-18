module.exports = class {
    onCreate(input, out) {
        const state = {
            active: false,
            id: ""
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
        };
        this.i18n = out.global.i18n;
    }

    setActive(state, id) {
        this.state.id = id;
        this.state.active = state;
    }

    onCloseClick() {
        this.setActive(false);
    }
};
