import moment from "moment";
import template from "./index.marko";
import searchQuery from "../data/searchQuery.json";
import Search from "../../lib/search";
import utils from "../../../../shared/lib/utils";
import i18nDb from "../../locales/database.json";

searchQuery.schema.properties.my.maximum = moment().year();

export default () => ({
    schema: {
        query: searchQuery.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        try {
            if (req.validationError) {
                // TODO: proper validation error page
                rep.logError(req, req.validationError.message);
                rep.validationError(rep, req.validationError);
                return null;
            }
            // Get features array
            let features;
            try {
                features = [...new Set(req.query.f.split(/-/).filter(f => parseInt(f, 10)).map(f => String(f)))];
                features = features.length ? features : undefined;
            } catch (e) {
                features = undefined;
            }
            // Get array of boat kinds
            let kinds;
            try {
                kinds = [...new Set(req.query.k.split(/-/).filter(k => parseInt(k, 10)).map(k => String(k)))];
                kinds = kinds.length ? kinds : undefined;
            } catch (e) {
                kinds = undefined;
            }
            const site = new req.ZoiaSite(req, "bm");
            const search = new Search(this.mongo.db);
            const sort = req.query.s ? parseInt(req.query.s, 10) : undefined;
            const data = await search.query({
                region: req.query.d ? String(req.query.d) : undefined,
                country: req.query.c ? String(req.query.c) : undefined,
                base: req.query.b ? String(req.query.b) : undefined,
                dateFrom: req.query.df ? String(req.query.df) : undefined,
                dateTo: req.query.dt ? String(req.query.dt) : undefined,
                equipment: features,
                kinds,
                product: req.query.pr ? parseInt(req.query.pr, 10) : undefined,
                minCabins: req.query.mc ? parseInt(req.query.mc, 10) : undefined,
                minYear: req.query.my ? parseInt(req.query.my, 10) : undefined,
                minLength: req.query.ml ? parseInt(req.query.ml, 10) : undefined,
                skipper: req.query.sk === undefined ? undefined : Boolean(req.query.sk)
            }, 10, req.query.p || 1, sort, site.language);
            let regions = await this.mongo.db.collection("regions").find({}).toArray();
            let countries = (await this.mongo.db.collection("countries").find({}).toArray()).map(c => ({
                _id: c._id,
                name: c.name,
                region: c.worldRegion
            }));
            // const countriesLang = {};
            // countries.map(r => countriesLang[r.name] = "");
            // fs.writeJSONSync(`${__dirname}/countries.json`, countriesLang);
            // Translate data if site language is Russian
            i18nDb[site.language] = i18nDb[site.language] || {};
            regions.map(r => r.name = i18nDb[site.language][r.name] || r.name);
            countries.map(c => c.name = i18nDb[site.language][c.name] || c.name);
            // Sort by names
            regions = regions.sort(utils.sortByName);
            countries = countries.sort(utils.sortByName);
            // Render
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        yachts: true,
                        regions: true,
                        countries: true,
                        pagesCount: true,
                        page: true,
                        total: true,
                        ...site.getSerializedGlobals()
                    },
                    template: req.zoiaTemplates.available[0],
                    pageTitle: site.i18n.t("moduleTitle"),
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
                        engine: y.engine ? y.engine.replace(/hp/gm, ` ${data.i18nHP}`).replace(/\s\s+/g, " ") : undefined,
                        beam: y.beam,
                        length: y.length,
                        equipment: y.equipmentIds
                    })),
                    total: data.total,
                    pagesCount: Math.ceil(data.total / 10),
                    page: req.query.p || 1,
                    regions,
                    countries,
                    ...site.getGlobals()
                },
            });
            return rep.sendHTML(rep, render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
