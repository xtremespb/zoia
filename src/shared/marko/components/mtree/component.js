const cloneDeep = require("lodash.clonedeep");
const {
    v4: uuidv4
} = require("uuid");

module.exports = class {
    onCreate() {
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
            setLoading: this.setLoading.bind(this)
        };
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
};
