const tippy = require("tippy.js").default;

module.exports = class {
    onMount() {
        this.tippyInstances = tippy("[data-tippy-content]", {
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
        Array.from(document.querySelectorAll("[data-tippy-root]")).map(i => i.style.visibility = "hidden");
    }
};
