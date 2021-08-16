module.exports = class {
    onCreate(input, out) {
        const state = {
        };
        this.state = state;
        this.i18n = out.global.i18n;
        this.language = out.global.language;
        this.routes = out.global.routes;
    }

    onMount() {
        this.configForm = this.getComponent("configForm");
        setTimeout(async () => this.configForm.func.loadData(), 10);
    }

    onFormPostSuccess() {
    }

    onUnauthorized() {
        window.location.href = this.i18n.getLocalizedURL(`${this.routes.login}?_=${new Date().getTime()}`, this.language);
    }

    onLoadSuccess() {
    }
};
