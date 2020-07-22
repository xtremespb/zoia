module.exports = class {
    onFileClick(e) {
        e.preventDefault();
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        this.emit("file-click", {
            name: dataset.name,
            dir: dataset.dir !== undefined
        });
    }

    onCheckboxChange(e) {
        this.emit("checkbox-change", {
            id: e.target.dataset.id,
            state: e.target.checked
        });
    }
};
