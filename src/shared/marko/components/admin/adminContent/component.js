const tippy = require("tippy.js").default;

module.exports = class {
    onMount() {
        tippy("[data-tippy-content]");
    }
};
