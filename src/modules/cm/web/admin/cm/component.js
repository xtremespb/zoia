module.exports = class {
    onCreate(input, out) {
        this.i18n = out.global.i18n;
        const state = {
            tab: "files"
        };
        this.state = state;
    }

    onTabClick(e) {
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        this.state.tab = dataset.id;
    }
};
