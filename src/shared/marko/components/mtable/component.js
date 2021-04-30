const axios = require("axios");
const throttle = require("lodash.throttle");
const debounce = require("lodash.debounce");
const cloneDeep = require("lodash.clonedeep");

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
            itemsPerPage: null,
            filterDialogActive: false,
            filterSelected: "",
            filterMode: "equals",
            filterSelectedData: {},
            filterValue: "",
            filterError: null,
            filters: [],
            dropdownVisible: {},
        };
        this.state = this.initialState;
        this.mounted = false;
        this.func = {
            loadData: this.loadData.bind(this),
            setLoading: this.setLoading.bind(this),
            dataRequest: this.dataRequest.bind(this),
            setError: this.setError.bind(this),
            getCheckboxes: this.getCheckboxes.bind(this),
        };
        this.i18n = input.i18n;
    }

    setError(err) {
        this.setState("error", err);
    }

    getCheckboxes() {
        return Object.keys(this.state.checkboxes).map(k => this.state.checkboxes[k] ? String(k).replace(/^i/, "") : null).filter(i => i);
    }

    onMount() {
        // Do we need to auto-set itemsPerPage?
        // On mobile device, we shall not
        this.selectField = this.getComponent("z3_mt_mselect");
        this.onWindowResize();
        if (this.input.updateOnWindowResize) {
            window.addEventListener("resize", throttle(this.onWindowResize.bind(this), 1000));
        }
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
        } else if (!this.input.noAutoDataRequest) {
            // Request new data
            this.dataRequest();
        }
        this.mounted = true;
        // Set functions for window object
        window.__z3_mtable_func = window.__z3_mtable_func || {};
        window.__z3_mtable_func[this.input.id] = this.func;
        // Hide drop drowns on click
        document.addEventListener("click", e => {
            let hide = true;
            Array.from(document.getElementsByClassName("z3-mt-top-control")).map(i => {
                if (i.contains(e.target)) {
                    hide = false;
                }
            });
            if (hide) {
                this.setState("dropdownVisible", {});
            }
        });
    }

    onWindowResize(reload) {
        if (this.input.autoItemsPerPage && !window.matchMedia("only screen and (max-width: 760px)").matches && document.getElementById(`${this.input.id}_tableWrap`)) {
            const itemsCount = parseInt((window.innerHeight - document.getElementById(`${this.input.id}_tableWrap`).getBoundingClientRect().top - 113) / 49, 10);
            if (itemsCount && this.state.itemsPerPage !== itemsCount) {
                this.state.itemsPerPage = itemsCount > 0 ? itemsCount : 1;
            }
            if (reload) {
                this.loadData();
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

    async loadData(extras = {}) {
        this.setLoading(true);
        this.setChecked(false);
        this.setState("anyCheckboxSelected", false);
        const source = this.state.dataSource;
        source.data = source.data || {};
        source.data = {
            ...source.data,
            page: this.state.page,
            sortId: this.state.sortId,
            sortDirection: this.state.sortDirection,
            searchText: this.state.searchText,
            itemsPerPage: this.state.itemsPerPage,
            ...extras
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

    async dataRequest(extras) {
        this.emit("data-request", {
            page: this.state.page,
            sortId: this.state.sortId,
            sortDirection: this.state.sortDirection
        });
        if (this.state.dataSource) {
            await this.loadData(extras);
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
        this.setChecked(e.target.checked);
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
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        if (dataset.sortable === undefined) {
            return;
        }
        const {
            id
        } = dataset;
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
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        if (dataset.page === this.state.page) {
            return;
        }
        this.setState("page", dataset.page);
        this.dataRequest();
    }

    onActionButtonClick(e) {
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        // Process "generic" deletion data
        if (this.input.genericDelete && dataset.action === "btnDeleteGeneric") {
            this.setState("deleteDialogActive", true);
            this.setState("deleteDialogIds", [dataset.id]);
            if (this.input.genericDelete.title) {
                const titles = this.state.data.map(item => String(dataset.id) === String(item.id) || String(dataset.id) === String(item._id) ? item[this.input.genericDelete.title] : null).filter(item => item);
                this.setState("deleteDialogTitles", titles);
            }
        }
        // Emit action event
        this.emit("action-click", {
            action: dataset.action,
            id: dataset.id
        });
    }

    onTopButtonClick(e) {
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.parentNode.dataset : {};
        // Process "generic" deletion data
        if (this.input.genericDelete && dataset.button === "btnDeleteSelectedGeneric") {
            this.setState("deleteDialogActive", true);
            const ids = Object.keys(this.state.checkboxes).map(i => this.state.checkboxes[i] ? i.replace(/^i/, "") : null).filter(i => i !== undefined && i !== null);
            this.setState("deleteDialogIds", ids);
            if (this.input.genericDelete.title) {
                const titles = this.state.data.map(item => ids.indexOf(item.id) > -1 || ids.indexOf(item._id) > -1 ? item[this.input.genericDelete.title] : null).filter(item => item).sort();
                this.setState("deleteDialogTitles", titles);
            }
            this.setState("dropdownVisible", {});
        }
        if (dataset.dropdown === "true") {
            const dropdownVisible = {};
            dropdownVisible[dataset.button] = !(this.state.dropdownVisible[dataset.button]);
            this.setState("dropdownVisible", dropdownVisible);
        } else {
            this.setState("dropdownVisible", {});
            // Emit button event
            this.emit("top-button-click", {
                button: dataset.button
            });
        }
    }

    onSearchFieldInput(e) {
        const val = e.target.value.trim();
        this.setState("searchText", val);
        this.setState("page", 1);
        this.dataRequestDebounced();
    }

    onDeleteDialogClose() {
        this.setState("deleteDialogActive", false);
    }

    onFilterDialogClose() {
        this.setState("filterDialogActive", false);
    }

    async onDeleteDialogSubmit() {
        this.setState("deleteDialogProgress", true);
        try {
            const {
                source
            } = this.input.genericDelete;
            source.data = source.data || {};
            source.data.ids = this.state.deleteDialogIds;
            await axios(source);
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

    onAddFilterClick(e) {
        e.preventDefault();
        this.setState("filterError", null);
        this.setState("filterSelected", "");
        this.setState("filterMode", "equals");
        this.setState("filterSelectedData", {});
        this.setState("filterValue", "");
        this.setState("filterDialogActive", true);
    }

    onFilterSelectChange(e) {
        e.preventDefault();
        const filterId = e.target.value ? e.target.value : e.target.parentNode.value ? e.target.parentNode.value : e.target.parentNode.parentNode.value ? e.target.parentNode.parentNode.value : "";
        this.setState("filterSelected", filterId);
        const filterData = this.input.filter.find(f => f.id === filterId) || {};
        this.setState("filterSelectedData", filterData);
        this.setState("filterValue", "");
        if (filterData.type === "select") {
            this.selectField.func.setValue([]);
            this.selectField.func.setItems(filterData.items);
        }
    }

    onFilterModeSelectChange(e) {
        e.preventDefault();
        const filterMode = e.target.value ? e.target.value : e.target.parentNode.value ? e.target.parentNode.value : e.target.parentNode.parentNode.value ? e.target.parentNode.parentNode.value : "";
        this.setState("filterMode", filterMode);
    }

    onDropdownItemClick(e) {
        e.preventDefault();
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        this.emit("top-button-click", {
            button: dataset.id
        });
        this.setState("dropdownVisible", {});
    }

    onFilterValueChange(e) {
        const {
            value
        } = e.target;
        this.setState("filterValue", value);
    }

    onFilterFormSubmit(e) {
        this.setState("filterError", null);
        e.preventDefault();
        const filter = {
            id: this.state.filterSelected,
            mode: this.state.filterMode,
            value: {},
        };
        switch (this.state.filterSelectedData.type) {
        case "select":
            const selectData = this.selectField.func.getSelectData();
            const selectValue = this.selectField.func.getValue();
            let label = "";
            let plus = 0;
            if (selectValue && selectValue.length) {
                label = selectValue[0].label;
                plus = selectValue.length - 1;
            }
            filter.value = {
                id: selectData,
                label,
                plus,
            };
            break;
        default:
            filter.value = {
                id: this.state.filterValue,
                label: this.state.filterValue,
                plus: 0,
            };
        }
        if (!filter.value.id.length) {
            this.setState("filterError", this.i18n.t("mTable.filterError.invalidValue"));
            return;
        }
        this.setState("filterDialogActive", false);
        const filters = cloneDeep(this.state.filters);
        filters.push(filter);
        this.setState("filters", filters);
    }
};
