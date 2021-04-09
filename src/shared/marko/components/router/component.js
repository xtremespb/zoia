const createRouter = require("router5").default;
const browserPlugin = require("router5-plugin-browser").default;

module.exports = class {
    onCreate(input) {
        this.routes = input.routes || [];
        this.options = input.options || null;
    }

    onMount() {
        this.router = createRouter(this.routes, this.options);
        this.router.usePlugin(
            browserPlugin({
                useHash: false
            })
        );
        this.router.start();
        this.router.subscribe(obj => {
            this.emit("state-change", obj);
            this.forceUpdate();
        });
        window.router = this.router;
    }
};
