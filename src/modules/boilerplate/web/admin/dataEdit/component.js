const moduleConfig = require("../../../module.json");

module.exports = class {
    onCreate(input, out) {
        this.i18n = out.global.i18n;
        this.language = out.global.language;
        this.routes = out.global.routes;
        this.io = out.global.io;
        if (this.io) {
            this.io.on(`${moduleConfig.id}.alreadyLocked`, username => {
                this.lockedModal.func.setActive(true, username);
            });
        }
    }

    onMount() {
        this.lockedModal = this.getComponent(`z3_ap_${moduleConfig.id}_lockedModal`);
        if (this.input.id !== "new") {
            this.getComponent(`${moduleConfig.id}EditForm`).loadData();
        }
    }

    async onFormPostSuccess() {
        if (window.__z3_mtable_func && window.__z3_mtable_func[moduleConfig.id]) {
            await window.__z3_mtable_func[moduleConfig.id].loadData();
        }
        if (this.io) {
            this.io.z3.sendMessage(`${moduleConfig.id}.release`, {
                id: this.itemId
            });
        }
        window.router.navigate(moduleConfig.id, {
            successNotification: true
        });
    }

    onButtonClick(obj) {
        switch (obj.id) {
        case "btnCancel":
            if (this.io) {
                this.io.z3.sendMessage(`${moduleConfig.id}.release`, {
                    id: this.itemId
                });
            }
            window.router.navigate(moduleConfig.id);
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }

    onLoadSuccess(data) {
        this.itemId = data._id;
        if (this.io) {
            this.io.z3.sendMessage(`${moduleConfig.id}.lock`, {
                id: data._id
            });
        }
    }
};
