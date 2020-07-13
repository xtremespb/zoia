class CKEditorImageUploadAdapter {
    constructor(loader, config, axios) {
        this.loader = loader;
        this.config = config;
        this.axios = axios;
    }

    upload = () => new Promise(async (resolve, reject) => {
        const formData = new FormData();
        const file = await this.loader.file;
        formData.append('upload', file);
        if (this.config.extras) {
            Object.keys(this.config.extras).map(k => formData.append(k, this.config.extras[k]));
        }
        this.axios.post(this.config.url, formData, {
            headers: {
                'content-type': 'multipart/form-data'
            }
        }).then(async res => {
            if (res && res.data && res.data.statusCode === 200 && res.data.url) {
                resolve({
                    default: res.data.url
                });
                return;
            }
            reject(res);
        }).catch(async err => reject(err));
    });
}

export default CKEditorImageUploadAdapter;
