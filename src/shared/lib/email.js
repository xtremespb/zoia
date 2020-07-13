export default {
    sendMail: async (req, to, subject, html, text, lang, addAttachments = []) => {
        try {
            const attachments = [{
                filename: 'logo.png',
                path: `${__dirname}/${req.zoiaConfigSecure.pathToLogo}`,
                cid: 'logo@zoiajs'
            }, ...addAttachments];
            const info = await req.zoiaMailer.sendMail({
                from: `${req.zoiaConfig.siteTitleShort[lang]} <${req.zoiaConfigSecure.serviceMailbox}>`,
                to,
                subject,
                text: text || '',
                html,
                attachments
            });
            if (info) {
                return info.messageId;
            }
            return null;
        } catch (e) {
            req.logError(e);
            return null;
        }
    }
};
