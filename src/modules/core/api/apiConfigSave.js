import fs from "fs-extra";
import path from "path";
import editData from "./data/configEdit.json";
import moduleConfig from "../module.json";

export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl
        } = req.zoia;
        const languages = Object.keys(req.zoiaConfig.languages);
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        if (!acl.checkPermission(moduleConfig.id, "read")) {
            response.requestAccessDeniedError();
            return;
        }
        // Get Form Data
        const formData = await req.processMultipart();
        // Initialize validator
        const extendedValidation = new req.ExtendedValidation(formData, editData.root, editData.part, editData.files, languages);
        // Perform validation
        const extendedValidationResult = await extendedValidation.validate();
        // Check if there are any validation errors
        if (extendedValidationResult.failed) {
            log.error(null, extendedValidationResult.message);
            response.validationError(extendedValidationResult);
            return;
        }
        // Get data from form body
        const data = extendedValidation.getData();
        const configFile = path.resolve(`${__dirname}/../../etc/zoia.json`);
        try {
            const configData = await fs.readJSON(configFile);
            Object.keys(req.zoiaConfig.languages).map(i => {
                configData.siteMetadata[i].title = data[i].title;
                configData.siteMetadata[i].titleShort = data[i].titleShort;
                configData.siteMetadata[i].descShort = data[i].descShort;
                configData.siteMetadata[i].siteLink = data[i].siteLink;
                configData.siteMetadata[i].siteLinkText = data[i].siteLinkText;
            });
            configData.routes.download = data.download;
            configData.routes.imagesBrowser = data.imagesBrowser;
            configData.routes.login = data.login;
            configData.routes.logout = data.logout;
            configData.routes.publicFiles = data.publicFiles;
            configData.routes.publicImages = data.publicImages;
            configData.commonTableItemsLimit = data.commonTableItemsLimit;
            configData.emailFrom = data.email;
            await fs.writeJSON(configFile, configData, {
                spaces: "\t"
            });
            // Return "success" result
            response.successJSON();
            return;
        } catch (e) {
            // There is an exception, send error 500 as response
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
