module.exports = class {
    onCreate(input, out) {
        const state = {
            active: false,
            lockedBy: "",
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
        };
        this.i18n = out.global.i18n;
    }

    setActive(active, lockedBy) {
        this.setState({
            active,
            lockedBy,
        });
    }

    onCloseClick() {
        this.setActive(false);
    }
};
