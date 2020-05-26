const axios = require("axios");

module.exports = class {
    onCreate() {
        const state = {
            destination: null,
            country: null,
            base: null,
            bases: []
        };
        this.state = state;
    }

    onDestinationChange(e) {
        this.setState("destination", e.target.value || null);
        this.setState("country", null);
        this.setState("base", null);
        this.setState("bases", []);
    }

    onBaseChange(e) {
        this.setState("base", e.target.value);
    }

    async onCountryChange(e) {
        const country = e.target.value;
        this.setState("country", country);
        this.setState("base", null);
        this.setState("bases", []);
        if (country) {
            try {
                const res = await axios.post("/api/bm/bases", {
                    country
                });
                this.setState("bases", res && res.data && res.data.bases ? res.data.bases : []);
            } catch (error) {
                // TODO: Provide some error handling
            }
        }
    }
};
