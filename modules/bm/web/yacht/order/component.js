const axios = require("axios");
const bulmaCalendar = require("../../../../../shared/lib/bulmaCalendarNode");
const Query = require("../../../../../shared/lib/query").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            dateFrom: null,
            dateTo: null,
            price: out.global.yacht.price,
            priceLoading: false,
            priceError: null
        };
        this.state = state;
        this.language = out.global.language;
        this.i18n = out.global.i18n;
        this.yachtId = out.global.yacht.id;
    }

    dateToDMY(date) {
        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        return `${(d <= 9 ? `0${d}` : d)}${(m <= 9 ? `0${m}` : m)}${y}`;
    }

    onMount() {
        this.query = new Query();
        let startDate;
        let endDate;
        if (this.query.get("df") && this.query.get("df").match(/^[0-9]{8}$/) && this.query.get("dt") && this.query.get("dt").match(/^[0-9]{8}$/)) {
            const dfParts = this.query.get("df").split("");
            startDate = new Date(parseInt(`${dfParts[4]}${dfParts[5]}${dfParts[6]}${dfParts[7]}`, 10), parseInt(`${dfParts[2]}${dfParts[3]}`, 10) - 1, parseInt(`${dfParts[0]}${dfParts[1]}`, 10));
            const dtParts = this.query.get("dt").split("");
            endDate = new Date(parseInt(`${dtParts[4]}${dtParts[5]}${dtParts[6]}${dtParts[7]}`, 10), parseInt(`${dtParts[2]}${dtParts[3]}`, 10) - 1, parseInt(`${dtParts[0]}${dtParts[1]}`, 10));
            this.state.dateFrom = this.query.get("df");
            this.state.dateTo = this.query.get("dt");
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
            endDate,
        }));
        this.calendarDates.on("select", async e => {
            const dateFrom = this.dateToDMY(e.data.date.start);
            const dateTo = this.dateToDMY(e.data.date.end);
            this.state.priceLoading = true;
            try {
                const res = await axios.post("/api/bm/price", {
                    id: this.yachtId,
                    dateFrom,
                    dateTo
                });
                this.state.priceLoading = false;
                this.state.price = parseInt(res.data.price, 10);
                this.state.priceError = null;
                this.state.dateFrom = dateFrom;
                this.state.dateTo = dateTo;
            } catch (err) {
                // TODO
                this.state.priceLoading = false;
                this.state.priceError = true;
            }
        });
    }

    onFormPostSuccess() {
        console.log("OKAY");
    }
};
