import {
    ObjectId
} from "mongodb";
import userDelete from "./data/userDelete.json";

export default () => ({
    schema: {
        body: userDelete.root
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
            const query = req.body.ids.map(id => ({
                _id: new ObjectId(id)
            }));
            // const result = await this.mongo.db.collection("users").deleteMany({
            //     $or: query
            // });
            // if (!result || !result.result || !result.result.ok) {
            //     rep.requestError(rep, {
            //         failed: true,
            //         error: "Could not delete one or more items",
            //         errorKeyword: "deleteError",
            //         errorData: []
            //     });
            //     return;
            // }
            rep.successJSON(rep);
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
