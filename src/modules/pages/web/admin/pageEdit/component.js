module.exports = class {
    onCreate(input, out) {
        this.i18n = out.global.i18n;
        this.language = out.global.language;
        this.routes = out.global.routes;
    }

    async onMount() {
        this.treeLoadingError = false;
        this.pageEditForm = this.getComponent("pageEditForm");
        this.folderSelectModal = this.getComponent("z3_ap_pe_folderModal");
        if (this.input.id === "new") {
            const data = this.input.dir ? this.input.dir.data : [];
            const label = this.input.dir ? this.input.dir.label : "";
            this.pageEditForm.func.setValue("dir", {
                data,
                label
            });
        } else {
            await this.pageEditForm.func.loadData();
        }
        await this.folderSelectModal.func.loadTree();
    }

    async onFormPostSuccess() {
        // if (window.__z3_mtable_func && window.__z3_mtable_func["pages"]) {
        //     await window.__z3_mtable_func["pages"].loadData();
        // }
        window.router.navigate("pages", {
            successNotification: true,
            dirData: this.pageEditForm.func.getValue("dir").data
        });
    }

    onButtonClick(obj) {
        switch (obj.id) {
        case "btnCancel":
            window.router.navigate("pages", {
                dirData: this.pageEditForm.func.getValue("dir").data
            });
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }

    onGetKeyValue() {
        if (this.treeLoadingError) {
            return;
        }
        this.folderSelectModal.func.setActive(true);
        const dir = this.pageEditForm.func.getValue("dir");
        if (dir && dir.data) {
            this.folderSelectModal.func.selectPath(dir.data);
        }
    }

    onFolderSelectConfirm(data) {
        this.pageEditForm.func.setValue("dir", {
            data: data.path,
            label: data.label
        });
    }

    onGotTreeData() {
        const {
            data
        } = this.pageEditForm.func.getValue("dir");
        const label = this.folderSelectModal.func.getPathLabel(data) || "";
        this.pageEditForm.func.setValue("dir", {
            data,
            label
        });
    }

    onTreeLoadingError() {
        this.pageEditForm.func.setError(this.i18n.t("cannotLoadFoldersTree"));
        this.treeLoadingError = true;
    }
};
