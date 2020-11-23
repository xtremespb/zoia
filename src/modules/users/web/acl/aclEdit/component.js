module.exports = class {
    onCreate(input, out) {
        this.i18n = out.global.i18n;
        this.language = out.global.language;
        this.routes = out.global.routes;
        this.io = out.global.io;
        if (this.io) {
            this.io.on("acl.alreadyLocked", username => {
                this.lockedModal.func.setActive(true, username);
            });
        }
    }

    async onMount() {
        this.aclEditForm = this.getComponent("aclEditForm");
        this.lockedModal = this.getComponent("z3_ap_pe_lockedModal");
        setTimeout(async () => {
            if (this.input.id !== "new") {
                await this.aclEditForm.func.loadData();
            }
        }, 10);
    }

    async onFormPostSuccess() {
        if (this.io) {
            this.io.z3.sendMessage("acl.release", {
                id: this.itemId
            });
        }
        window.router.navigate("acl", {
            successNotification: true,
        });
    }

    onButtonClick(obj) {
        switch (obj.id) {
        case "btnCancel":
            if (this.io) {
                this.io.z3.sendMessage("acl.release", {
                    id: this.itemId
                });
            }
            window.router.navigate("acl", {});
            break;
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }

    onLoadSuccess(data) {
        this.itemId = data._id;
        if (this.io) {
            this.io.z3.sendMessage("acl.lock", {
                id: data._id
            });
        }
    }
};
