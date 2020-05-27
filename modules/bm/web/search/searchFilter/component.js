const axios = require("axios");
const bulmaCalendar = require("../../../../../shared/lib/bulmaCalendarNode");
const Query = require("../../../../../shared/lib/query").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            region: null,
            country: null,
            countries: [],
            base: null,
            bases: []
        };
        this.state = state;
        this.countries = out.global.countries;
        this.language = out.global.language;
        this.i18n = out.global.i18n;
    }

    setCountries() {
        this.state.countries = this.state.region ? this.countries.filter(country => country.region === this.state.region) : this.countries;
    }

    dateToDMY(date) {
        const d = date.getDate();
        const m = date.getMonth() + 1; // Month from 0 to 11
        const y = date.getFullYear();
        // return '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
        return `${(d <= 9 ? `0${d}` : d)}${(m <= 9 ? `0${m}` : m)}${y}`;
    }

    async onMount() {
        this.query = new Query();
        const update = {};
        if (this.query.get("d") && this.query.get("d").match(/^[0-9]+$/)) {
            this.state.region = this.query.get("d");
            update.region = this.query.get("d");
        }
        if (this.query.get("c") && this.query.get("c").match(/^[0-9]+$/)) {
            this.state.country = this.query.get("c");
            update.country = this.query.get("c");
            await this.loadBases(this.query.get("c"));
            if (this.query.get("b") && this.query.get("b").match(/^[0-9]+$/)) {
                this.state.base = this.query.get("b");
                update.base = this.query.get("b");
            }
        }
        if (Object.keys(update).length) {
            this.emit("query-change", update);
        }
        this.setCountries();
        [this.calendarDates] = (bulmaCalendar.attach("#z3_bm_selectDate", {
            isRange: true,
            weekStart: (this.language === "ru" ? 1 : 0),
            dateFormat: (this.language === "ru" ? "DD/MM/YYYY" : "MM/DD/YYYY"),
            lang: this.language,
            todayLabel: this.i18n.t("calendar.today"),
            cancelLabel: this.i18n.t("calendar.cancel"),
            clearLabel: this.i18n.t("calendar.clear"),
            allowSameDayRange: false
        }));
        this.calendarDates.on("select", e => {
            const dateFrom = this.dateToDMY(e.data.date.start);
            const dateTo = this.dateToDMY(e.data.date.end);
            this.emit("query-change", {
                dateFrom,
                dateTo
            });
        });
    }

    onRegionChange(e) {
        this.setState("region", e.target.value || null);
        this.setState("country", null);
        this.setState("base", null);
        this.setState("bases", []);
        this.emit("query-change", {
            region: e.target.value,
            base: null,
            country: null
        });
        this.setCountries();
    }

    onBaseChange(e) {
        this.setState("base", e.target.value);
        this.emit("query-change", {
            base: e.target.value,
        });
    }

    async loadBases(country) {
        try {
            const res = await axios.post("/api/bm/bases", {
                country
            });
            this.setState("bases", res && res.data && res.data.bases ? res.data.bases : []);
        } catch (error) {
            // TODO: Provide some error handling
        }
    }

    async onCountryChange(e) {
        const country = e.target.value;
        this.setState("country", country);
        this.setState("base", null);
        this.setState("bases", []);
        this.emit("query-change", {
            base: null,
            country
        });
        if (country) {
            await this.loadBases(country);
        }
    }

    searchBtnClick() {
        this.emit("data-request");
    }
};
