module.exports = class {
    onCreate(input, out) {
        this.i18n = out.global.i18n;
        this.language = out.global.language;
        this.routes = out.global.routes;
        this.io = out.global.io;
        if (this.io) {
            this.io.on("users.alreadyLocked", username => {
                this.lockedModal.func.setActive(true, username);
            });
        }
    }

    onMount() {
        this.lockedModal = this.getComponent("z3_ap_ue_lockedModal");
        if (this.input.id !== "new") {
            this.getComponent("userEditForm").loadData();
            this.getComponent("userEditForm").func.setViewMode(true);
        }
    }

    async onFormPostSuccess() {
        if (window.__z3_mtable_func && window.__z3_mtable_func["users"]) {
            await window.__z3_mtable_func["users"].loadData();
        }
        if (this.io) {
            this.io.z3.sendMessage("pages.release", {
                id: this.itemId
            });
        }
        window.router.navigate("users", {
            successNotification: true
        });
    }

    onButtonClick(obj) {
        switch (obj.id) {
        case "btnCancel":
            if (this.io) {
                this.io.z3.sendMessage("users.release", {
                    id: this.itemId
                });
            }
            window.router.navigate("users");
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }

    onLoadSuccess(data) {
        this.itemId = data._id;
        if (this.io) {
            this.io.z3.sendMessage("users.lock", {
                id: data._id
            });
        }
    }
};
