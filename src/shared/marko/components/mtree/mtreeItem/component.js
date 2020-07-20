module.exports = class {
    onOpenCloseClick(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        this.emit("open-close-click", e.target ? e.target.dataset.id : e);
    }

    onItemClick(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        this.emit("item-click", e.target ? e.target.dataset.id : e);
    }
};
