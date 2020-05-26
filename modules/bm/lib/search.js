import Moment from "moment";
import {
    extendMoment
} from "moment-range";

const moment = extendMoment(Moment);

export default class {
    constructor(db) {
        this.db = db;
    }

    _generateQuery(input) {
        const query = {
            avail: {
                $exists: true,
                $gt: []
            }
        };
        const dateFrom = moment.utc(input.dateFrom, "DDMMYYYY").startOf("day");
        const dateTo = moment.utc(input.dateTo, "DDMMYYYY").endOf("day");
        let datesRange;
        let datesRangeDaysCount;
        // Dates are specified
        if (dateFrom.isValid() && dateTo.isValid()) {
            query.avail.$elemMatch = {
                start: {
                    $lte: dateFrom.toDate()
                },
                end: {
                    $gte: dateTo.toDate()
                },
            };
            datesRange = moment.range(dateFrom, dateTo);
            datesRangeDaysCount = Array.from(datesRange.by("day")).length;
        }
        // Country, region, shipyard, home base
        query.countryId = input.country;
        query.regionId = input.region;
        query.shipyardId = input.shipyard;
        query.homeBaseId = input.base;
        // Sailing areas
        query.sailingAreas = input.sailingAreas ? {
            $in: [input.sailingAreas]
        } : undefined;
        // Equipment
        query.equipmentIds = input.equipment ? {
            $in: input.equipment
        } : undefined;
        // Cabins
        query.cabins = input.minCabins ? {
            $gte: input.minCabins
        } : undefined;
        // Length
        query.length = input.minLength ? {
            $gte: input.minLength
        } : undefined;
        // Berths
        query.berths = input.minBerths ? {
            $gte: input.minBerths
        } : undefined;
        // Beam
        query.beam = input.minBeam ? {
            $gte: input.minBeam
        } : undefined;
        // Draught
        query.draught = input.minDraught ? {
            $gte: input.minDraught
        } : undefined;
        // Fuel Capacity
        query.fuelCapacity = input.minFuelCapacity ? {
            $gte: input.minFuelCapacity
        } : undefined;
        // WC
        query.wc = input.minWC ? {
            $gte: input.minWC
        } : undefined;
        // Product
        query.availProducts = input.product ? {
            $in: [input.product]
        } : undefined;
        // Sailing area
        query.sailingAreas = input.sailingAreas ? {
            $in: [input.sailingAreas]
        } : undefined;
        // Fuel Capacity
        query.waterCapacity = input.minWaterCapacity ? {
            $gte: input.minWaterCapacity
        } : undefined;
        // Year
        query.year = input.minYear ? {
            $gte: input.minYear
        } : undefined;
        // Skipper
        query.skipper = input.skipper;
        // Filter query
        Object.keys(query).map(i => {
            if (query[i] === undefined) {
                delete query[i];
            }
        });
        console.log(query);
        return {
            query,
            datesRange,
            datesRangeDaysCount
        };
    }

    async query(input, limit = 10, page = 1) {
        try {
            const {
                query,
                datesRange,
                datesRangeDaysCount
            } = this._generateQuery(input);
            const skip = page * limit - limit;
            const options = {
                limit,
                skip
            };
            const total = await this.db.collection("yachts").find(query).count();
            const yachts = (await this.db.collection("yachts").find(query, options).toArray()).map(yacht => {
                if (datesRange && yacht.prices && yacht.prices.length) {
                    yacht.price = 0;
                    let priceDaysCount = 0;
                    yacht.prices.map(p => {
                        const priceDateFrom = moment.utc(p.start).startOf("day");
                        const priceDateTo = moment.utc(p.end).endOf("day");
                        const priceRange = moment.range(priceDateFrom, priceDateTo);
                        const priceRangeIntersect = datesRange.intersect(priceRange);
                        if (priceRangeIntersect) {
                            const rangeDays = Array.from(priceRangeIntersect.by("day")).length;
                            const priceDay = p.price / 7;
                            yacht.price += Math.ceil(priceDay * rangeDays);
                            priceDaysCount += rangeDays;
                        }
                    });
                    if (priceDaysCount !== datesRangeDaysCount) {
                        yacht.price = 0;
                    }
                } else {
                    yacht.price = 0;
                }
                return yacht;
            });
            return {
                yachts,
                total
            };
        } catch (e) {
            return {
                yachts: [],
                total: 0
            };
        }
    }
}
