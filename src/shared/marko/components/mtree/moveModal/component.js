const cloneDeep = require("lodash.clonedeep");

module.exports = class {
    onCreate() {
        const state = {
            active: false,
            data: [],
            root: null,
            selected: null,
            title: ""
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
            initData: this.initData.bind(this),
            setTitle: this.setTitle.bind(this),
        };
    }

    onMount() {
        this.tree = this.getComponent("z3_ap_mt_tree");
    }

    initTree(data, level = 1) {
        return data.map(i => {
            i.isVisible = level < 2;
            i.isOpen = false;
            if (i.c) {
                i.c = this.initTree(i.c, level + 1);
            }
            return i;
        });
    }

    initData(root, data) {
        this.state.root = cloneDeep(root);
        this.state.data = this.initTree(cloneDeep(data));
        this.state.selected = root.uuid;
    }

    setActive(state) {
        this.state.active = state;
    }

    setTitle(title) {
        this.state.title = title;
    }

    onCloseClick() {
        this.setActive(false);
    }

    onConfirmClick() {
        this.setActive(false);
        this.emit("move-confirm", this.state.selected);
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
    }
};
