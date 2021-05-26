const axios = require("axios");
const throttle = require("lodash.throttle");
const debounce = require("lodash.debounce");
const cloneDeep = require("lodash.clonedeep");
const {
    format,
} = require("date-fns");
const {
    v4: uuidv4
} = require("uuid");
const Cookies = require("../../../lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
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
            filterDialogEdit: null,
            filterSelected: "",
            filterMode: "equals",
            filterSelectedData: {},
            filterValue: "",
            filterDate: null,
            filterError: null,
            filters: [],
            filterEditDialogActive: false,
            filterRawDialogActive: false,
            dropdownVisible: {},
            filterManageDialogActive: false,
            filterManageDialogLoading: false,
            filterManageDialogError: null,
            filterManageSelected: [],
            filterCurrentId: null,
            filterCurrentTitle: "",
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
        this.cookieOptions = out.global.cookieOptions;
        this.siteId = out.global.siteId;
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
        this.selectField = this.getComponent(`${this.input.id}_mselect`);
        this.calendarField = this.getComponent(`${this.input.id}_filterDate`);
        this.filterDeleteConfirm = this.getComponent(`${this.input.id}_filterDeleteConfirm`);
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
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteId || "zoia3"}.authToken`);
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
            filters: this.state.filters,
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
                const titles = this.state.data.map(item => ids.indexOf(String(item.id)) > -1 || ids.indexOf(String(item._id)) > -1 ? item[this.input.genericDelete.title] : null).filter(item => item).sort();
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
        this.setState("filterDialogEdit", null);
        this.setState("filterDialogActive", true);
        this.setState("dropdownVisible", {});
    }

    onFilterSelectChange(e) {
        e.preventDefault();
        const filterId = e.target.value ? e.target.value : e.target.parentNode.value ? e.target.parentNode.value : e.target.parentNode.parentNode.value ? e.target.parentNode.parentNode.value : "";
        this.setState("filterSelected", filterId);
        const filterData = this.input.filter.find(f => f.id === filterId) || {};
        this.setState("filterSelectedData", filterData);
        this.setState("filterMode", filterData.modes ? filterData.modes[0] : "equals");
        this.setState("filterValue", "");
        this.setState("filterDate", null);
        if (filterData.type === "select") {
            this.selectField.func.setValue([]);
            this.selectField.func.setItems(filterData.items);
        }
        if (filterData.type === "date") {
            this.calendarField.func.clear();
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
            label: this.state.filterSelectedData.label,
            type: this.state.filterSelectedData.type,
            mode: this.state.filterMode,
            convert: this.state.filterSelectedData.convert || null,
            value: {},
        };
        switch (this.state.filterSelectedData.type) {
        case "select":
            const selectData = this.selectField.func.getSelectData();
            if (this.state.filterSelectedData.isNumber) {
                selectData.map((s, i) => selectData[i] = parseFloat(selectData[i]));
            }
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
        case "date":
            filter.value = {
                id: this.state.filterDate ? format(this.state.filterDate, "yyyyMMdd") : undefined,
                label: this.state.filterDate ? format(this.state.filterDate, this.i18n.t("global.dateFormatShort")) : null,
                plus: 0
            };
            break;
        default:
            let value = this.state.filterValue;
            if (this.state.filterSelectedData.isNumber) {
                value = parseFloat(value);
            }
            filter.value = {
                id: value,
                label: this.state.filterValue,
                plus: 0,
            };
        }
        if (!String(filter.value.id).length || filter.value.id === undefined) {
            // this.setState("filterError", this.i18n.t("mTable.filterError.invalidValue"));
            // return;
            filter.value.id = null;
        }
        this.setState("filterDialogActive", false);
        const filters = cloneDeep(this.state.filters);
        if (this.state.filterDialogEdit !== null) {
            filters[this.state.filterDialogEdit] = filter;
        } else {
            filters.push(filter);
        }
        this.setState("filters", filters);
        window.__zoiaTippyJs.reset();
        this.setState("page", 1);
        this.dataRequest();
    }

    onFilterTagClick(e) {
        const filterIndex = (e.target.dataset.filterindex || e.target.parentNode.dataset.filterindex || e.target.parentNode.parentNode.dataset.filterindex || e.target.parentNode.parentNode.parentNode.dataset.filterindex) - 1;
        this.setState("filterDialogEdit", filterIndex);
        const data = this.state.filters[filterIndex];
        this.setState("filterSelected", data.id);
        if (data.type === "raw") {
            this.getComponent(`${this.input.id}_filterRawForm`).func.setAceValue("value", JSON.stringify(data.value, null, "\t"));
            this.setState("filterRawDialogActive", true);
            setTimeout(() => this.getComponent(`${this.input.id}_filterRawForm`).func.autoFocus(), 50);
        } else {
            const filterData = this.input.filter.find(f => f.id === data.id) || {};
            this.setState("filterSelectedData", filterData);
            this.setState("filterMode", data.mode);
            let filterValue = null;
            switch (this.state.filterSelectedData.type) {
            case "select":
                this.selectField.func.setValue(data.value.id);
                this.selectField.func.setItems(filterData.items);
                break;
            case "date":
                this.calendarField.func.setDate(data.value.id);
                break;
            default:
                filterValue = data.value.id;
            }
            this.setState("filterValue", filterValue);
            this.setState("filterError", null);
            this.setState("filterDialogActive", true);
        }
    }

    onFilterTagDeleteClick(e) {
        const filterIndex = (e.target.dataset.filterindex || e.target.parentNode.dataset.filterindex || e.target.parentNode.parentNode.dataset.filterindex || e.target.parentNode.parentNode.parentNode.dataset.filterindex) - 1;
        const filters = cloneDeep(this.state.filters);
        filters.splice(filterIndex, 1);
        this.setState("filters", filters);
        this.setState("page", 1);
        this.dataRequest();
        if (filters.length === 0) {
            this.setState("filterCurrentId", null);
            this.setState("filterCurrentTitle", null);
        }
    }

    onFilterCalendarValueChange(value) {
        this.setState("filterDate", value || null);
    }

    onSaveCurrentFilterSetAs(e) {
        e.preventDefault();
        this.setState("dropdownVisible", {});
        this.setState("filterManageSelected", []);
        this.setState("filterEditDialogActive", true);
        this.getComponent(`${this.input.id}_filterEditForm`).func.resetData();
        setTimeout(() => this.getComponent(`${this.input.id}_filterEditForm`).func.autoFocus(), 50);
    }

    onAddRawFilterClick(e) {
        e.preventDefault();
        this.setState("dropdownVisible", {});
        this.setState("filterRawDialogActive", true);
        this.getComponent(`${this.input.id}_filterRawForm`).func.setAceValue("value", "");
        setTimeout(() => this.getComponent(`${this.input.id}_filterRawForm`).func.autoFocus(), 50);
    }

    async onSaveCurrentFilterSet(e) {
        e.preventDefault();
        this.setState("dropdownVisible", {});
        this.setLoading(true);
        try {
            await axios({
                method: "post",
                url: "/api/core/filters/save",
                data: {
                    id: this.state.filterCurrentId,
                    title: "unset",
                    type: 1,
                    table: "unset",
                    filters: this.state.filters,
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.setLoading(false);
            this.getComponent(`${this.input.id}_mnotify`).func.show(this.i18n.t("mTable.filterSaveSuccess"), "is-success");
        } catch {
            this.setLoading(false);
            this.getComponent(`${this.input.id}_mnotify`).func.show(this.i18n.t("mTableErr.filterSave"), "is-danger");
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }

    async onFilterEditFormButtonClick(obj) {
        switch (obj.id) {
        case "btnCancel":
            this.setState("filterEditDialogActive", false);
            break;
        case "btnSave":
            if (this.state.filterManageSelected.length) {
                if (!await this.getComponent(`${this.input.id}_filterEditForm`).func.submitForm()) {
                    break;
                }
                const {
                    id
                } = this.state.filterManageSelected[0];
                const title = this.getComponent(`${this.input.id}_filterEditForm`).func.getValue("title");
                const type = parseInt(this.getComponent(`${this.input.id}_filterEditForm`).func.getValue("type"), 10);
                this.setState("filterEditDialogActive", false);
                this.setState("filterManageDialogLoading", true);
                this.getComponent(`${this.input.id}_filterEditForm`).func.setError(null);
                try {
                    await axios({
                        method: "post",
                        url: "/api/core/filters/edit",
                        data: {
                            id,
                            title,
                            type
                        },
                        headers: {
                            Authorization: `Bearer ${this.token}`
                        }
                    });
                    this.setState("filterManageDialogLoading", false);
                    const currentFilter = this.filtersData.find(f => f._id === id);
                    currentFilter.title = title;
                    currentFilter.type = type;
                    this.getComponent(`${this.input.id}_mselect_filter`).func.setItems(this.filtersData.map(i => ({
                        id: i._id,
                        label: i.title,
                        labelSecondary: i.type === 1 ? this.i18n.t("mTable.filterType.local") : this.i18n.t("mTable.filterType.global"),
                    })));
                } catch {
                    this.setState("filterManageDialogError", this.i18n.t("mTableErr.filterSave"));
                    this.setState("filterManageDialogLoading", false);
                }
            } else {
                const title = this.getComponent(`${this.input.id}_filterEditForm`).func.getValue("title");
                const type = parseInt(this.getComponent(`${this.input.id}_filterEditForm`).func.getValue("type"), 10);
                if (!await this.getComponent(`${this.input.id}_filterEditForm`).func.submitForm()) {
                    break;
                }
                this.getComponent(`${this.input.id}_filterEditForm`).func.setProgress(true);
                try {
                    const res = await axios({
                        method: "post",
                        url: "/api/core/filters/save",
                        data: {
                            title,
                            type,
                            table: this.input.id,
                            filters: this.state.filters,
                        },
                        headers: {
                            Authorization: `Bearer ${this.token}`
                        }
                    });
                    this.getComponent(`${this.input.id}_filterEditForm`).func.setProgress(false);
                    this.setState("filterEditDialogActive", false);
                    this.getComponent(`${this.input.id}_mnotify`).func.show(this.i18n.t("mTable.filterSaveSuccess"), "is-success");
                    this.setState("filterCurrentId", res.data.id);
                    this.setState("filterCurrentTitle", title);
                } catch {
                    this.getComponent(`${this.input.id}_filterEditForm`).func.setProgress(false);
                    this.getComponent(`${this.input.id}_mnotify`).func.show(this.i18n.t("mTableErr.filterSave"), "is-danger");
                }
            }
            break;
        }
    }

    onFilterEditDialogClose() {
        this.setState("filterEditDialogActive", false);
    }

    onFilterManageDialogClose() {
        this.setState("filterManageDialogActive", false);
    }

    onFilterRawDialogClose() {
        this.setState("filterRawDialogActive", false);
    }

    async onManageFilters(e) {
        e.preventDefault();
        this.setState("dropdownVisible", {});
        this.setState("filterManageSelected", []);
        this.setState("filterManageDialogActive", true);
        this.setState("filterManageDialogLoading", true);
        this.setState("filterManageDialogError", false);
        try {
            const res = await axios({
                method: "post",
                url: "/api/core/filters/list",
                data: {
                    table: this.input.id
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.setState("filterManageDialogLoading", false);
            this.getComponent(`${this.input.id}_mselect_filter`).func.setValue([]);
            this.getComponent(`${this.input.id}_mselect_filter`).func.setItems(res.data.filters.map(i => ({
                id: i._id,
                label: i.title,
                labelSecondary: i.type === 1 ? this.i18n.t("mTable.filterType.local") : this.i18n.t("mTable.filterType.global"),
            })));
            this.filtersData = res.data.filters;
        } catch {
            this.setState("filterManageDialogLoading", false);
            this.setState("filterManageDialogActive", false);
            this.getComponent(`${this.input.id}_mnotify`).func.show(this.i18n.t(`mTableErr.filterLoad`), "is-danger");
        }
    }

    onMSelectFilterChange(value) {
        this.setState("filterManageSelected", value);
    }

    onFilterSetEditClick(e) {
        e.preventDefault();
        const selectedFilterId = this.state.filterManageSelected[0].id;
        const currentFilter = this.filtersData.find(f => f._id === selectedFilterId);
        this.setState("filterEditDialogActive", true);
        this.getComponent(`${this.input.id}_filterEditForm`).func.resetData();
        this.getComponent(`${this.input.id}_filterEditForm`).func.setValue("title", currentFilter.title);
        this.getComponent(`${this.input.id}_filterEditForm`).func.setValue("type", String(currentFilter.type));
        setTimeout(() => this.getComponent(`${this.input.id}_filterEditForm`).func.autoFocus(), 50);
    }

    onFilterSetLoadClick(e) {
        e.preventDefault();
        const {
            id
        } = this.state.filterManageSelected[0];
        const currentFilter = this.filtersData.find(f => f._id === id);
        this.setState("filters", cloneDeep(currentFilter.filters));
        this.setState("filterManageDialogActive", false);
        this.setState("filterCurrentId", id);
        this.setState("filterCurrentTitle", currentFilter.title);
        window.__zoiaTippyJs.reset();
        this.setState("page", 1);
        this.dataRequest();
    }

    onRemoveAllFilters(e) {
        e.preventDefault();
        this.setState("dropdownVisible", {});
        this.setState("filters", []);
        this.setState("filterCurrentId", null);
        this.setState("filterCurrentTitle", null);
        window.__zoiaTippyJs.reset();
        this.setState("page", 1);
        this.dataRequest();
    }

    onFilterDeleteClick(e) {
        e.preventDefault();
        this.filterDeleteConfirm.func.setActive(true, this.i18n.t("mTable.filter.filterDeleteConfirmTitle"), `${this.i18n.t("mTable.filter.filterDeleteConfirmText")}: ${this.state.filterManageSelected.map(f => `"${f.label}"`).join(", ")}`);
    }

    async onFilterDeleteConfirm() {
        this.filterDeleteConfirm.func.setActive(false);
        this.setState("filterManageDialogLoading", true);
        try {
            await axios({
                method: "post",
                url: "/api/core/filters/delete",
                data: {
                    ids: this.state.filterManageSelected.map(i => i.id),
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.setState("filterManageDialogLoading", false);
            this.filtersData = this.filtersData.filter(i => !(this.state.filterManageSelected.find(f => f.id === i._id)));
            this.getComponent(`${this.input.id}_mselect_filter`).func.setItems(this.filtersData.map(i => ({
                id: i._id,
                label: i.title,
                labelSecondary: i.type === 1 ? this.i18n.t("mTable.filterType.local") : this.i18n.t("mTable.filterType.global"),
            })));
            this.getComponent(`${this.input.id}_mselect_filter`).func.setValue([]);
            this.getComponent(`${this.input.id}_mnotify`).func.show(this.i18n.t(`mTable.deleteSuccess`), "is-success");
        } catch {
            this.setState("filterManageDialogLoading", false);
            this.getComponent(`${this.input.id}_mnotify`).func.show(this.i18n.t(`mTableErr.filterSave`), "is-danger");
        }
    }

    async onFilterRawFormButtonClick(obj) {
        switch (obj.id) {
        case "btnCancel":
            this.onFilterRawDialogClose();
            break;
        case "btnSave":
            const valueText = this.getComponent(`${this.input.id}_filterRawForm`).func.getValue("value");
            let valueJson;
            try {
                valueJson = JSON.parse(valueText);
                if (valueJson === null) {
                    throw new Error();
                }
            } catch (e) {
                this.getComponent(`${this.input.id}_filterRawForm`).func.setError(this.i18n.t("mTableErr.invalidJSON"));
                break;
            }
            this.onFilterRawDialogClose();
            const filter = {
                id: uuidv4(),
                label: "",
                type: "raw",
                mode: "raw",
                value: valueJson,
            };
            const filters = cloneDeep(this.state.filters);
            if (this.state.filterDialogEdit !== null) {
                filters[this.state.filterDialogEdit] = filter;
            } else {
                filters.push(filter);
            }
            this.setState("filters", filters);
            window.__zoiaTippyJs.reset();
            this.setState("page", 1);
            this.dataRequest();
            break;
        }
    }

    onfilterRawTagClick(e) {
        e.preventDefault();
        const {
            id
        } = e.target.dataset;
        const ace = this.getComponent(`${this.input.id}_filterRawForm`).func.getAceInstance("value");
        ace.focus();
        ace.session.insert(ace.getCursorPosition(), `"${id}"`);
    }
};
