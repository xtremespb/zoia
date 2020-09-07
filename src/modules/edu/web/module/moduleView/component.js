module.exports = class {
    onCreate(input, out) {
        this.i18n = out.global.i18n;
        this.moduleData = out.global.moduleData;
    }

    onMount() {
        this.confirmModal = this.getComponent("z3_edu_mv_confirmModal");
    }

    onStartTestClick(e) {
        const {
            url,
            test
        } = e.target.dataset;
        this.confirmModal.func.setTitle(this.moduleData.tests[test].title);
        this.confirmModal.func.setMessage(this.moduleData.tests[test].descDialog);
        this.confirmModal.func.setURL(url);
        this.confirmModal.func.setActive(true);
    }

    onConfirmTestStart(url) {
        window.location.href = url;
    }
};
