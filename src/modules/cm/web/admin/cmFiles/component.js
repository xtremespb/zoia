const Cookies = require("../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        this.state = {
            processValue: null,
            loading: false
        };
        this.language = out.global.language;
        this.routes = out.global.routes;
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
        this.i18n = out.global.i18n;
        this.routeDownload = out.global.routeDownload;
    }

    onMount() {
        this.state.processValue = (id, value, column) => {
            switch (column) {
            case "date":
                return `${new Date(value).toLocaleDateString()} ${new Date(value).toLocaleTimeString()}`;
            case "cardType":
                return value.toUpperCase();
            default:
                return value;
            }
        };
        this.cmModal = this.getComponent("z3_ap_cmModal");
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
        this.notify = this.getComponent("cmList_mnotify");
    }

    onActionClick(data) {
        switch (data.action) {
        case "btnDownload":
            window.open(
                `${this.routeDownload}?id=${data.id}`,
                "_blank"
            );
            break;
        }
    }

    onTopButtonClick(data) {
        switch (data.button) {
        case "btnReload":
            this.getComponent("cmTable").func.dataRequest();
            break;
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }
};
