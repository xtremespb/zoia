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
        const event = Object.keys(e.target.dataset).length ? {
            dataset: e.target.dataset,
            state: e.target.checked
        } : Object.keys(e.target.parentNode.dataset).length ? {
            dataset: e.target.parentNode.dataset,
            state: e.target.parentNode.checked
        } : Object.keys(e.target.parentNode.parentNode.dataset).length ? {
            dataset: e.target.parentNode.parentNode.dataset,
            state: e.target.parentNode.parentNode.checked
        } : {};
        this.emit("checkbox-change", {
            id: event.dataset.id,
            state: event.state
        });
    }
};
