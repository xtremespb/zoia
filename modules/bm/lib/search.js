import Moment from "moment";
import {
    extendMoment
} from "moment-range";
import i18nDb from "../locales/database.json";

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
            },
            $or: []
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
        // Boat kinds
        if (input.kinds) {
            input.kinds.map(k => query.$or.push({
                kind: parseInt(k, 10)
            }));
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
            $all: input.equipment
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
        if (!query.$or.length) {
            delete query.$or;
        }
        return {
            query,
            datesRange,
            datesRangeDaysCount
        };
    }

    async query(input, limit = 10, page = 1, sort = 1, language = "") {
        const countriesData = {};
        const regionsData = {};
        const basesData = {};
        i18nDb[language] = i18nDb[language] || {};
        try {
            const countriesToQuery = {};
            const regionsToQuery = {};
            const basesToQuery = {};
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
            if (sort) {
                options.sort = {};
                switch (sort) {
                case 2:
                    options.sort.averagePrice = 1;
                    break;
                case 3:
                    options.sort.averagePrice = -1;
                    break;
                case 4:
                    options.sort.minPrice = 1;
                    break;
                case 5:
                    options.sort.minPrice = -1;
                    break;
                case 6:
                    options.sort.length = 1;
                    break;
                case 7:
                    options.sort.length = -1;
                    break;
                case 8:
                    options.sort.cabins = 1;
                    break;
                case 9:
                    options.sort.cabins = -1;
                    break;
                default:
                    options.sort.name = 1;
                }
            }
            // console.log(query);
            // console.log(options);
            const total = await this.db.collection("yachts").find(query).count();
            const yachts = (await this.db.collection("yachts").find(query, options).toArray()).map(yacht => {
                countriesToQuery[yacht.countryId] = true;
                regionsToQuery[yacht.regionId] = true;
                basesToQuery[yacht.homeBaseId] = true;
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
            if (yachts.length) {
                const regionsIds = Object.keys(regionsToQuery);
                if (regionsIds.length) {
                    const regionsQuery = regionsIds.map(id => ({
                        _id: String(id)
                    }));
                    (await this.db.collection("regions").find({
                        $or: regionsQuery
                    }).toArray()).map(i => {
                        regionsData[i._id] = i18nDb[language][i.name] || i.name;
                    });
                }
                const countriesIds = Object.keys(countriesToQuery);
                if (countriesIds.length) {
                    const countriesQuery = countriesIds.map(id => ({
                        _id: String(id)
                    }));
                    (await this.db.collection("countries").find({
                        $or: countriesQuery
                    }).toArray()).map(i => {
                        countriesData[i._id] = i18nDb[language][i.name] || i.name;
                    });
                }
                const basesIds = Object.keys(basesToQuery);
                if (basesIds.length) {
                    const basesQuery = basesIds.map(id => ({
                        _id: String(id)
                    }));
                    (await this.db.collection("bases").find({
                        $or: basesQuery
                    }).toArray()).map(i => {
                        basesData[i._id] = i18nDb[language][i.name] || i.name;
                    });
                }
            }
            return {
                yachts,
                total,
                regionsData,
                countriesData,
                basesData,
                i18nHP: i18nDb[language].hp || "HP",
                i18nMeters: i18nDb[language].meters || "m"
            };
        } catch (e) {
            return {
                yachts: [],
                regionsData: {},
                countriesData: {},
                basesData: {},
                total: 0
            };
        }
    }
}
