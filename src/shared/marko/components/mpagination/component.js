module.exports = class {
    onCreate() {
        this.initialState = {
            page: 1,
            paginationData: []
        };
        this.state = this.initialState;
        this.func = {
            reset: this.reset.bind(this),
            setPage: this.setPage.bind(this),
            generatePagination: this.generatePagination.bind(this),
        };
    }

    reset() {
        this.setState("page", 1);
        this.setState("paginationData", []);
    }

    setPage(page) {
        this.setState("page", page);
    }

    generatePagination(pagesCount) {
        const delta = 2;
        const range = [];
        const count = parseInt(pagesCount, 10);
        if (Number.isNaN(count) || count <= 1) {
            this.setState("paginationData", range);
            return range;
        }
        const page = parseInt(this.state.page, 10);
        for (let i = Math.max(2, page - delta); i <= Math.min(count - 1, page + delta); i += 1) {
            range.push({
                type: "page",
                active: page === i,
                page: i
            });
        }
        if (page - delta > 2) {
            range.unshift({
                type: "dots"
            });
        }
        if (page + delta < count - 1) {
            range.push({
                type: "dots"
            });
        }
        range.unshift({
            type: "page",
            active: page === 1,
            page: 1
        });
        range.push({
            type: "page",
            active: page === count,
            page: count
        });
        this.setState("paginationData", range);
        return range;
    }

    onPageClick(e) {
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        if (dataset.page === this.state.page) {
            return;
        }
        this.setState("page", dataset.page);
        this.emit("page-click", parseInt(dataset.page, 10));
    }
};
