const Utils = require("../utils");

module.exports = class {
    onCreate(input) {
        const state = {
            overGap: false
        };
        this.state = state;
        this.utils = new Utils();
        this.gapId = input.id;
        this.isTop = input.isTop || false;
    }

    onGapDragOver(e) {
        e.preventDefault();
    }

    onGapDragEnter(e) {
        e.preventDefault();
        this.state.overGap = true;
    }

    onGapDragLeave(e) {
        e.preventDefault();
        this.state.overGap = false;
    }

    onGapDrop(e) {
        if (!e.dataTransfer.getData("text/plain") || !e.dataTransfer.getData("text/plain").match(/^__ztr__/)) {
            e.preventDefault();
            return;
        }
        this.onGapDragLeave(e);
        const id = e.dataTransfer.getData("text/plain").replace(/^__ztr__/, "");
        this.emit("gap-drop", `${id},${this.gapId}${this.isTop ? ",1" : ""}`);
    }
};
