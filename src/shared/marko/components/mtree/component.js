// const cloneDeep = require("lodash.clonedeep");
const {
    v4: uuidv4
} = require("uuid");
const {
    cloneDeep
} = require("lodash");

module.exports = class {
    onCreate() {
        const state = {
            data: [],
            selected: null
        };
        this.state = state;
        this.func = {
            initData: this.initData.bind(this)
        };
    }

    initTree(data, level = 1) {
        return data.map(i => {
            i.isVisible = level === 1;
            i.isOpen = false;
            i.uuid = i.uuid || uuidv4();
            if (i.c) {
                i.c = this.initTree(i.c, level + 1);
            }
            return i;
        });
    }

    initData(data) {
        this.state.data = this.initTree(data.c);
    }

    findNode(uuid, data) {
        let node;
        data.map(i => {
            if (i.uuid === uuid) {
                node = i;
            }
            if (!node && i.c) {
                node = this.findNode(uuid, i.c);
            }
        });
        return node;
    }

    onOpenCloseClick(uuid) {
        const data = cloneDeep(this.state.data);
        const item = this.findNode(uuid, data);
        item.isOpen = !item.isOpen;
        (item.c || []).map(i => i.isVisible = item.isOpen);
        this.state.data = data;
    }

    onItemClick(uuid) {
        this.state.selected = uuid;
    }
};
