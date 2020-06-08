import Moment from "moment";
import {
    extendMoment
} from "moment-range";
import {
    ObjectId
} from "mongodb";
import template from "./index.marko";
import searchQuery from "../data/searchQuery.json";
import i18nDb from "../../locales/database.json";

const moment = extendMoment(Moment);

export default () => ({
    schema: {
        query: searchQuery.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        try {
            if (req.validationError || !req.params.id || typeof req.params.id !== "string" || !req.params.id.match(/^[a-f\d]{24}$/)) {
                rep.callNotFound();
                return rep.code(204);
            }
            const yacht = await this.mongo.db.collection("yachts").findOne({
                _id: new ObjectId(req.params.id)
            });
            if (!yacht) {
                rep.callNotFound();
                return rep.code(204);
            }
            // There is a range, let's calculate yacht price
            if (req.query.df && req.query.dt) {
                let datesRange;
                let datesRangeDaysCount;
                const dateFrom = moment.utc(String(req.query.df), "DDMMYYYY").startOf("day");
                const dateTo = moment.utc(String(req.query.dt), "DDMMYYYY").endOf("day");
                if (dateFrom.isValid() && dateTo.isValid()) {
                    datesRange = moment.range(dateFrom, dateTo);
                    datesRangeDaysCount = Array.from(datesRange.by("day")).length;
                }
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
            }
            const site = new req.ZoiaSite(req, "bm");
            i18nDb[site.language] = i18nDb[site.language] || {};
            const countryData = await this.mongo.db.collection("countries").findOne({
                _id: String(yacht.countryId)
            });
            yacht.country = i18nDb[site.language][countryData.name] || countryData.name;
            const baseData = await this.mongo.db.collection("bases").findOne({
                _id: String(yacht.homeBaseId)
            });
            yacht.base = i18nDb[site.language][baseData.name] || baseData.name;
            yacht.plan = yacht.images ? yacht.images.find(i => i.plan ? i.filename : null) : null;
            yacht.images = yacht.images ? yacht.images.map(i => !i.plan ? i.filename : null).filter(i => i) : [];
            if (yacht.products && yacht.products.length) {
                yacht.products.map(p => {
                    p.name = i18nDb[site.language][p.name] || p.name;
                    p.extras = p.extras.map(e => ({
                        name: i18nDb[site.language][e.name] || e.name,
                        obligatory: e.obligatory,
                        price: e.price,
                        unit: i18nDb[site.language][e.unit] || e.unit
                    }));
                });
            }
            // Query for equipment
            yacht.equipment = [];
            if (yacht.equipmentIds && yacht.equipmentIds.length) {
                const equipmentData = await this.mongo.db.collection("equipment").find({
                    $or: yacht.equipmentIds.map(e => ({
                        _id: String(e)
                    }))
                }).toArray();
                if (equipmentData && equipmentData.length) {
                    yacht.equipment = equipmentData.map(e => i18nDb[site.language][e.name] || e.name).sort();
                }
            }
            const moduleConfig = {
                frontend: req.zoiaModulesConfig["bm"].frontend,
                routes: req.zoiaModulesConfig["bm"].routes
            };
            // Render
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        yacht: true,
                        moduleConfig: true,
                        ...site.getSerializedGlobals()
                    },
                    template: req.zoiaTemplates.available[0],
                    pageTitle: site.i18n.t("moduleTitle"),
                    yacht: {
                        id: yacht._id,
                        name: yacht.name,
                        model: yacht.model,
                        base: yacht.base,
                        kind: yacht.kind,
                        country: yacht.country,
                        images: yacht.images,
                        plan: yacht.plan,
                        cabins: yacht.cabins,
                        berths: yacht.berths,
                        wc: yacht.wc,
                        year: yacht.year,
                        engine: yacht.engine ? yacht.engine.replace(/hp/gm, ` ${site.i18n.t("hp")}`).replace(/\s\s+/g, " ") : undefined,
                        length: yacht.length,
                        beam: yacht.beam,
                        equipment: yacht.equipment,
                        products: yacht.products,
                        price: yacht.price,
                        minPrice: yacht.minPrice
                    },
                    moduleConfig,
                    ...site.getGlobals()
                },
            });
            return rep.sendHTML(rep, render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
