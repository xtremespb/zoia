const axios = require("axios");
const cloneDeep = require("lodash.clonedeep");
const bulmaCalendar = require("../../../../../shared/lib/bulmaCalendarNode");
const Query = require("../../../../../shared/lib/query").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            region: null,
            country: null,
            countries: [],
            base: null,
            bases: [],
            features: [],
            kinds: [],
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
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
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
        if (this.query.get("f") && this.query.get("f").match(/[0-9-]+/)) {
            const featuresString = this.query.get("f").trim();
            const features = [...new Set(featuresString.split(/-/).filter(f => parseInt(f, 10)).map(f => parseInt(f, 10)))];
            if (features && features.length) {
                this.state.features = features;
                update.equipment = features;
            }
        }
        if (this.query.get("k") && this.query.get("k").match(/[0-9-]+/)) {
            const kindsString = this.query.get("k").trim();
            const kinds = [...new Set(kindsString.split(/-/).filter(f => parseInt(f, 10)).map(f => parseInt(f, 10)))];
            if (kinds && kinds.length) {
                this.state.kinds = kinds;
                update.kinds = kinds;
            }
        }
        let startDate;
        let endDate;
        if (this.query.get("df") && this.query.get("df").match(/^[0-9]{8}$/) && this.query.get("dt") && this.query.get("dt").match(/^[0-9]{8}$/)) {
            update.dateFrom = this.query.get("df");
            update.dateTo = this.query.get("dt");
            const dfParts = update.dateFrom.split("");
            startDate = new Date(parseInt(`${dfParts[4]}${dfParts[5]}${dfParts[6]}${dfParts[7]}`, 10), parseInt(`${dfParts[2]}${dfParts[3]}`, 10) - 1, parseInt(`${dfParts[0]}${dfParts[1]}`, 10));
            const dtParts = update.dateTo.split("");
            endDate = new Date(parseInt(`${dtParts[4]}${dtParts[5]}${dtParts[6]}${dtParts[7]}`, 10), parseInt(`${dtParts[2]}${dtParts[3]}`, 10) - 1, parseInt(`${dtParts[0]}${dtParts[1]}`, 10));
        }
        [this.calendarDates] = (bulmaCalendar.attach("#z3_bm_selectDate", {
            isRange: true,
            weekStart: (this.language === "ru" ? 1 : 0),
            dateFormat: (this.language === "ru" ? "DD/MM/YYYY" : "MM/DD/YYYY"),
            lang: this.language,
            todayLabel: this.i18n.t("calendar.today"),
            cancelLabel: this.i18n.t("calendar.cancel"),
            clearLabel: this.i18n.t("calendar.clear"),
            allowSameDayRange: false,
            minDate: new Date(),
            startDate,
            endDate
        }));
        this.calendarDates.on("select", e => {
            const dateFrom = this.dateToDMY(e.data.date.start);
            const dateTo = this.dateToDMY(e.data.date.end);
            this.emit("query-change", {
                dateFrom,
                dateTo
            });
        });
        this.calendarDates.on("clear", () => {
            this.emit("query-change", {
                dateFrom: undefined,
                dateTo: undefined
            });
        });
        if (Object.keys(update).length) {
            this.emit("query-change", update);
        }
        this.setCountries();
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

    onFeatureIconClick(e) {
        const id = parseInt(e.target.dataset.id, 10);
        const equipment = cloneDeep(this.state.features);
        const index = equipment.indexOf(id);
        if (index === -1) {
            equipment.push(id);
        } else {
            equipment.splice(index, 1);
        }
        this.setState("features", equipment);
        this.emit("query-change", {
            equipment
        });
    }

    onBoatKindChange(e) {
        const id = parseInt(e.target.dataset.id, 10);
        const kinds = cloneDeep(this.state.kinds);
        const index = kinds.indexOf(id);
        if (index === -1) {
            kinds.push(id);
        } else {
            kinds.splice(index, 1);
        }
        this.setState("kinds", kinds);
        this.emit("query-change", {
            kinds
        });
    }
};
