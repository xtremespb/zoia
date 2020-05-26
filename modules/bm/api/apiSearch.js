// import cloneDeep from "lodash/cloneDeep";
import Search from "../lib/search";
import searchData from "./data/search.json";

export default () => ({
    schema: {
        body: searchData.schema
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
            const search = new Search(this.mongo.db);
            const data = await search.query({
                dateFrom: req.body.dateFrom,
                dateTo: req.body.dateTo,
                country: req.body.country,
                region: req.body.region,
                shipyard: req.body.shipyard,
                base: req.body.base,
                sailingAreas: req.body.sailingAreas,
                equipment: req.body.equipment,
                minCabins: req.body.minCabins,
                minLength: req.body.minLength,
                minBerths: req.body.minBerths,
                minBeam: req.body.minBeam,
                minDraught: req.body.minDraught,
                minFuelCapacity: req.body.minFuelCapacity,
                waterCapacity: req.body.waterCapacity,
                minYear: req.body.minYear,
                skipper: req.body.skipper,
                product: req.body.product
            }, req.body.limit || 10, req.body.page || 1);
            rep.successJSON(rep, {
                yachts: data.yachts,
                total: data.total,
            });
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
