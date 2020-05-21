const {
    v4: uuidv4
} = require("uuid");

module.exports = class {
    onCreate(input, out) {
        this.i18n = out.global.i18n;
        this.language = out.global.language;
    }

    onMount() {
        if (this.input.id !== "new") {
            this.getComponent("userEditForm").loadData();
        }
    }

    async onFormPostSuccess() {
        if (window.__z3_mtable_func && window.__z3_mtable_func["users"]) {
            await window.__z3_mtable_func["users"].loadData();
        }
        window.router.navigate("users", {
            successNotification: true
        });
    }

    onButtonClick(obj) {
        switch (obj.id) {
        case "btnCancel":
            window.router.navigate("users");
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`/users/login?_=${uuidv4()}`, this.language);
    }
};
