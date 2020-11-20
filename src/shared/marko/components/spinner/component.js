module.exports = class {
    onCreate() {
        const state = {
            active: false
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this)
        };
    }

    setActive(flag) {
        this.setState("active", flag);
    }
};
