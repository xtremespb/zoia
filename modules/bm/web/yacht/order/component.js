const bulmaCalendar = require("../../../../../shared/lib/bulmaCalendarNode");
const Query = require("../../../../../shared/lib/query").default;

module.exports = class {
    onCreate(input, out) {
        this.language = out.global.language;
        this.i18n = out.global.i18n;
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
    }
};
