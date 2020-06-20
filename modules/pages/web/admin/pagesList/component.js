/* eslint-disable arrow-body-style */

const {
    v4: uuidv4
} = require("uuid");

module.exports = class {
    onCreate(input, out) {
        this.state = {
            processValue: null
        };
        this.i18n = out.global.i18n;
        this.language = out.global.language;
        this.routes = out.global.routes;
    }

    onMount() {
        // eslint-disable-next-line no-unused-vars
        this.state.processValue = (id, value, column, row) => {
            switch (column) {
            default:
                return value;
            }
        };
        if (this.input.successNotification) {
            this.getComponent(`pagesList_mnotify`).func.show(this.i18n.t("dataSaveSuccess"), "is-success");
        }
    }

    // eslint-disable-next-line class-methods-use-this
    onActionClick(data) {
        switch (data.action) {
        case "btnEdit":
            window.router.navigate("pages.edit", {
                id: data.id
            });
            break;
        }
    }

    onTopButtonClick(data) {
        switch (data.button) {
        case "btnReload":
            this.getComponent("pagesTable").func.dataRequest();
            break;
        case "btnAdd":
            window.router.navigate("pages.edit", {
                id: "new"
            });
            break;
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${uuidv4()}`, this.language);
    }
};
