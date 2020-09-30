const axios = require("axios");
const Cookies = require("../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            active: false,
            loading: false,
            running: false,
            error: null

        };
        this.state = state;
        this.func = {
            setActive: this.setActive.bind(this),
        };
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
    }

    onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
    }

    setActive(state) {
        this.state.active = state;
    }

    onCloseClick() {
        if (this.state.loading) {
            return;
        }
        this.setActive(false);
    }

    async onConfirmClick() {
        if (this.state.loading || this.state.running) {
            return;
        }
        try {
            this.state.loading = true;
            await axios({
                method: "post",
                url: "/api/backup/start",
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.loading = false;
            this.state.running = true;
        } catch (e) {
            this.state.loading = false;
        }
    }
};
