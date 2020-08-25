const axios = require("axios");
const Cookies = require("../../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            active: false,
            error: null,
            loading: false,
            treeData: null,
            treeDataTemp: null
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
            selectPath: this.selectPath.bind(this),
            getPathLabel: this.getPathLabel.bind(this),
            loadTree: this.loadTree.bind(this),
        };
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
        this.i18n = out.global.i18n;
    }

    onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
        this.tree = this.getComponent("z3_ap_ps_tree");
        this.editModal = this.getComponent("z3_ap_ps_editModal");
    }

    setActive(state) {
        this.state.active = state;
        if (state && this.state.treeData) {
            this.tree.func.initData(this.state.treeData);
            this.state.treeDataTemp = null;
        }
    }

    onCloseClick() {
        if (!this.state.loading) {
            this.setActive(false);
        }
    }

    async onConfirmClick() {
        const path = this.tree.func.getSelectedPath();
        const label = this.tree.func.getSelectedLabel();
        if (!this.state.loading) {
            if (this.state.treeDataTemp) {
                this.setLoadingTree(true);
                try {
                    await axios({
                        method: "post",
                        url: "/api/pages/tree/save",
                        data: {
                            tree: this.state.treeDataTemp.c
                        },
                        headers: {
                            Authorization: `Bearer ${this.token}`
                        }
                    });
                    this.setLoadingTree(false);
                    this.state.treeData = this.state.treeDataTemp;
                } catch (e) {
                    this.setLoadingTree(false);
                    this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer");
                    return;
                }
            }
            this.setActive(false);
            this.emit("confirm", {
                path,
                label
            });
        }
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
            const tree = res.data.tree || {};
            this.tree.func.initData(tree);
            this.state.treeData = tree;
            this.setLoadingTree(false);
            this.state.treeDataTemp = null;
            this.emit("got-tree-data");
        } catch (e) {
            console.log(e);
            this.setLoadingTree(false);
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer");
            this.emit("tree-loading-error");
        }
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

    setLoadingTree(state) {
        this.tree.func.setLoading(state);
        this.state.loading = state;
        this.state.error = null;
    }

    onFolderSave(data) {
        if (data.uuid) {
            this.tree.func.saveChild(data.uuid, data.item);
        } else {
            this.tree.func.addChild(data.item);
        }
    }

    onTreeDataChange(changed) {
        this.state.treeDataTemp = changed.data;
    }

    onErrorDeleteClick() {
        this.state.error = null;
    }

    selectPath(path) {
        this.tree.func.selectNode(path);
    }

    getPathLabel(path) {
        return this.tree.func.getPathLabel(path);
    }
};
