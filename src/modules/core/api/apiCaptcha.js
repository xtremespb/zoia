import captcha from "zoia-captcha";
import Cryptr from "cryptr";

export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
        } = req.zoia;
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        try {
            const cryptr = new Cryptr(req.zoiaConfig.secret);
            // c = code
            const c = Math.random().toString().substr(2, 4);
            const image = await captcha.getCaptcha(c);
            const imageData = `data:image/png;base64,${image.toString("base64")}`;
            // t = current timestamp
            const t = new Date().getTime();
            const imageSecret = cryptr.encrypt(JSON.stringify({
                c,
                t
            }));
            // Send response
            return response.successJSON({
                imageData,
                imageSecret
            });
        } catch (e) {
            log.error(e);
            return Promise.reject(e);
        }
    }
});
