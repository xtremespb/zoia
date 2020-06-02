const axios = require("axios");
const Query = require("../../../../../shared/lib/query").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            yachts: out.global.yachts || [],
            pagesCount: out.global.pagesCount || 1,
            page: out.global.page || 1,
            paginationData: []
        };
        state.paginationData = this.generatePagination(state.page, state.pagesCount);
        this.state = state;
        this.func = {
            loadData: this.loadData.bind(this),
            loadChangedData: this.loadChangedData.bind(this),
            setQuery: this.setQuery.bind(this),
            setChangedQuery: this.setChangedQuery.bind(this),
        };
    }

    setQuery(query) {
        this.query = query;
    }

    setChangedQuery(query) {
        this.changedQuery = query;
    }

    async loadData(page = 1) {
        try {
            const res = await axios.post("/api/bm/search", {
                ...this.query,
                page
            });
            this.query = this.query || {};
            const pagesCount = Math.ceil(res.data.total / 10) || 1;
            this.state.page = page;
            this.state.pagesCount = pagesCount;
            this.state.yachts = res.data.yachts;
            this.queryLib.replace({
                p: page,
                c: this.query.country,
                d: this.query.region,
                b: this.query.base,
                df: this.query.dateFrom,
                dt: this.query.dateTo,
                f: this.query.equipment && this.query.equipment.length ? this.query.equipment.join("-") : undefined,
                k: this.query.kinds && this.query.kinds.length ? this.query.kinds.join("-") : undefined,
                pr: this.query.product,
                mc: this.query.minCabins,
                my: this.query.minYear,
                ml: this.query.minLength,
                sk: (this.query.skipper === null || this.query.skipper === undefined) ? undefined : this.query.skipper === true,
            });
            this.state.paginationData = this.generatePagination(page, pagesCount);
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        } catch (e) {
            // TODO Error handling!
        }
    }

    async loadChangedData() {
        this.query = this.changedQuery;
        this.loadData();
    }

    async onPageClick(e) {
        e.preventDefault();
        const p = e.target.dataset.page;
        this.emit("page-change", {});
        await this.loadData(p);
    }

    onMount() {
        this.queryLib = new Query();
    }

    generatePagination(pageData, pagesCountData) {
        const delta = 2;
        const range = [];
        const pagesCount = parseInt(pagesCountData, 10);
        if (pagesCount <= 1) {
            return range;
        }
        const page = parseInt(pageData, 10);
        for (let i = Math.max(2, page - delta); i <= Math.min(pagesCount - 1, page + delta); i += 1) {
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
        if (page + delta < pagesCount - 1) {
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
            active: page === pagesCount,
            page: pagesCount
        });
        return range;
    }
};
