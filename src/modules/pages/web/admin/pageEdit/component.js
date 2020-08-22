module.exports = class {
    onCreate(input, out) {
        this.i18n = out.global.i18n;
        this.language = out.global.language;
        this.routes = out.global.routes;
    }

    onMount() {
        if (this.input.id !== "new") {
            this.getComponent("pageEditForm").loadData();
        }
        this.folderSelectModal = this.getComponent("z3_ap_pe_folderModal");
    }

    async onFormPostSuccess() {
        if (window.__z3_mtable_func && window.__z3_mtable_func["pages"]) {
            await window.__z3_mtable_func["pages"].loadData();
        }
        window.router.navigate("pages", {
            successNotification: true
        });
    }

    onButtonClick(obj) {
        switch (obj.id) {
        case "btnCancel":
            window.router.navigate("pages");
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }

    onGetKeyValue(data) {
        console.log("onGetKeyValue from Pages");
        console.log(data);
        this.folderSelectModal.func.setActive(true);
    }

    onFolderSelectConfirm(data) {
        console.log("onFolderSelectConfirm from Pages");
        console.log(data);
    }
};
