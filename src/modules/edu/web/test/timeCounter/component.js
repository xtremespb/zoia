module.exports = class {
    onCreate(input) {
        const state = {
            wait: input.timeWait,
            remain: input.timeRemain,
            remainPercentage: input.timeRemain ? parseInt((100 / input.timeLimit) * input.timeRemain, 10) : 0,
            timeOut: false,
            waitOver: false
        };
        this.timeLimit = input.timeLimit;
        this.state = state;
    }

    onMount() {
        if (this.state.remain) {
            this.remainCountdown = setInterval(() => {
                if (!this.state.remain) {
                    clearInterval(this.remainCountdown);
                    this.setState("timeOut", true);
                    this.emit("timeout");
                    return;
                }
                this.state.remain -= 1;
                this.state.remainPercentage = parseInt((100 / this.timeLimit) * this.state.remain, 10);
            }, 1000);
        }
        if (this.state.wait) {
            this.waitCountdown = setInterval(() => {
                if (!this.state.wait) {
                    clearInterval(this.waitCountdown);
                    this.setState("waitOver", true);
                    return;
                }
                this.state.wait -= 1;
            }, 1000);
        }
    }
};
