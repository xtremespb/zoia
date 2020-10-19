import nodemailer from "nodemailer";
import {
    v4 as uuid
} from "uuid";

export default class {
    constructor(fastify) {
        this.fastify = fastify;
        this.transporter = nodemailer.createTransport(fastify.zoiaConfig.email.mailer);
        this.message = {
            from: fastify.zoiaConfig.email.from,
            to: "",
            subject: "",
            text: "",
            html: "",
            attachments: []
        };
    }

    setRecepient(value) {
        this.message.to = value;
    }

    setSubject(value) {
        this.message.subject = value;
    }

    setText(value) {
        this.message.text = value;
    }

    setHTML(value) {
        this.message.html = value;
    }

    addAttachment(filename, path, cid = uuid()) {
        this.message.attachments.push({
            filename,
            path,
            cid
        });
    }

    async send() {
        try {
            const result = this.transporter.sendMail(this.message);
            return result;
        } catch (e) {
            return e;
        }
    }
}
