module.exports = class {
    onCreate() {
        const state = {
            tab: "controls",
        };
        this.state = state;
    }

    onTabClick(e) {
        e.preventDefault();
        const {
            id
        } = e.target.dataset;
        this.setState("tab", id);
    }
};
