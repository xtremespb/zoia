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
        this.state.processValue = (id, value) => value;
        this.backupModal = this.getComponent("z3_ap_backupModal");
    }

    onActionClick(data) {
        switch (data.action) {
        case "btnEdit":
            break;
        }
    }

    onTopButtonClick(data) {
        switch (data.button) {
        case "btnReload":
            this.getComponent("backupTable").func.dataRequest();
            break;
        case "btnAdd":
            this.backupModal.func.setActive(true);
            break;
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }
};
