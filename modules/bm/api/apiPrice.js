import Moment from "moment";
import {
    extendMoment
} from "moment-range";
import {
    ObjectId
} from "mongodb";
import priceData from "./data/price.json";

const moment = extendMoment(Moment);

export default () => ({
    schema: {
        body: priceData.schema
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
            const yacht = await this.mongo.db.collection("yachts").findOne({
                _id: new ObjectId(req.body.id)
            });
            if (!yacht) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Database error",
                    errorKeyword: "yachtNotFound",
                    errorData: []
                });
                return;
            }
            let price = 0;
            let datesRange;
            let datesRangeDaysCount;
            const dateFrom = moment.utc(String(req.body.dateFrom), "DDMMYYYY").startOf("day");
            const dateTo = moment.utc(String(req.body.dateTo), "DDMMYYYY").endOf("day");
            if (dateFrom.isValid() && dateTo.isValid()) {
                datesRange = moment.range(dateFrom, dateTo);
                datesRangeDaysCount = Array.from(datesRange.by("day")).length;
            }
            if (datesRange && yacht.prices && yacht.prices.length) {
                let priceDaysCount = 0;
                yacht.prices.map(p => {
                    const priceDateFrom = moment.utc(p.start).startOf("day");
                    const priceDateTo = moment.utc(p.end).endOf("day");
                    const priceRange = moment.range(priceDateFrom, priceDateTo);
                    const priceRangeIntersect = datesRange.intersect(priceRange);
                    if (priceRangeIntersect) {
                        const rangeDays = Array.from(priceRangeIntersect.by("day")).length;
                        const priceDay = p.price / 7;
                        price += Math.ceil(priceDay * rangeDays);
                        priceDaysCount += rangeDays;
                    }
                });
                if (priceDaysCount !== datesRangeDaysCount) {
                    price = 0;
                }
            } else {
                price = 0;
            }
            rep.successJSON(rep, {
                price
            });
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
