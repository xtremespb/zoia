const axios = require("axios");
const Cookies = require("../../../../../shared/lib/cookies").default;

/* eslint-disable arrow-body-style */
module.exports = class {
    onCreate(input, out) {
        this.state = {
            processValue: null,
            dir: "",
            loading: false
        };
        this.i18n = out.global.i18n;
        this.language = out.global.language;
        this.routes = out.global.routes;
        this.cookieOptions = out.global.cookieOptions;
        this.siteId = out.global.siteId;
    }

    async onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteId || "zoia3"}.authToken`);
        this.tree = this.getComponent("z3_ap_ps_tree");
        this.table = this.getComponent("z3_ap_ps_table");
        this.editModal = this.getComponent("z3_ap_ps_editModal");
        // eslint-disable-next-line no-unused-vars
        this.state.processValue = (id, value, column, row) => {
            switch (column) {
            case "engine":
                return this.i18n.t(`${value}Engine`);
            default:
                return value;
            }
        };
        if (this.input.successNotification) {
            this.getComponent(`pagesList_mnotify`).func.show(this.i18n.t("dataSaveSuccess"), "is-success");
        }
        await this.loadTree();
        if (this.input.dirData) {
            this.state.dir = this.input.dirData;
            this.tree.func.selectNodeByUUID(this.input.dirData);
        }
        await this.table.func.dataRequest({
            dir: this.state.dir
        });
        if (window.__zoiaTippyJs) {
            window.__zoiaTippyJs.reset();
        }
    }

    setLoadingTree(state) {
        this.tree.func.setLoading(state);
    }

    async loadTree() {
        this.setLoadingTree(true);
        try {
            const res = await axios({
                method: "post",
                url: "/api/pages/tree/load",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            const treeData = res.data.tree || {};
            this.tree.func.initData(treeData);
            this.setLoadingTree(false);
        } catch (e) {
            this.setLoadingTree(false);
            const error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer");
            this.table.func.setError(error);
        }
    }

    // eslint-disable-next-line class-methods-use-this
    onActionClick(obj) {
        switch (obj.action) {
        case "btnEdit":
            setTimeout(() => window.router.navigate(obj.data.engine === "pm" ? "pages.editPM" : "pages.editRaw", {
                id: obj.id
            }), 10);
            break;
        }
    }

    onTopButtonClick(obj) {
        switch (obj.button) {
        case "btnReload":
            this.table.func.dataRequest();
            break;
        case "ddAddPageRaw":
            const data = this.tree.func.isRootSelected() ? "" : this.tree.func.getSelected();
            const label = this.tree.func.isRootSelected() ? "/" : this.tree.func.getSelectedLabel();
            window.router.navigate("pages.editRaw", {
                id: "new",
                dir: {
                    data,
                    label
                },
            });
            break;
        case "ddAddPagePM":
            const dataPm = this.tree.func.isRootSelected() ? "" : this.tree.func.getSelected();
            const labelPm = this.tree.func.isRootSelected() ? "/" : this.tree.func.getSelectedLabel();
            window.router.navigate("pages.editPM", {
                id: "new",
                dir: {
                    dataPm,
                    labelPm,
                },
            });
            break;
        }
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }

    onFolderAddClick() { // Param: data
        this.editModal.func.setTitle(this.i18n.t("addFolder"));
        this.editModal.func.setUUID(null);
        this.editModal.func.setData({});
        this.editModal.func.setTreeData(this.tree.func.getSelectedNode(), this.tree.func.getSelectedNodeIds());
        this.editModal.func.setActive(true);
    }

    onFolderEditClick(data) { // Param: data
        this.editModal.func.setTitle(this.i18n.t("editFolder"));
        this.editModal.func.setUUID(data.uuid);
        this.editModal.func.setData({
            id: data.item.id,
            ...data.item.data
        });
        this.editModal.func.setTreeData(this.tree.func.getSelectedNode(), this.tree.func.getSelectedNeighboursIds());
        this.editModal.func.setActive(true);
    }

    onFolderSave(data) {
        if (data.uuid) {
            this.tree.func.saveChild(data.uuid, data.item);
        } else {
            this.tree.func.addChild(data.item);
        }
    }

    // User has clicked a tree item
    async onTreeItemClick(data) {
        const dir = data.root ? "" : data.item.uuid;
        this.state.dir = dir;
        this.table.func.dataRequest({
            dir
        });
    }

    // Tree has been changed
    async onTreeDataChange(data) {
        this.setLoadingTree(true);
        try {
            await axios({
                method: "post",
                url: "/api/pages/tree/save",
                data: {
                    tree: data.data.c
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.setLoadingTree(false);
        } catch (e) {
            this.setLoadingTree(false);
            const error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer");
            this.table.func.setError(error);
        }
    }
};
