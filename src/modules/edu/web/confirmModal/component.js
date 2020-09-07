module.exports = class {
    onCreate() {
        const state = {
            active: false,
            title: "",
            message: "",
            url: null
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
            setTitle: this.setTitle.bind(this),
            setMessage: this.setMessage.bind(this),
            setURL: this.setURL.bind(this),
        };
    }

    setActive(state) {
        this.state.active = state;
    }

    setMessage(message) {
        this.state.message = message;
    }

    setURL(url) {
        this.state.url = url;
    }

    setTitle(title) {
        this.state.title = title;
    }

    onCloseClick() {
        this.setActive(false);
    }

    onConfirmClick() {
        this.emit("confirm", this.state.url);
        this.setActive(false);
    }
};
