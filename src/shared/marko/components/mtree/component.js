const cloneDeep = require("lodash.clonedeep");
const {
    v4: uuidv4
} = require("uuid");
const Utils = require("./utils");

module.exports = class {
    onCreate(input, out) {
        const state = {
            loading: false,
            data: [],
            root: null,
            selected: null,
            dragging: false
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
        this.controls = input.controls || false;
        this.utils = new Utils();
    }

    onMount() {
        this.deleteModal = this.getComponent("z3_ap_mt_deleteModal");
        this.moveModal = this.getComponent("z3_ap_mt_moveModal");
        window.addEventListener("click", this.onContextMenuHide.bind(this));
    }

    onContextMenu(e) {
        e.preventDefault();
        this.getComponent("z3_ap_mt_treeMenu").func.setActive(true, e.pageX, e.pageY, e.currentTarget.dataset.id, e.currentTarget.dataset.order, e.currentTarget.dataset.len);
    }

    onContextMenuHide(e) {
        const menu = document.getElementById("z3_ap_mt_menu");
        if (menu && !menu.contains(e.target)) {
            this.getComponent("z3_ap_mt_treeMenu").func.setActive(false);
        }
    }

    bindContextMenu() {
        const items = document.querySelectorAll(".z3-mtr-subitem");
        Array.from(items).map(i => {
            i.addEventListener("contextmenu", this.onContextMenu.bind(this));
            i.addEventListener("longtap", this.onContextMenu.bind(this));
        });
    }

    unbindContextMenu() {
        const items = document.querySelectorAll(".z3-mtr-subitem");
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

    selectNode(path) {
        let data = this.state.data || [];
        path.map((p, i) => {
            if (!data || !data.length) {
                return;
            }
            const node = this.utils.findNodeById(p, data);
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
        const path = this.utils.getPathByUUID(uuid, data);
        path.map((p, i) => {
            if (!data || !data.length) {
                return;
            }
            const node = this.utils.findNodeById(p, data);
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

    onOpenCloseClick(uuid) {
        const data = cloneDeep(this.state.data);
        const item = this.utils.findNodeByUUID(uuid, data);
        item.isOpen = !item.isOpen;
        (item.c || []).map(i => i.isVisible = item.isOpen);
        this.state.data = data;
    }

    onItemClick(uuid) {
        this.state.selected = uuid;
        const data = cloneDeep(this.state.data);
        const path = this.utils.getPathByUUID(uuid, data);
        const item = this.utils.findNodeByUUID(uuid, data);
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
        const path = this.utils.getPathByUUID(this.state.selected, data);
        const item = this.utils.findNodeByUUID(this.state.selected, data) || this.state.root;
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
            const item = this.utils.findNodeByUUID(uuid, stateData);
            item.c = item.c || [];
            item.c.push(data);
        }
        this.setStateDirty("data", stateData);
        setTimeout(() => this.bindContextMenu(), 10);
        const selected = cloneDeep(this.state.selected);
        this.selectNodeByUUID(uuid);
        setTimeout(() => this.selectNodeByUUID(selected), 10);
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
        const item = this.utils.findNodeByUUID(uuid, stateData);
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
        const item = this.utils.findNodeByUUID(this.state.selected, stateData);
        this.deleteModal.func.setActive(true);
        this.deleteModal.func.setItems(item.t || item.id);
        setTimeout(() => this.bindContextMenu(), 10);
    }

    onDeleteConfirm() {
        const stateData = cloneDeep(this.state.data);
        const stateDataProcessed = this.utils.removeNodeByUUID(this.state.selected, stateData);
        this.state.selected = this.state.root.uuid;
        this.setStateDirty("data", stateDataProcessed);
    }

    onMenuItemClick(data) {
        this.setStateDirty("selected", data.uid);
        const stateData = cloneDeep(this.state.data);
        const item = this.utils.findNodeByUUID(this.state.selected, stateData);
        const nodes = this.utils.findNodesByUUID(data.uid, stateData);
        switch (data.cmd) {
        case "up":
            const u1 = cloneDeep(nodes[data.order]);
            const u2 = cloneDeep(nodes[data.order - 1]);
            nodes[data.order] = u2;
            nodes[data.order - 1] = u1;
            break;
        case "down":
            const d1 = cloneDeep(nodes[data.order]);
            const d2 = cloneDeep(nodes[data.order + 1]);
            nodes[data.order] = d2;
            nodes[data.order + 1] = d1;
            break;
        case "move":
            this.moveModal.func.initData(this.state.root, this.state.data);
            this.moveModal.func.setTitle(item.t || item.id);
            this.moveModal.func.setActive(true);
        }
        this.setStateDirty("data", stateData);
    }

    onMoveConfirm(uid) {
        if (uid === this.state.selected) {
            return;
        }
        const data = cloneDeep(this.state.data);
        const itemSrc = cloneDeep(this.utils.findNodeByUUID(this.state.selected, data));
        const dataProcessed = this.utils.removeNodeByUUID(this.state.selected, data) || [];
        if (uid === this.state.root.uuid) {
            // Shall be moved to the root
            dataProcessed.push(itemSrc);
        } else {
            // Shall be moved to the tree
            const itemDest = this.utils.findNodeByUUID(uid, dataProcessed);
            if (itemDest) {
                itemDest.c = itemDest.c || [];
                itemDest.c.push(itemSrc);
            }
        }
        this.setStateDirty("data", dataProcessed);
        this.unbindContextMenu();
        setTimeout(() => this.bindContextMenu(), 10);
        this.selectNodeByUUID(this.state.selected);
    }

    onGapDrop(dropData) {
        const [id, gapId, isTop] = dropData.split(/,/);
        const data = cloneDeep(this.state.data);
        const itemSrc = cloneDeep(this.utils.findNodeByUUID(id, data));
        const dataProcessed = this.utils.removeNodeByUUID(id, data) || [];
        const gapNodes = this.utils.findNodesByUUID(gapId, dataProcessed);
        if (!gapNodes || !gapNodes.length) {
            return;
        }
        if (isTop) {
            gapNodes.unshift(itemSrc);
        } else {
            const idx = gapNodes.findIndex(i => i.uuid === gapId);
            gapNodes.splice(idx + 1, 0, itemSrc);
        }
        this.setStateDirty("data", dataProcessed);
        this.unbindContextMenu();
        setTimeout(() => this.bindContextMenu(), 10);
        this.setState("dragging", false);
        const selected = cloneDeep(this.state.selected);
        this.selectNodeByUUID(id);
        setTimeout(() => this.selectNodeByUUID(selected), 10);
    }

    onItemDrop(dropData) {
        const [id, itemId] = dropData.split(/,/);
        const data = cloneDeep(this.state.data);
        const itemSrc = cloneDeep(this.utils.findNodeByUUID(id, data));
        const dataProcessed = this.utils.removeNodeByUUID(id, data) || [];
        const newNode = this.utils.findNodeByUUID(itemId, dataProcessed);
        if (!newNode) {
            return;
        }
        newNode.c = newNode.c || [];
        newNode.c.push(itemSrc);
        this.setStateDirty("data", dataProcessed);
        this.unbindContextMenu();
        setTimeout(() => this.bindContextMenu(), 10);
        this.setState("dragging", false);
        const selected = cloneDeep(this.state.selected);
        this.selectNodeByUUID(id);
        setTimeout(() => this.selectNodeByUUID(selected), 10);
    }

    onItemDragStart() {
        this.setState("dragging", true);
    }

    onItemDragEnd() {
        this.setState("dragging", false);
    }
};
