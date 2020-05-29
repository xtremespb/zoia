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
            loadData: this.loadData.bind(this)
        };
    }

    async loadData(page = 1) {
        try {
            const res = await axios.post("/api/bm/search", {
                ...this.input.query,
                page
            });
            const pagesCount = Math.ceil(res.data.total / 10) || 1;
            this.state.page = page;
            this.state.pagesCount = pagesCount;
            this.state.yachts = res.data.yachts;
            this.query.replace({
                p: page,
                c: this.input.query.country,
                d: this.input.query.region,
                b: this.input.query.base,
                df: this.input.query.dateFrom,
                dt: this.input.query.dateTo,
                f: this.input.query.equipment && this.input.query.equipment.length ? this.input.query.equipment.join("-") : undefined,
                k: this.input.query.kinds && this.input.query.kinds.length ? this.input.query.kinds.join("-") : undefined
            });
            this.state.paginationData = this.generatePagination(page, pagesCount);
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        } catch (e) {
            // TODO Error handling!
            console.error(e);
        }
    }

    async onPageClick(e) {
        e.preventDefault();
        const p = e.target.dataset.page;
        await this.loadData(p);
    }

    onMount() {
        this.query = new Query();
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
