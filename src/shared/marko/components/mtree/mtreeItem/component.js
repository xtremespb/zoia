module.exports = class {
    onCreate(input) {
        const state = {
            overItem: false
        };
        this.state = state;
        this.itemId = input.data.uuid;
    }

    onOpenCloseClick(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        const dataset = e.target ? (Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {}) : e;
        this.emit("open-close-click", dataset.id || e);
    }

    onItemClick(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        const dataset = e.target ? (Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {}) : e;
        this.emit("item-click", dataset.id || e);
    }

    onTreeItemDragStart(e) {
        const dataset = e.target ? (Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {}) : e;
        e.dataTransfer.setData("text/plain", `__ztr__${dataset.id}`);
        this.emit("drag-start");
    }

    onGapDrop(id) {
        this.emit("gap-drop", id);
    }

    onItemDropEvent(id) {
        this.emit("item-drop", id);
    }

    onTreeItemDragEnd() {
        this.emit("drag-end");
    }

    onTreeItemComponentDragStart() {
        this.emit("drag-start");
    }

    onTreeItemComponentDragEnd() {
        this.emit("drag-end");
    }

    onItemDragOver(e) {
        e.preventDefault();
    }

    onItemDragEnter(e) {
        e.preventDefault();
        this.state.overItem = true;
    }

    onItemDragLeave(e) {
        e.preventDefault();
        this.state.overItem = false;
    }

    onItemDrop(e) {
        if (!e.dataTransfer.getData("text/plain") || !e.dataTransfer.getData("text/plain").match(/^__ztr__/)) {
            e.preventDefault();
            return;
        }
        this.onItemDragLeave(e);
        const id = e.dataTransfer.getData("text/plain").replace(/^__ztr__/, "");
        this.emit("item-drop", `${id},${this.itemId}`);
    }
};
