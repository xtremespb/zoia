const tippy = require("tippy.js").default;

module.exports = class {
    onMount() {
        this.tippyInstances = tippy("[data-tippy-content]", {
            delay: [100, 200],
            hideOnClick: true,
        });
        window.__zoiaTippyJs = {
            reset: this.reset.bind(this),
            hide: this.hide.bind(this)
        };
    }

    reset() {
        this.tippyInstances.map(i => i.destroy());
        setTimeout(() => this.tippyInstances = tippy("[data-tippy-content]"), 100);
    }

    hide() {
        this.tippyInstances.map(i => i.hide());
    }
};
