import path from "path";
import nodemailer from "nodemailer";
import {
    v4 as uuid
} from "uuid";
import htmlToText from "html-to-text";

export default class {
    constructor(fastify, language) {
        this.fastify = fastify;
        this.language = language;
        this.config = fastify.zoiaConfig;
        this.transporter = nodemailer.createTransport(fastify.zoiaConfig.email.mailer);
        this.message = {
            from: fastify.zoiaConfig.email.from,
            to: "",
            subject: "",
            text: "",
            html: "",
            attachments: []
        };
        this.preheader = "";
    }

    async initMetadata() {
        const siteMetadata = (await this.fastify.mongo.db.collection(this.config.collections.registry).findOne({
            _id: "site_metadata"
        })) || this.config.siteMetadata;
        this.siteMetadata = siteMetadata[this.language];
    }

    addLogo(cid = "logo@zoiajs.org") {
        this.message.attachments.push({
            filename: this.fastify.zoiaConfig.email.logoFile,
            path: path.resolve(`${__dirname}/../../build/mail/images/${this.fastify.zoiaConfig.email.logoFile}`),
            cid
        });
    }

    setRecipient(value) {
        this.message.to = value;
    }

    setSubject(value) {
        this.message.subject = value;
    }

    setText(value, fromHTML = false) {
        this.message.text = this.fastify.mailTemplatesText[this.language]({
            subject: this.message.subject,
            preheader: this.preheader,
            meta: this.siteMetadata,
            content: fromHTML ? htmlToText.fromString(value) : value
        });
    }

    setPreheader(value) {
        this.preheader = value;
    }

    setHTML(value) {
        this.message.html = this.fastify.mailTemplatesHTML[this.language]({
            subject: this.message.subject,
            preheader: this.preheader,
            meta: this.siteMetadata,
            content: value
        });
    }

    addAttachment(filename, filePath, cid = uuid()) {
        this.message.attachments.push({
            filename,
            path: filePath,
            cid
        });
    }

    async sendMail() {
        try {
            const result = await this.transporter.sendMail(this.message);
            return result;
        } catch (e) {
            return e;
        }
    }
}
