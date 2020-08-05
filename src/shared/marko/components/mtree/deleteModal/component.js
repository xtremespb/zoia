module.exports = class {
    onCreate() {
        const state = {
            active: false,
            items: ""
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
            setItems: this.setItems.bind(this),
        };
    }

    setActive(state) {
        this.state.active = state;
    }

    setItems(items) {
        this.state.items = items;
    }

    onCloseClick() {
        this.setActive(false);
    }

    onConfirmClick() {
        this.setActive(false);
        this.emit("delete-confirm");
    }
};
