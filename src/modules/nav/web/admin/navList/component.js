const axios = require("axios");
const Cookies = require("../../../../../shared/lib/cookies").default;

/* eslint-disable arrow-body-style */
module.exports = class {
    onCreate(input, out) {
        this.state = {
            error: null,
            loading: false,
            burger: false,
            preview: "",
            changed: false,
            data: null,
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
        this.tree = this.getComponent("z3_ap_nav_tree");
        this.editModal = this.getComponent("z3_ap_nav_editModal");
        await this.loadTree();
        if (window.__zoiaTippyJs) {
            window.__zoiaTippyJs.reset();
        }
    }

    setLoadingTree(state) {
        this.tree.func.setLoading(state);
    }

    async loadTree() {
        if (this.state.loading) {
            return;
        }
        this.setLoadingTree(true);
        try {
            const res = await axios({
                method: "post",
                url: "/api/nav/tree/load",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            const treeData = res.data.tree || {};
            this.tree.func.initData(treeData);
            this.buildNav(treeData.c);
            this.setLoadingTree(false);
        } catch (e) {
            this.setLoadingTree(false);
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer");
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
            url: data.item.url,
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
    async onTreeItemClick() { // data
        // Do nothing
    }

    buildNav(data) {
        let html = "";
        data.map(i => {
            if (i.c) {
                html += `<div class="navbar-item has-dropdown is-hoverable"><a class="navbar-link">${i.data[this.language].title}</a><div class="navbar-dropdown">`;
                i.c.map(c => {
                    html += `<a class="navbar-item">${c.data[this.language].title}</a>`;
                });
                html += "</div></div>";
            } else {
                html += `<a class="navbar-item">${i.data[this.language].title}</a>`;
            }
        });
        this.setState("preview", html);
    }

    // Tree has been changed
    async onTreeDataChange(data) {
        this.buildNav(data.data.c);
        this.state.changed = true;
        this.state.data = data;
    }

    async treeDataSave() {
        if (!this.state.changed) {
            return;
        }
        this.setLoadingTree(true);
        try {
            await axios({
                method: "post",
                url: "/api/nav/tree/save",
                data: {
                    tree: this.state.data.data.c
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.setLoadingTree(false);
            this.buildNav(this.state.data.data.c);
            this.state.changed = false;
            this.state.data = null;
        } catch (e) {
            this.setLoadingTree(false);
            this.state.error = e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword ? this.i18n.t(e.response.data.error.errorKeyword) : this.i18n.t("couldNotLoadDataFromServer");
        }
    }

    onBurgerClick(e) {
        e.preventDefault();
        this.state.burger = !this.state.burger;
    }
};
