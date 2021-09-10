module.exports = class {
    onCreate() {
        const state = {
            type: null,
            data: null,
            index: null,
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

    showModal(type, index = null, item = {}) {
        this.setState("type", type);
        this.setState("index", index);
        this.setState("data", item);
        this.setState("modalActive", true);
        setTimeout(() => {
            if (Object.keys(item).length) {
                const pmComponent = this.getComponent(`${this.input.id}_${this.state.type}`);
                pmComponent.func.setData(item.data);
            }
        });
    }

    onFormSubmit(e) {
        e.stopPropagation();
        this.onPmSave(e);
    }

    async onPmSave(e) {
        e.preventDefault();
        const pmComponent = this.getComponent(`${this.input.id}_${this.state.type}`);
        const data = await pmComponent.func.getData();
        if (!data) {
            return;
        }
        this.emit("save", {
            index: this.state.index,
            data,
        });
        this.onModalClose(e);
    }
};
