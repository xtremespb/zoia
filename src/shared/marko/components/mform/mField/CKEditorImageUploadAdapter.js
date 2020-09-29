const axios = require("axios");

module.exports = class {
    constructor(loader, config) {
        this.loader = loader;
        this.config = config;
    }

    upload() {
        return new Promise(async (resolve, reject) => {
            const formData = new FormData();
            const file = await this.loader.file;
            formData.append("upload", file);
            axios({
                method: "post",
                url: this.config.url,
                data: formData,
                headers: {
                    "content-type": "multipart/form-data",
                    ...this.config.headers
                }
            }).then(async res => {
                if (res && res.data && res.data.url) {
                    resolve({
                        default: res.data.url
                    });
                    return;
                }
                reject(res);
            }).catch(async err => reject(err));
        });
    }
};
