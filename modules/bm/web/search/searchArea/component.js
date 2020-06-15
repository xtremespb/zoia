const cloneDeep = require("lodash.clonedeep");

module.exports = class {
    onCreate() {
        const state = {
            query: {},
            currentQuery: {},
            loading: false
        };
        this.state = state;
    }

    onQueryChange(newData = {}) {
        const query = cloneDeep(this.state.query);
        Object.keys(newData).map(s => {
            if (newData[s] === undefined || newData[s] === null || newData[s] === "" || (Array.isArray(newData[s]) && !newData[s].length) || Number.isNaN(newData[s])) {
                delete query[s];
            } else {
                query[s] = newData[s];
            }
        });
        this.state.query = query;
        this.getComponent("bmSearchResult").func.setChangedQuery(this.state.query);
    }

    onDataRequest() {
        this.getComponent("bmSearchResult").func.loadChangedData();
    }

    onPageChange() {
        this.getComponent("bmSearchFilter").func.hideFilter();
    }

    onTriggerFilter() {
        this.getComponent("bmSearchFilter").func.triggerFilter();
    }

    onLoading(loading) {
        this.state.loading = loading;
    }
};
