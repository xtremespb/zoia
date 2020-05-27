import template from "./index.marko";
import searchQuery from "../data/searchQuery.json";
import Search from "../../lib/search";

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
            const site = new req.ZoiaSite(req, "bm");
            const search = new Search(this.mongo.db);
            const data = await search.query({
                region: req.query.d ? String(req.query.d) : undefined,
                country: req.query.c ? String(req.query.c) : undefined,
                base: req.query.b ? String(req.query.b) : undefined,
            }, 10, req.query.p || 1);
            const regions = await this.mongo.db.collection("regions").find({}).toArray();
            const countries = (await this.mongo.db.collection("countries").find({}).toArray()).map(c => ({
                _id: c._id,
                name: c.name,
                region: c.worldRegion
            }));
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
                        ...site.getSerializedGlobals()
                    },
                    template: req.zoiaTemplates.available[0],
                    pageTitle: site.i18n.t("moduleTitle"),
                    yachts: data.yachts.map(y => ({
                        _id: y._id,
                        name: y.name,
                        model: y.model,
                        year: y.year
                    })),
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
