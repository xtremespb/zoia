module.exports = class {
    onCreate() {
        const state = {
        };
        this.func = {
            getData: this.getData.bind(this),
            setData: this.setData.bind(this),
        };
        this.state = state;
    }

    async getData() {
        const form = this.getComponent(`${this.input.id}_pmForm`);
        if (!(await form.func.submitForm())) {
            return null;
        }
        return form.func.serialize();
    }

    async setData(data) {
        const form = this.getComponent(`${this.input.id}_pmForm`);
        form.func.setData(data);
    }
};
