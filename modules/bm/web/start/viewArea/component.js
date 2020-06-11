const bulmaCalendar = require("../../../../../shared/lib/bulmaCalendarNode");

module.exports = class {
    onCreate(input, out) {
        this.language = out.global.language;
        this.i18n = out.global.i18n;
        this.routes = out.global.moduleConfig.routes;
        this.dateFrom = null;
        this.dateTo = null;
    }

    async onMount() {
        [this.calendarDates] = (bulmaCalendar.attach("#z3_bm_s_selectDate", {
            isRange: true,
            weekStart: (this.language === "ru" ? 1 : 0),
            dateFormat: (this.language === "ru" ? "DD/MM/YYYY" : "MM/DD/YYYY"),
            lang: this.language,
            todayLabel: this.i18n.t("calendar.today"),
            cancelLabel: this.i18n.t("calendar.cancel"),
            clearLabel: this.i18n.t("calendar.clear"),
            allowSameDayRange: false,
            minDate: new Date(),
        }));
        this.calendarDates.on("select", e => {
            this.dateFrom = this.dateToDMY(e.data.date.start);
            this.dateTo = this.dateToDMY(e.data.date.end);
        });
        this.calendarDates.on("clear", () => {
            this.dateFrom = null;
            this.dateTo = null;
        });
    }

    dateToDMY(date) {
        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        return `${(d <= 9 ? `0${d}` : d)}${(m <= 9 ? `0${m}` : m)}${y}`;
    }

    onSearchButtonClick() {
        const country = this.getEl("sCountry").value > 0 ? String(this.getEl("sCountry").value) : null;
        const kind = this.getEl("sKind").value > 0 ? String(this.getEl("sKind").value) : null;
        const params = new URLSearchParams();
        if (country) {
            params.append("c", country);
        }
        if (kind) {
            params.append("k", kind);
        }
        if (this.dateFrom && this.dateTo) {
            params.append("df", this.dateFrom);
            params.append("dt", this.dateTo);
        }
        const paramsString = params.toString();
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.search}${paramsString ? `?${paramsString}` : ""}`, this.language);
    }
};
