import test from "./data/test.json";

export default () => ({
    schema: {
        body: test.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        // Validate form
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            rep.validationError(rep, req.validationError);
            return;
        }
        const extendedValidation = new req.ExtendedValidation(req.body, test.root, test.part, test.files, ["en", "ru"]);
        const extendedValidationResult = extendedValidation.validate();
        try {
            rep.successJSON(rep, extendedValidationResult);
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
