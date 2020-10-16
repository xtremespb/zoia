import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs-extra";
import path from "path";
import {
    v4 as uuid
} from "uuid";
import generateData from "./data/generate.json";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";
import Utils from "./utils";

const utils = new Utils();

export default () => ({
    schema: {
        body: generateData.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            rep.unauthorizedError(rep);
            return;
        }
        // Validate form
        if (req.validationError) {
            rep.logError(req, req.validationError ? req.validationError.message : "Request Error");
            rep.validationError(rep, req.validationError || {});
            return;
        }
        try {
            const cmData = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "cm_data"
            });
            if (!cmData || !cmData.config || !cmData.config.holdings || !auth.checkGroup("cm")) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Configuration not found",
                    errorKeyword: "noConfig",
                    errorData: []
                });
                return;
            }
            let userHolding;
            Object.keys(cmData.config.holdings).map(h => {
                if (auth.checkGroup(h)) {
                    userHolding = h;
                }
            });
            if (!userHolding || !cmData.config.holdings[userHolding]) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Holding not found",
                    errorKeyword: "noHolding",
                    errorData: []
                });
                return;
            }
            const holdingData = cmData.config.holdings[userHolding];
            const templatePath = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.files}/${req.zoiaModulesConfig["cm"].directory}/${holdingData.cards[req.body.cardType].id}.docx`);
            const template = await fs.readFile(templatePath, "binary");
            const dataZip = new PizZip(template);
            const templateDoc = new Docxtemplater();
            templateDoc.loadZip(dataZip);
            templateDoc.render();
            const templateBuf = templateDoc.getZip().generate({
                type: "nodebuffer"
            });
            const tempFilePath = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.tmp}/${uuid()}.docx`);
            await fs.writeFile(tempFilePath, templateBuf);
            const convertResult = await utils.convertDocxToPDF(tempFilePath, path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.tmp}`));
            await fs.remove(tempFilePath);
            if (!convertResult) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Could not convert file to PDF",
                    errorKeyword: "couldNotConvert",
                    errorData: []
                });
                return;
            }
            const uid = uuid();
            const saveFilename = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.files}/${uid}`);
            const stats = await fs.lstat(convertResult);
            await fs.move(convertResult, saveFilename);
            await this.mongo.db.collection(req.zoiaConfig.collections.files).updateOne({
                _id: uid
            }, {
                $set: {
                    name: `${uid}.pdf`,
                    mime: "application/pdf",
                    size: stats.size,
                    admin: false,
                    auth: true
                }
            }, {
                upsert: true
            });
            // Send result
            rep.successJSON(rep, {
                templatePath
            });
            return;
        } catch (e) {
            rep.logError(req, null, e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
