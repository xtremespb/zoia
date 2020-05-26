module.exports = class {
    onCreate(input, out) {
        const state = {
            yachts: out.global.yachts || []
        };
        this.state = state;
    }
};
