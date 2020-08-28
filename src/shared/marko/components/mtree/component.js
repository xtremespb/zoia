const cloneDeep = require("lodash.clonedeep");
const {
    v4: uuidv4
} = require("uuid");
const md5 = require("crypto-js/md5");
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
            getSelected: this.getSelected.bind(this),
            getSelectedPath: this.getSelectedPath.bind(this),
            getSelectedLabel: this.getSelectedLabel.bind(this),
            getPathLabel: this.getPathLabel.bind(this),
            getUUIDLabel: this.getUUIDLabel.bind(this),
            getSelectedNodeIds: this.getSelectedNodeIds.bind(this),
            getSelectedNode: this.getSelectedNode.bind(this),
            getSelectedNeighboursIds: this.getSelectedNeighboursIds.bind(this),
            isRootSelected: this.isRootSelected.bind(this),
            getRoot: this.getRoot.bind(this),
        };
        this.i18n = out.global.i18n;
        this.language = out.global.language;
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

    calcChecksum(data, level = 1, parent = "", parentIndex = 0) {
        let prev;
        return data.map((i, index) => {
            i.checksum = md5(`${i.id}-${parent || i.id}-${level}-${prev || i.id}-${index}-${parentIndex}`).toString();
            if (i.c) {
                i.c = this.calcChecksum(i.c, level + 1, i.id, index);
            }
            prev = i.id;
            return i;
        });
    }

    initTree(data, level = 1) {
        return data.map(i => {
            i.isVisible = level < 2;
            i.isOpen = false;
            i.uuid = i.uuid || uuidv4();
            i.t = i.data && i.data[this.language] ? i.data[this.language] : i.id;
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
        const checksum = root.checksum || md5("-0-0").toString();
        this.state.root = {
            ...root,
            isVisible: true,
            isOpen: true,
            isRoot: true,
            c: [],
            uuid,
            checksum
        };
        this.state.selected = selected || uuid;
        const dataTree = this.initTree(cloneDeep(data.c));
        this.state.data = this.calcChecksum(dataTree);
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
            root: this.state.root.uuid === uuid,
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
        this.setStateDirty("data", this.calcChecksum(stateData));
        setTimeout(() => this.bindContextMenu(), 10);
        const selected = cloneDeep(this.state.selected);
        this.selectNodeByUUID(uuid);
        setTimeout(() => this.selectNodeByUUID(selected), 10);
        setTimeout(() => this.onTreeDataChanged(), 10);
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
        setTimeout(() => this.onTreeDataChanged(), 10);
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
        this.setStateDirty("data", this.calcChecksum(stateDataProcessed));
        setTimeout(() => this.onTreeDataChanged(true), 10);
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
        this.setStateDirty("data", this.calcChecksum(stateData));
        setTimeout(() => this.onTreeDataChanged(), 10);
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
        this.setStateDirty("data", this.calcChecksum(dataProcessed));
        this.unbindContextMenu();
        setTimeout(() => this.bindContextMenu(), 10);
        this.selectNodeByUUID(this.state.selected);
        setTimeout(() => this.onTreeDataChanged(), 10);
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
        this.setStateDirty("data", this.calcChecksum(dataProcessed));
        this.unbindContextMenu();
        setTimeout(() => this.bindContextMenu(), 10);
        this.setState("dragging", false);
        const selected = cloneDeep(this.state.selected);
        this.selectNodeByUUID(id);
        setTimeout(() => this.selectNodeByUUID(selected), 10);
        setTimeout(() => this.onTreeDataChanged(), 10);
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
        this.setStateDirty("data", this.calcChecksum(dataProcessed));
        this.unbindContextMenu();
        setTimeout(() => this.bindContextMenu(), 10);
        this.setState("dragging", false);
        const selected = cloneDeep(this.state.selected);
        this.selectNodeByUUID(id);
        setTimeout(() => this.selectNodeByUUID(selected), 10);
        setTimeout(() => this.onTreeDataChanged(), 10);
    }

    onItemDragStart() {
        this.setState("dragging", true);
    }

    onItemDragEnd() {
        this.setState("dragging", false);
    }

    serializeData(dataInput, keepUUID = false, keepChecksum = false) {
        const data = (dataInput || cloneDeep(this.state.data)).map(i => {
            delete i.isOpen;
            delete i.isVisible;
            delete i.t;
            if (!keepUUID) {
                delete i.uuid;
            }
            if (!keepChecksum) {
                delete i.checksum;
            }
            if (i.c && i.c.length) {
                i.c = this.serializeData(i.c, keepUUID, keepChecksum);
            } else {
                delete i.c;
            }
            return i;
        });
        return data;
    }

    onTreeDataChanged(setRootSelected = false) {
        const keepUUID = this.input.keepuuid || false;
        const keepChecksum = this.input.keepchecksum || false;
        const stateData = cloneDeep(this.state.data);
        const data = this.state.root ? {
            id: this.state.root.id,
            c: this.serializeData(null, keepUUID, keepChecksum)
        } : this.serializeData(null, keepUUID, keepChecksum);
        const {
            selected
        } = this.state;
        const path = this.utils.getPathByUUID(selected, stateData);
        this.emit("data-change", {
            data,
            path
        });
        if (setRootSelected) {
            setTimeout(() => this.onItemClick(this.state.root.uuid), 10);
        }
    }

    getSelected() {
        return this.state.selected;
    }

    isRootSelected() {
        return this.state.root.uuid === this.state.selected;
    }

    getRoot() {
        return this.state.root;
    }

    getSelectedNode() {
        const stateData = cloneDeep(this.state.data);
        return this.utils.findNodeByUUID(this.state.selected, stateData);
    }

    getSelectedPath() {
        return this.utils.getPathByUUID(this.state.selected, this.state.data);
    }

    getSelectedLabel() {
        const node = this.utils.findNodeByUUID(this.state.selected, this.state.data);
        return node ? node.t || node.id : "";
    }

    getPathLabel(path) {
        let data = this.state.data || [];
        let label = "";
        path.map((p, i) => {
            if (!data || !data.length) {
                return;
            }
            const node = this.utils.findNodeById(p, data);
            if (node && data && path.length - 1 === i) {
                label = node.t || node.id;
            }
            data = node && node.c ? node.c : null;
        });
        return label;
    }

    getUUIDLabel(uuid) {
        const data = cloneDeep(this.state.data);
        const node = this.utils.findNodeByUUID(uuid, data);
        return node ? node.t || node.id : null;
    }

    getSelectedNodeIds() {
        const stateData = cloneDeep(this.state.data);
        const nodes = this.state.selected === this.state.root.uuid ? stateData : this.utils.findNodeByUUID(this.state.selected, stateData).c || [];
        const ids = nodes.map(n => n.id.trim());
        return ids;
    }

    getSelectedNeighboursIds() {
        const stateData = cloneDeep(this.state.data);
        const nodes = this.utils.findNodesByUUID(this.state.selected, stateData) || [];
        const ids = nodes.map(n => n.id.trim());
        return ids;
    }
};
