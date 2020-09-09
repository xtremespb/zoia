module.exports = class {
    onCreate(input, out) {
        this.i18n = out.global.i18n;
        this.moduleData = out.global.moduleData;
    }

    onMount() {
        this.confirmModal = this.getComponent("z3_edu_mv_confirmModal");
    }

    onStartTestClick(e) {
        const dataset = Object.keys(e.target.dataset).length ? e.target.dataset : Object.keys(e.target.parentNode.dataset).length ? e.target.parentNode.dataset : Object.keys(e.target.parentNode.parentNode.dataset).length ? e.target.parentNode.parentNode.dataset : {};
        this.confirmModal.func.setTitle(this.moduleData.tests[dataset.test].title);
        this.confirmModal.func.setMessage(this.moduleData.tests[dataset.test].descDialog);
        this.confirmModal.func.setURL(dataset.url);
        this.confirmModal.func.setActive(true);
    }

    onConfirmTestStart(url) {
        window.location.href = url;
    }
};
