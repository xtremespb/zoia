const Cookies = require("../../../../../shared/lib/cookies").default;

/* eslint-disable arrow-body-style */
module.exports = class {
    onCreate(input, out) {
        this.state = {
            processValue: null,
            error: null,
            loading: false
        };
        this.i18n = out.global.i18n;
        this.language = out.global.language;
        this.routes = out.global.routes;
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
    }

    async onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
        this.table = this.getComponent("z3_ap_ps_table");
        this.editModal = this.getComponent("z3_ap_ps_editModal");
        // eslint-disable-next-line no-unused-vars
        this.state.processValue = (id, value, column, row) => {
            switch (column) {
            default:
                return value;
            }
        };
        if (this.input.successNotification) {
            this.getComponent(`aclList_mnotify`).func.show(this.i18n.t("dataSaveSuccess"), "is-success");
        }
        await this.table.func.dataRequest();
    }

    // eslint-disable-next-line class-methods-use-this
    onActionClick(data) {
        switch (data.action) {
        case "btnEdit":
            setTimeout(() => window.router.navigate("acl.edit", {
                id: data.id
            }), 10);
            break;
        }
    }

    onTopButtonClick(obj) {
        switch (obj.button) {
        case "btnReload":
            this.table.func.dataRequest();
            break;
        case "btnAdd":
            window.router.navigate("acl.edit", {
                id: "new"
            });
            break;
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }
};
