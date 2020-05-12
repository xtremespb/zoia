import userEdit from "./data/userEdit.json";

export default () => ({
    schema: {
        body: userEdit.root
    },
    attachValidation: true,
    async handler(req, rep) {
        // Validate form
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            rep.validationError(rep, req.validationError);
            return;
        }
        // const extendedValidation = new req.ExtendedValidation(req.body, userEdit.root, userEdit.part, userEdit.files);
        // const extendedValidationResult = extendedValidation.validate();
        try {
            rep.successJSON(rep, {});
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
