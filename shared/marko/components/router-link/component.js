module.exports = class {
    onMount() {
        this.router = window.router;
        try {
            this.route = this.input.route;
            this.params = this.input.params ? JSON.parse(this.input.params) : {};
        } catch (e) {
            // Ignore
        }
    }

    navigate(e) {
        e.preventDefault();
        if (this.route) {
            this.router.navigate(this.route, this.params || {});
        } else {
            throw new Error(`Missing attribute "route" on router-link component`);
        }
    }
};
