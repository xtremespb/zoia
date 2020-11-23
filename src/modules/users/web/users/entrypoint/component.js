module.exports = class {
    onCreate(input, out) {
        this.state = {
            route: {
                name: out.global.routeId,
                params: out.global.routeParams
            }
        };
    }

    onStateChange(obj) {
        this.state.route = obj.route;
    }
};
