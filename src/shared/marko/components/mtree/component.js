const cloneDeep = require("lodash.clonedeep");
const {
    v4: uuidv4
} = require("uuid");

module.exports = class {
    onCreate(input, out) {
        const state = {
            loading: false,
            data: [],
            root: null,
            selected: null
        };
        this.state = state;
        this.func = {
            initData: this.initData.bind(this),
            selectNode: this.selectNode.bind(this),
            setLoading: this.setLoading.bind(this),
            addChild: this.addChild.bind(this),
            saveChild: this.saveChild.bind(this),
            selectNodeByUUID: this.selectNodeByUUID.bind(this),
        };
        this.i18n = out.global.i18n;
    }

    onMount() {
        this.deleteModal = this.getComponent("z3_ap_mt_deleteModal");
        window.addEventListener("click", this.onContextMenuHide.bind(this));
    }

    onContextMenu(e) {
        console.log("onContextMenu");
        e.preventDefault();
        this.getComponent("z3_ap_mt_treeMenu").func.setActive(true, e.pageX, e.pageY, e.currentTarget.dataset.id, e.currentTarget.dataset.directory, e.currentTarget.dataset.ro, e.currentTarget.dataset.zip);
    }

    onContextMenuHide(e) {
        console.log("onContextMenuHide");
        const menu = document.getElementById("z3_ap_mt_menu");
        if (menu && !menu.contains(e.target)) {
            this.getComponent("z3_ap_mt_treeMenu").func.setActive(false);
        }
    }

    bindContextMenu() {
        const items = document.querySelectorAll(".z3-mtr-item-wrap");
        Array.from(items).map(i => {
            i.addEventListener("contextmenu", this.onContextMenu.bind(this));
            i.addEventListener("longtap", this.onContextMenu.bind(this));
        });
    }

    unbindContextMenu() {
        const items = document.querySelectorAll(".z3-mtr-item-wrap");
        Array.from(items).map(i => {
            i.removeEventListener("contextmenu", this.onContextMenu.bind(this));
            i.removeEventListener("longtap", this.onContextMenu.bind(this));
        });
    }

    initTree(data, level = 1) {
        return data.map(i => {
            i.isVisible = level < 2;
            i.isOpen = false;
            i.uuid = i.uuid || uuidv4();
            if (i.c) {
                i.c = this.initTree(i.c, level + 1);
            }
            return i;
        });
    }

    initData(data, selected) {
        this.unbindContextMenu();
        const root = cloneDeep(data);
        const uuid = root.uuid || uuidv4();
        this.state.root = {
            ...root,
            isVisible: true,
            isOpen: true,
            c: [],
            uuid
        };
        this.state.selected = selected || uuid;
        this.state.data = this.initTree(cloneDeep(data.c));
        setTimeout(() => this.bindContextMenu(), 10);
    }

    findNodeByUUID(uuid, data) {
        let node;
        data.map(i => {
            if (i.uuid === uuid) {
                node = i;
            }
            if (!node && i.c) {
                node = this.findNodeByUUID(uuid, i.c);
            }
        });
        return node;
    }

    removeNodeByUUID(uuid, data) {
        return data.map(i => {
            if (i.uuid === uuid) {
                i = null;
            }
            if (i && i.c && i.c.length) {
                i.c = this.removeNodeByUUID(uuid, i.c);
            }
            return i;
        }).filter(i => i);
    }

    findNodeById(id, data) {
        let node;
        data.map(i => {
            if (i.id === id) {
                node = i;
            }
        });
        return node;
    }

    selectNode(path) {
        let data = this.state.data || [];
        path.map((p, i) => {
            if (!data || !data.length) {
                return;
            }
            const node = this.findNodeById(p, data);
            if (node && data) {
                node.isVisible = true;
                // node.isOpen = path.length - 1 !== i;
                node.isOpen = (node.c && node.c.length && node.c[0].isVisible) || path.length - 1 !== i;
                if (path.length - 1 === i) {
                    this.state.selected = node.uuid;
                } else if (node.c) {
                    node.c.map(n => n.isVisible = true);
                }
            }
            data = node && node.c ? node.c : null;
        });
        if (!path.length && this.state.root) {
            this.state.selected = this.state.root.uuid;
        }
    }

    selectNodeByUUID(uuid) {
        let data = this.state.data || [];
        const path = this.getPathByUUID(uuid, data);
        path.map((p, i) => {
            if (!data || !data.length) {
                return;
            }
            const node = this.findNodeById(p, data);
            if (node && data) {
                node.isVisible = true;
                // node.isOpen = path.length - 1 !== i;
                node.isOpen = (node.c && node.c.length && node.c[0].isVisible) || path.length - 1 !== i;
                if (path.length - 1 === i) {
                    this.state.selected = node.uuid;
                } else if (node.c) {
                    node.c.map(n => n.isVisible = true);
                }
            }
            data = node && node.c ? node.c : null;
        });
        if (!path.length && this.state.root) {
            this.state.selected = this.state.root.uuid;
        }
    }

    getPathByUUID(uuid, data, path = []) {
        let res = [];
        data.map(i => {
            if (res.length) {
                return;
            }
            path.push(i.id);
            if (i.uuid === uuid) {
                res = path;
                return;
            }
            if (i.c) {
                const sr = this.getPathByUUID(uuid, i.c, path);
                if (sr.length) {
                    res = path;
                    return;
                }
            }
            path.pop();
        });
        return res;
    }

    onOpenCloseClick(uuid) {
        const data = cloneDeep(this.state.data);
        const item = this.findNodeByUUID(uuid, data);
        item.isOpen = !item.isOpen;
        (item.c || []).map(i => i.isVisible = item.isOpen);
        this.state.data = data;
    }

    onItemClick(uuid) {
        this.state.selected = uuid;
        const data = cloneDeep(this.state.data);
        const path = this.getPathByUUID(uuid, data);
        const item = this.findNodeByUUID(uuid, data);
        this.emit("item-click", {
            item,
            path
        });
    }

    setLoading(state) {
        this.state.loading = state;
    }

    emitAddEdit(mode) {
        const data = cloneDeep(this.state.data);
        const path = this.getPathByUUID(this.state.selected, data);
        const item = this.findNodeByUUID(this.state.selected, data) || this.state.root;
        this.emit(mode, {
            uuid: this.state.selected,
            path,
            item
        });
    }

    onAddClick(e) {
        if (e.target.disabled ? e.target.disabled : e.target.parentNode.disabled ? e.target.parentNode.disabled : e.target.parentNode.parentNode.disabled ? e.target.parentNode.parentNode.disabled : false) {
            return;
        }
        this.emitAddEdit("add");
    }

    addChild(data, uuid = this.state.selected) {
        this.unbindContextMenu();
        const stateData = cloneDeep(this.state.data);
        if (uuid === this.state.root.uuid) {
            stateData.push(data);
            this.setState("data", stateData);
        } else {
            const item = this.findNodeByUUID(uuid, stateData);
            item.c = item.c || [];
            item.c.push(data);
        }
        this.setStateDirty("data", stateData);
        setTimeout(() => this.bindContextMenu(), 10);
    }

    onEditClick(e) {
        if (e.target.disabled ? e.target.disabled : e.target.parentNode.disabled ? e.target.parentNode.disabled : e.target.parentNode.parentNode.disabled ? e.target.parentNode.parentNode.disabled : false) {
            return;
        }
        this.emitAddEdit("edit");
    }

    saveChild(uuid, data) {
        this.unbindContextMenu();
        const stateData = cloneDeep(this.state.data);
        const item = this.findNodeByUUID(uuid, stateData);
        Object.keys(data).map(k => {
            if (k !== "uuid") {
                item[k] = data[k];
            }
        });
        this.setStateDirty("data", stateData);
        setTimeout(() => this.bindContextMenu(), 10);
    }

    onDeleteClick(e) {
        this.unbindContextMenu();
        if (e.target.disabled ? e.target.disabled : e.target.parentNode.disabled ? e.target.parentNode.disabled : e.target.parentNode.parentNode.disabled ? e.target.parentNode.parentNode.disabled : false) {
            return;
        }
        const stateData = cloneDeep(this.state.data);
        const item = this.findNodeByUUID(this.state.selected, stateData);
        this.deleteModal.func.setActive(true);
        this.deleteModal.func.setItems(item.t);
        setTimeout(() => this.bindContextMenu(), 10);
    }

    onDeleteConfirm() {
        const stateData = cloneDeep(this.state.data);
        const stateDataProcessed = this.removeNodeByUUID(this.state.selected, stateData);
        this.state.selected = this.state.root.uuid;
        this.setStateDirty("data", stateDataProcessed);
    }
};
