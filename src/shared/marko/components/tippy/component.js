const tippy = require("tippy.js").default;

module.exports = class {
    initTippy() {
        this.tippyInstances = [];
        this.tippyElements = tippy("[data-tippy-content]", {
            onCreate: instance => {
                this.tippyInstances.push(instance);
            }
        });
    }

    onMount() {
        tippy.setDefaultProps({
            arrow: true,
            zIndex: 30,
        });
        setTimeout(() => this.initTippy(), 100);
        window.__zoiaTippyJs = {
            reset: this.reset.bind(this),
            hide: this.hide.bind(this),
        };
    }

    reset() {
        this.tippyInstances.map(i => i.destroy());
        setTimeout(() => this.initTippy(), 100);
    }

    hide() {
        Array.from(document.querySelectorAll("[data-tippy-root]")).map(i => {
            i.style.visibility = "hidden";
            i.style.zIndex = 30;
        });
    }
};
