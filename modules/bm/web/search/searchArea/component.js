const cloneDeep = require("lodash.clonedeep");

module.exports = class {
    onCreate() {
        const state = {
            query: {}
        };
        this.state = state;
    }

    onQueryChange(newData = {}) {
        const query = cloneDeep(this.state.query);
        Object.keys(newData).map(s => {
            if (newData[s] === undefined || newData[s] === null || newData[s] === "" || (Array.isArray(newData[s]) && !newData[s].length)) {
                delete query[s];
            } else {
                query[s] = newData[s];
            }
        });
        this.state.query = query;
    }

    onDataRequest() {
        this.getComponent("bmSearchResult").func.loadData();
    }
};
