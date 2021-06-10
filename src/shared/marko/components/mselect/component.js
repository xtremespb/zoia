const cloneDeep = require("lodash.clonedeep");

module.exports = class {
    onCreate() {
        const state = {
            items: [],
            value: [],
            searchValue: "",
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
        this.itemsSave = items;
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
        this.emit("value-change", this.getValue());
    }

    onSelectAllClick() {
        const value = [];
        this.state.items.map(i => value.push(i.id));
        this.setState("value", value);
    }

    onSelectNoneClick() {
        this.setState("value", []);
    }

    onSearchInput(e) {
        const searchValue = e.target.value.trim();
        this.setState("searchValue", searchValue);
        if (searchValue.length) {
            const searchRex = new RegExp(`${searchValue}`, "igm");
            console.log(searchRex);
            const items = this.itemsSave.filter(i => searchRex.test(i.label));
            this.setState("items", items);
        } else {
            this.setState("items", this.itemsSave);
        }
    }
};
