module.exports = class {
    onCreate(input, out) {
        this.i18n = out.global.i18n;
        this.language = out.global.language;
        this.routes = out.global.routes;
        this.io = out.global.io;
        if (this.io) {
            this.io.on("pages.alreadyLocked", username => {
                this.lockedModal.func.setActive(true, username);
            });
        }
    }

    async onMount() {
        this.treeLoadingError = false;
        this.pageEditRawForm = this.getComponent("pageEditRawForm");
        this.folderSelectModal = this.getComponent("z3_ap_pe_folderModal");
        this.lockedModal = this.getComponent("z3_ap_pe_lockedModal");
        setTimeout(async () => {
            if (this.input.id === "new") {
                const data = this.input.dir ? this.input.dir.data : "";
                const label = this.input.dir ? this.input.dir.label : "/";
                this.pageEditRawForm.func.setValue("dir", {
                    data,
                    label
                });
            } else {
                await this.pageEditRawForm.func.loadData();
            }
            await this.folderSelectModal.func.loadTree();
        }, 10);
    }

    async onFormPostSuccess() {
        // if (window.__z3_mtable_func && window.__z3_mtable_func["pages"]) {
        //     await window.__z3_mtable_func["pages"].loadData();
        // }
        if (this.io) {
            this.io.z3.sendMessage("pages.release", {
                id: this.itemId
            });
        }
        window.router.navigate("pages", {
            successNotification: true,
            dirData: this.pageEditRawForm.func.getValue("dir").data
        });
    }

    onButtonClick(obj) {
        switch (obj.id) {
        case "btnCancel":
            if (this.io) {
                this.io.z3.sendMessage("pages.release", {
                    id: this.itemId
                });
            }
            window.router.navigate("pages", {
                dirData: this.pageEditRawForm.func.getValue("dir").data
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
        const dir = this.pageEditRawForm.func.getValue("dir");
        if (dir && dir.data) {
            this.folderSelectModal.func.selectUUID(dir.data);
        }
    }

    onFolderSelectConfirm(data) {
        this.pageEditRawForm.func.setValue("dir", {
            data: this.folderSelectModal.func.getRoot().uuid === data.uuid ? "" : data.uuid,
            label: data.label
        });
    }

    onGotTreeData() {
        const {
            data
        } = this.pageEditRawForm.func.getValue("dir");
        const label = !data || this.folderSelectModal.func.getRoot().uuid === data ? "/" : this.folderSelectModal.func.getUUIDLabel(data) || "";
        this.pageEditRawForm.func.setValue("dir", {
            data,
            label
        });
    }

    onTreeLoadingError() {
        this.pageEditRawForm.func.setError(this.i18n.t("cannotLoadFoldersTree"));
        this.treeLoadingError = true;
    }

    onLoadSuccess(data) {
        this.itemId = data._id;
        if (this.io) {
            this.io.z3.sendMessage("pages.lock", {
                id: data._id
            });
        }
    }
};
