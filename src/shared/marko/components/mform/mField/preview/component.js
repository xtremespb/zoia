module.exports = class {
    onCreate() {
        const state = {
            data: null,
            modalActive: false,
        };
        this.func = {
            showModal: this.showModal.bind(this),
        };
        this.state = state;
    }

    onModalClose(e) {
        e.preventDefault();
        this.setState("modalActive", false);
    }

    showModal(data = []) {
        this.setState("modalActive", true);
        this.setState("data", data);
    }
};
