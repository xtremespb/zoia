import captcha from "zoia-captcha";
import Cryptr from "cryptr";

export default () => ({
    async handler(req, rep) {
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
            return rep.successJSON(rep, {
                imageData,
                imageSecret
            });
        } catch (e) {
            rep.logError(req, null, e);
            return Promise.reject(e);
        }
    }
});
