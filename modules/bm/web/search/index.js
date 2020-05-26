import template from "./index.marko";
import Search from "../../lib/search";

export default () => ({
    async handler(req, rep) {
        try {
            const site = new req.ZoiaSite(req, "bm");
            const search = new Search(this.mongo.db);
            const data = await search.query({}, 10, 1);
            const destinations = await this.mongo.db.collection("areas").find({}).toArray();
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
                        destinations: true,
                        countries: true,
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
                    destinations,
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
