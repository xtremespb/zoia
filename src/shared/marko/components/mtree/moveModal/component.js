const cloneDeep = require("lodash.clonedeep");

module.exports = class {
    onCreate() {
        const state = {
            active: false,
            data: [],
            root: null,
            selected: null
        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
            initData: this.initData.bind(this),
        };
    }

    onMount() {
        this.tree = this.getComponent("z3_ap_mt_tree");
    }

    initData(root, data) {
        console.log("Init data");
        console.log(root);
        console.log(data);
        this.setStateDirty({
            root: cloneDeep(root),
            data: cloneDeep(data),
        });
        this.setStateDirty("selected", root.uid);
    }

    setActive(state) {
        this.state.active = state;
    }

    onCloseClick() {
        this.setActive(false);
    }

    onConfirmClick() {
        this.setActive(false);
        this.emit("move-confirm");
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
