const cloneDeep = require("lodash.clonedeep");

module.exports = class {
    onCreate() {
        const state = {
            items: [],
            value: []
        };
        this.state = state;
        this.func = {
            setItems: this.setItems.bind(this),
            setValue: this.setValue.bind(this),
            getValue: this.getValue.bind(this),
            getSelectData: this.getSelectData.bind(this),
        };
    }

    onMount() {
        this.state.items = [];
        this.state.value = [];
    }

    setItems(items) {
        this.state.items = items;
    }

    setValue(value) {
        this.state.value = value;
    }

    getValue() {
        const value = [];
        this.state.value.map(v => {
            const item = this.state.items.find(i => i.id === v);
            if (item) {
                value.push({
                    id: v,
                    label: item.label
                });
            }
        });
        return value;
    }

    getSelectData() {
        return this.state.value;
    }

    onInputChange(e) {
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        let data = cloneDeep(this.state.value);
        const checked = !(this.state.value.indexOf(dataset.id) > -1);
        if (data.indexOf(dataset.id) === -1 && checked) {
            data.push(dataset.id);
        }
        if (data.indexOf(dataset.id) > -1 && !checked) {
            data = data.filter(i => i !== dataset.id);
        }
        this.state.value = data;
    }
};
