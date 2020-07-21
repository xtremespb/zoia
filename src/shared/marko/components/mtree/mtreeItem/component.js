module.exports = class {
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
};
