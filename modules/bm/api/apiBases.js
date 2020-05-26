// import cloneDeep from "lodash/cloneDeep";
import basesData from "./data/bases.json";

export default () => ({
    schema: {
        body: basesData.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        // Validate form
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            rep.validationError(rep, req.validationError);
            return;
        }
        try {
            const bases = (await this.mongo.db.collection("bases").find({
                countryId: req.body.country
            }).toArray()).map(b => ({
                _id: b._id,
                name: b.name,
                city: b.city
            }));
            rep.successJSON(rep, {
                bases
            });
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
