module.exports = class {
    onCreate(input) {
        const state = {
            wait: input.timeWait,
            remain: input.timeRemain,
            timeOut: false,
            waitOver: false
        };
        this.state = state;
    }

    onMount() {
        if (this.state.remain) {
            this.remainCountdown = setInterval(() => {
                if (!this.state.remain) {
                    clearInterval(this.remainCountdown);
                    return;
                }
                this.state.remain -= 1;
            }, 1000);
        }
        if (this.state.wait) {
            this.waitCountdown = setInterval(() => {
                if (!this.state.wait) {
                    clearInterval(this.waitCountdown);
                    return;
                }
                this.state.wait -= 1;
            }, 1000);
        }
    }
};
