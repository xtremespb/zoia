module.exports = class {
    onCreate() {
        const state = {
            overGap: false
        };
        this.state = state;
    }

    onGapDragOver(e) {
        e.preventDefault();
    }

    onGapDragEnter(e, target) {
        e.preventDefault();
        console.log(e.target);
        console.log(target);
        console.log("onGapDragEnter");
        this.state.overGap = true;
    }

    onGapDragLeave(e) {
        e.preventDefault();
        console.log("onGapDragLeave");
        this.state.overGap = false;
    }
};
