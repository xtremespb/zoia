const {
    addDays,
    startOfWeek,
    format,
    parse,
} = require("date-fns");
const cloneDeep = require("lodash.clonedeep");

module.exports = class {
    onCreate(input, out) {
        const state = {
            visible: true,
            enabled: true,
            calendar: {
                data: [],
                year: new Date().getFullYear(),
                month: new Date().getMonth(),
                visible: false,
                selected: {
                    d: null,
                    m: null,
                    y: null
                },
                value: null,
                valueText: null,
                mode: "date",
            },
            whitelist: [],
        };
        this.state = state;
        this.i18n = out.global.i18n;
        this.func = {
            setDate: this.setDateExt.bind(this),
            setMonthYear: this.setMonthYear.bind(this),
            setWhitelist: this.setWhitelist.bind(this),
            clear: this.onCalendarClear.bind(this),
        };
    }

    setDate(calendar, date) {
        calendar.value = parse(date, "yyyyMMdd", new Date());
        calendar.valueText = format(calendar.value, this.i18n.t("global.dateFormatShort"));
        calendar.selected = {
            y: calendar.value.getFullYear(),
            m: calendar.value.getMonth(),
            d: calendar.value.getDate(),
        };
        calendar.year = calendar.selected.y;
        calendar.month = calendar.selected.m;
        return calendar;
    }

    setDateExt(date) {
        const calendar = date ? this.setDate(cloneDeep(this.state.calendar), date) : this.clearCalendar(cloneDeep(this.state.calendar));
        calendar.data = this.updateCalendarData(calendar.year, calendar.month);
        this.setState("calendar", calendar);
    }

    setMonthYear(month, year) {
        if (!month || !year) {
            return;
        }
        const calendar = cloneDeep(this.state.calendar);
        calendar.value = null;
        calendar.valueText = null;
        calendar.selected = {
            y: year,
            m: month,
            d: null,
        };
        calendar.year = calendar.selected.y;
        calendar.month = calendar.selected.m;
        calendar.data = this.updateCalendarData(calendar.year, calendar.month);
        this.setState("calendar", calendar);
    }

    async onMount() {
        let calendar = cloneDeep(this.state.calendar);
        if (this.input.value) {
            calendar = this.setDate(calendar, this.input.value);
        }
        calendar.data = this.updateCalendarData(calendar.year, calendar.month);
        this.setState("calendar", calendar);
    }

    updateCalendarData(year, month) {
        const startDate = startOfWeek(new Date(year, month, 1), {
            weekStartsOn: parseInt(this.i18n.t("global.weekStart"), 10)
        });
        const rows = 6;
        const cols = 7;
        const length = rows * cols;
        const data = Array.from({
                length
            })
            .map((_, index) => ({
                d: addDays(startDate, index).getDate(),
                m: addDays(startDate, index).getMonth(),
                y: addDays(startDate, index).getFullYear(),
                enabled: this.state.whitelist.length ? this.state.whitelist.indexOf(format(addDays(startDate, index), "yyyyMMdd")) > -1 : true
            }))
            .reduce((matrix, current, index, days) => !(index % cols !== 0) ? [...matrix, days.slice(index, index + cols)] : matrix, []);
        if (data[5][0].d < 10) {
            data.splice(5, 1);
        }
        return data;
    }

    onCalendarLeft(e) {
        e.preventDefault();
        const calendarOptions = cloneDeep(this.state.calendar);
        calendarOptions.month -= 1;
        if (calendarOptions.month < 0) {
            calendarOptions.month = 11;
            calendarOptions.year -= 1;
        }
        calendarOptions.data = this.updateCalendarData(calendarOptions.year, calendarOptions.month);
        this.setState("calendar", calendarOptions);
    }

    onCalendarRight(e) {
        e.preventDefault();
        const calendarOptions = cloneDeep(this.state.calendar);
        calendarOptions.month += 1;
        if (calendarOptions.month > 11) {
            calendarOptions.month = 0;
            calendarOptions.year += 1;
        }
        calendarOptions.data = this.updateCalendarData(calendarOptions.year, calendarOptions.month);
        this.setState("calendar", calendarOptions);
    }

    onDatePickerInputClick(e) {
        e.stopPropagation();
        const calendarOptions = cloneDeep(this.state.calendar);
        calendarOptions.visible = true;
        calendarOptions.mode = "date";
        this.setState("calendar", calendarOptions);
    }

    onDatePickerKeyPress(e) {
        if ((e.which || e.keyCode) === 9 && this.state.calendar.visible) {
            const calendarOptions = cloneDeep(this.state.calendar);
            calendarOptions.visible = false;
            this.setState("calendar", calendarOptions);
        }
    }

    onCalendarCellClick(e) {
        if (e.target && e.target.dataset && e.target.dataset.y) {
            const {
                d,
                m,
                y
            } = e.target.dataset;
            const calendarOptions = cloneDeep(this.state.calendar);
            calendarOptions.selected = {
                d: parseInt(d, 10),
                m: parseInt(m, 10),
                y: parseInt(y, 10)
            };
            calendarOptions.visible = false;
            calendarOptions.value = new Date(calendarOptions.selected.y, calendarOptions.selected.m, calendarOptions.selected.d);
            calendarOptions.valueText = format(calendarOptions.value, this.i18n.t("global.dateFormatShort"));
            this.setState("calendar", calendarOptions);
            this.emit("value-change", calendarOptions.value);
        }
    }

    onCalendarModeChange(e) {
        const {
            mode
        } = e.target.dataset;
        const calendarOptions = cloneDeep(this.state.calendar);
        calendarOptions.mode = mode;
        this.setState("calendar", calendarOptions);
        if (mode === "year") {
            setTimeout(() => document.getElementById(`${this.input.id}_calendar_wrap_year`).scrollTop = document.getElementById(`${this.input.id}_year_${this.state.calendar.year}`).offsetTop - 120, 100);
        }
    }

    onCalendarMonthClick(e) {
        e.preventDefault();
        const {
            month
        } = e.target.dataset;
        const calendarOptions = cloneDeep(this.state.calendar);
        calendarOptions.month = parseInt(month, 10);
        calendarOptions.data = this.updateCalendarData(calendarOptions.year, calendarOptions.month);
        calendarOptions.mode = "date";
        this.setState("calendar", calendarOptions);
    }

    onCalendarYearClick(e) {
        e.preventDefault();
        const {
            year
        } = e.target.dataset;
        const calendarOptions = cloneDeep(this.state.calendar);
        calendarOptions.year = parseInt(year, 10);
        calendarOptions.data = this.updateCalendarData(calendarOptions.year, calendarOptions.month);
        calendarOptions.mode = "date";
        this.setState("calendar", calendarOptions);
    }

    clearCalendar(calendar) {
        calendar.value = null;
        calendar.valueText = null;
        calendar.year = new Date().getFullYear();
        calendar.month = new Date().getMonth();
        calendar.selected = {
            d: null,
            m: null,
            y: null
        };
        return calendar;
    }

    onCalendarClear(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        const calendar = this.clearCalendar(cloneDeep(this.state.calendar));
        calendar.visible = false;
        this.setState("calendar", calendar);
        if (e) {
            this.emit("value-change", calendar.value);
        }
    }

    onCalendarToday(e) {
        e.preventDefault();
        const calendar = cloneDeep(this.state.calendar);
        calendar.value = new Date();
        calendar.valueText = format(calendar.value, this.i18n.t("global.dateFormatShort"));
        calendar.selected = {
            y: calendar.value.getFullYear(),
            m: calendar.value.getMonth(),
            d: calendar.value.getDate(),
        };
        calendar.year = calendar.selected.y;
        calendar.month = calendar.selected.m;
        calendar.data = this.updateCalendarData(calendar.year, calendar.month);
        calendar.visible = false;
        this.setState("calendar", calendar);
        this.emit("value-change", calendar.value);
    }

    setWhitelist(whitelist) {
        this.setState("whitelist", whitelist);
        const calendar = cloneDeep(this.state.calendar);
        calendar.data = this.updateCalendarData(calendar.year, calendar.month);
        this.setState("calendar", calendar);
    }
};
