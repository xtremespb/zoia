module.exports = class {
    onCreate(input, out) {
        this.i18n = out.global.i18n;
    }

    async onMount() {
        this.configEditForm = this.getComponent("configEditForm");
        this.mNotify = this.getComponent("configEdit_mnotify");
        await this.configEditForm.func.loadData();
    }

    onFormPostSuccess() {
        this.mNotify.func.show(this.i18n.t("dataSaveSuccess"), "is-success");
    }
};
