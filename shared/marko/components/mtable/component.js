const axios = require("axios");
const throttle = require("lodash.throttle");
const debounce = require("lodash.debounce");

module.exports = class {
    onCreate(input) {
        this.initialState = {
            data: [],
            totalCount: 0,
            paginationData: [],
            dataSource: null,
            checkboxes: {},
            allCheckboxes: false,
            sortId: null,
            sortDirection: "asc",
            page: 1,
            limit: 0,
            pagesCount: 0,
            loading: false,
            searchText: "",
            error: null,
            deleteDialogActive: false,
            deleteDialogIds: [],
            deleteDialogTitles: [],
            deleteDialogProgress: false,
            anyCheckboxSelected: false,
            itemsPerPage: null
        };
        this.state = this.initialState;
        this.mounted = false;
        this.func = {
            loadData: this.loadData.bind(this),
            setLoading: this.setLoading.bind(this),
            dataRequest: this.dataRequest.bind(this)
        };
        this.i18n = input.i18n;
    }

    onMount() {
        // Do we need to auto-set itemsPerPage?
        // On mobile device, we shall not
        // if (this.input.autoItemsPerPage && !window.matchMedia("only screen and (max-width: 760px)").matches) {
        //     const itemsCount = parseInt((window.innerHeight - document.getElementById(`${this.input.id}_tableWrap`).getBoundingClientRect().top - 103) / 49, 10);
        //     this.state.itemsPerPage = itemsCount > 0 ? itemsCount : 1;
        // }
        this.onWindowResize();
        window.addEventListener("resize", throttle(this.onWindowResize.bind(this), 310));
        // Define inputs
        this.state.sortId = this.input.sortId;
        this.state.sortDirection = this.input.sortDirection;
        this.state.dataSource = this.input.dataSource;
        this.dataRequestDebounced = debounce(this.dataRequest, 300);
        // Check if there is an Object to save state
        window.__z3_mtable_data = window.__z3_mtable_data || {};
        if (window.__z3_mtable_data[this.input.id]) {
            // Restore state from saved data
            Object.keys(this.initialState).map(k => this.setState(k, window.__z3_mtable_data[this.input.id][k]));
        } else {
            // Request new data
            this.dataRequest();
        }
        this.mounted = true;
        // Set functions for window object
        window.__z3_mtable_func = window.__z3_mtable_func || {};
        window.__z3_mtable_func[this.input.id] = this.func;
    }

    onWindowResize(reload) {
        if (this.input.autoItemsPerPage && !window.matchMedia("only screen and (max-width: 760px)").matches) {
            const itemsCount = parseInt((window.innerHeight - document.getElementById(`${this.input.id}_tableWrap`).getBoundingClientRect().top - 103) / 49, 10);
            if (itemsCount && this.state.itemsPerPage !== itemsCount) {
                this.state.itemsPerPage = itemsCount > 0 ? itemsCount : 1;
                if (reload) {
                    this.loadData();
                }
            }
        }
    }

    savePersistentData() {
        if (this.mounted) {
            // Save data to the Object, so we can restore it in the future
            window.__z3_mtable_data[this.input.id] = this.state;
        }
    }

    onUpdate() {
        this.savePersistentData();
    }

    setLoading(state) {
        this.setState("loading", state);
    }

    async loadData() {
        this.setLoading(true);
        this.setChecked(false);
        this.setState("anyCheckboxSelected", false);
        const source = this.state.dataSource;
        source.data = source.data || {};
        source.data = {
            page: this.state.page,
            sortId: this.state.sortId,
            sortDirection: this.state.sortDirection,
            searchText: this.state.searchText,
            itemsPerPage: this.state.itemsPerPage
        };
        try {
            const response = await axios(source);
            if (response && response.data) {
                this.setState("error", null);
                this.setState("data", response.data.data || []);
                this.setState("totalCount", response.data.count || 0);
                this.setState("limit", response.data.limit || 1);
                this.setState("pagesCount", response.data.pagesCount || 1);
                this.setState("paginationData", this.generatePagination());
            } else {
                this.setState("error", this.i18n.t("mTableErr.general"));
            }
            this.setLoading(false);
            // this.savePersistentData();
        } catch (e) {
            if (e && e.response && e.response.status === 401) {
                this.emit("unauthorized", {});
            }
            this.setLoading(false);
            this.setState("error", this.i18n.t("mTableErr.general"));
        }
    }

    async dataRequest() {
        this.emit("data-request", {
            page: this.state.page,
            sortId: this.state.sortId,
            sortDirection: this.state.sortDirection
        });
        if (this.state.dataSource) {
            await this.loadData();
        }
    }

    anyCheckboxCheck() {
        let anyCheckboxSelected = false;
        Object.keys(this.state.checkboxes).map(c => {
            if (this.state.checkboxes[c]) {
                anyCheckboxSelected = true;
            }
        });
        this.setState("anyCheckboxSelected", anyCheckboxSelected);
    }

    setCheckbox(e) {
        this.state.checkboxes[`i${e.target.dataset.id}`] = e.target.checked || false;
        this.anyCheckboxCheck();
    }

    setChecked(state) {
        this.state.allCheckboxes = state;
        this.state.data.map(i => (this.state.checkboxes[`i${i.id || i._id}`] = state));
    }

    setCheckboxes(e) {
        const checked = e.target.checked || false;
        this.setChecked(checked);
        this.anyCheckboxCheck();
        this.forceUpdate();
    }

    generatePagination() {
        const delta = 2;
        const range = [];
        const pagesCount = parseInt(this.state.pagesCount, 10);
        if (pagesCount <= 1) {
            return range;
        }
        const page = parseInt(this.state.page, 10);
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

    onColumnClick(e) {
        if (e.target.dataset.sortable === undefined) {
            return;
        }
        const {
            id
        } = e.target.dataset;
        if (id === this.state.sortId) {
            this.state.sortDirection = this.state.sortDirection === "asc" ? "desc" : "asc";
        } else {
            this.state.sortId = id;
            this.state.sortDirection = this.input.sortDirection;
        }
        this.setState("page", 1);
        this.dataRequest();
    }

    onPageClick(e) {
        if (e.target.dataset.page === this.state.page) {
            return;
        }
        this.setState("page", e.target.dataset.page);
        this.dataRequest();
    }

    onActionButtonClick(e) {
        // Process "generic" deletion data
        if (this.input.genericDelete && e.target.dataset.action === "btnDeleteGeneric") {
            this.setState("deleteDialogActive", true);
            this.setState("deleteDialogIds", [e.target.dataset.id]);
            if (this.input.genericDelete.title) {
                const titles = this.state.data.map(item => e.target.dataset.id === item.id || e.target.dataset.id === item._id ? item[this.input.genericDelete.title] : null).filter(item => item);
                this.setState("deleteDialogTitles", titles);
            }
        }
        // Emit action event
        this.emit("action-click", {
            action: e.target.dataset.action,
            id: e.target.dataset.id
        });
    }

    onTopButtonClick(e) {
        // Process "generic" deletion data
        if (this.input.genericDelete && e.target.dataset.button === "btnDeleteSelectedGeneric") {
            this.setState("deleteDialogActive", true);
            const ids = Object.keys(this.state.checkboxes).map(i => this.state.checkboxes[i] ? i.replace(/^i/, "") : null).filter(i => i !== undefined && i !== null);
            this.setState("deleteDialogIds", ids);
            if (this.input.genericDelete.title) {
                const titles = this.state.data.map(item => ids.indexOf(item.id) > -1 || ids.indexOf(item._id) > -1 ? item[this.input.genericDelete.title] : null).filter(item => item).sort();
                this.setState("deleteDialogTitles", titles);
            }
        }
        // Emit button event
        this.emit("top-button-click", {
            button: e.target.dataset.button
        });
    }

    onSearchFieldInput(e) {
        const val = e.target.value.trim();
        this.setState("searchText", val);
        this.dataRequestDebounced();
    }

    onDeleteDialogClose() {
        this.setState("deleteDialogActive", false);
    }

    async onDeleteDialogSubmit() {
        this.setState("deleteDialogProgress", true);
        try {
            await axios.post(this.input.genericDelete.url, {
                ids: this.state.deleteDialogIds,
                ...this.input.genericDelete.extras
            });
            this.setState("deleteDialogActive", false);
            this.setState("deleteDialogProgress", false);
            this.getComponent(`${this.input.id}_mnotify`).func.show(this.i18n.t(`mTable.deleteSuccess`), "is-success");
            this.setState("page", 1);
            this.loadData();
        } catch (e) {
            if (e && e.response && e.response.status === 401) {
                this.emit("unauthorized", {});
            }
            this.setState("deleteDialogActive", false);
            this.setState("deleteDialogProgress", false);
            this.getComponent(`${this.input.id}_mnotify`).func.show(this.i18n.t(`mTableErr.delete`), "is-danger");
        }
    }
};
