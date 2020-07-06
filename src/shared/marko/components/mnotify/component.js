module.exports = class {
    onCreate() {
        const state = {
            active: false,
            activeFlag: false,
            message: "",
            css: ""
        };
        this.state = state;
        this.func = {
            show: this.show.bind(this)
        };
    }

    onMount() {
        // Set functions for window object
        if (this.input.id) {
            window.__z3_mnotify_func = window.__z3_mtable_func || {};
            window.__z3_mnotify_func[this.input.id] = this.func;
        }
    }

    show(message, css = "", delay = 3500) {
        this.setState("message", message);
        this.setState("activeFlag", false);
        this.setState("css", css);
        if (this.timeout) {
            clearTimeout(this.timeout1);
            clearTimeout(this.timeout2);
        }
        this.setState("active", true);
        this.timeout1 = setTimeout(() => this.setState("activeFlag", false), delay);
        this.timeout2 = setTimeout(() => this.setState("active", false), delay + 1000);
        setTimeout(() => this.setState("activeFlag", true), 50);
    }
};
