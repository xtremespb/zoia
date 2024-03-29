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
        this.pageEditForm = this.getComponent("pageEditForm");
        this.folderSelectModal = this.getComponent("z3_ap_pe_folderModal");
        this.lockedModal = this.getComponent("z3_ap_pe_lockedModal");
        this.editMode = false;
        setTimeout(async () => {
            if (this.input.id === "new") {
                const data = this.input.dir ? this.input.dir.data : "";
                const label = this.input.dir ? this.input.dir.label : "/";
                this.pageEditForm.func.setValue("dir", {
                    data,
                    label
                });
            } else {
                // this.pageEditForm.func.setViewMode(true);
                await this.pageEditForm.func.loadData();
            }
            await this.folderSelectModal.func.loadTree();
        }, 10);
    }

    async onFormPostSuccess() {
        this.pageEditForm.func.showNotification(this.i18n.t("dataSaveSuccess"), "is-success");
    }

    onEditMode() {
        if (this.io) {
            this.io.z3.sendMessage("pages.lock", {
                id: this.itemId
            });
        }
    }

    doClose(successNotification = false) {
        if (this.io) {
            this.io.z3.sendMessage("pages.release", {
                id: this.itemId
            });
        }
        window.router.navigate("pages", {
            dirData: this.pageEditForm.func.getValue("dir").data,
            successNotification,
        });
    }

    async doSave() {
        await this.pageEditForm.func.submitForm();
    }

    async onButtonClick(obj) {
        switch (obj.id) {
        case "close":
            this.doClose();
            break;
        case "save":
            await this.doSave();
            if (this.input.id === "new") {
                this.doClose(true);
            }
            break;
        case "saveAndClose":
            await this.doSave();
            this.doClose(true);
            break;
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
            this.folderSelectModal.func.selectUUID(dir.data);
        }
    }

    onFolderSelectConfirm(data) {
        this.pageEditForm.func.setValue("dir", {
            data: this.folderSelectModal.func.getRoot().uuid === data.uuid ? "" : data.uuid,
            label: data.label
        });
    }

    onGotTreeData() {
        const {
            data
        } = this.pageEditForm.func.getValue("dir");
        const label = !data || this.folderSelectModal.func.getRoot().uuid === data ? "/" : this.folderSelectModal.func.getUUIDLabel(data) || "";
        this.pageEditForm.func.setValue("dir", {
            data,
            label
        });
    }

    onTreeLoadingError() {
        this.pageEditForm.func.setError(this.i18n.t("cannotLoadFoldersTree"));
        this.treeLoadingError = true;
    }

    onLoadSuccess(data) {
        this.itemId = data._id;
    }
};
