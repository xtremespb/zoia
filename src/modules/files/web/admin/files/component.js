const axios = require("axios");
const Cookies = require("../../../../../shared/lib/cookies").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            dir: "/",
            files: []
        };
        this.state = state;
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
    }

    async onMount() {
        const cookies = new Cookies(this.cookieOptions);
        this.token = cookies.get(`${this.siteOptions.id || "zoia3"}.authToken`);
        await this.loadList(this.state.dir);
    }

    async loadList(dir) {
        try {
            const res = await axios({
                method: "post",
                url: "/api/files/list",
                data: {
                    dir
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
            this.state.files = res.data && res.data.filesData ? res.data.filesData : [];
        } catch (e) {
            // TODO: Error Handling
            console.error(e);
        }
    }
};
