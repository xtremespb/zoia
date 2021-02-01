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
        this.notify = this.getComponent("usersList_mnotify");
        this.state.processValue = (id, value, column, row) => {
            switch (column) {
            case "status":
                const statusText = [];
                if (row.status.indexOf("active") > -1) {
                    statusText.push(`<span class="icon"><i class="mdi mdi-24px mdi-account-circle-outline"></i></span>`);
                }
                if (row.status.indexOf("admin") > -1) {
                    statusText.push(`<span class="icon"><i class="mdi mdi-24px mdi-account-circle"></i></span>`);
                }
                return `<div>${statusText.join("")}</div>`;
            default:
                return value;
            }
        };
        if (this.input.successNotification && this.notify && this.notify.func) {
            this.notify.func.show(this.i18n.t("dataSaveSuccess"), "is-success");
        }
    }

    onActionClick(data) {
        switch (data.action) {
        case "btnEdit":
            window.router.navigate("users.edit", {
                id: data.id
            });
            break;
        }
    }

    onTopButtonClick(data) {
        switch (data.button) {
        case "btnReload":
            this.getComponent("usersTable").func.dataRequest();
            break;
        case "btnAdd":
            window.router.navigate("users.edit", {
                id: "new"
            });
            break;
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }
};
