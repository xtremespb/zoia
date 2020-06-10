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
            const sort = req.body.sort && req.body.sort > 1 ? parseInt(req.body.sort, 10) : undefined;
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
                product: req.body.product,
                kinds: req.body.kinds
            }, req.body.limit || 10, req.body.page || 1, sort, req.body.language);
            rep.successJSON(rep, {
                yachts: data.yachts.map(y => ({
                    _id: y._id,
                    name: y.name,
                    model: y.model,
                    year: y.year,
                    image: y.images && y.images.length ? y.images.find(i => i.main) : null,
                    region: data.regionsData[y.regionId],
                    country: data.countriesData[y.countryId],
                    base: data.basesData[y.homeBaseId],
                    price: y.price,
                    minPrice: y.minPrice,
                    cabins: y.cabins,
                    berths: y.berths,
                    engine: y.engine ? y.engine.replace(/hp/igm, ` ${data.i18nHP}`).replace(/\s\s+/g, " ") : undefined,
                    beam: y.beam,
                    length: y.length,
                    kind: y.kind,
                    equipment: y.equipmentIds
                })),
                total: data.total,
            });
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
