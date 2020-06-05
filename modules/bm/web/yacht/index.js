import template from "./index.marko";
import searchQuery from "../data/searchQuery.json";
import i18nDb from "../../locales/database.json";

export default () => ({
    schema: {
        query: searchQuery.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        try {
            if (req.validationError || !req.params.id) {
                rep.callNotFound();
                return rep.code(204);
            }
            const yacht = await this.mongo.db.collection("yachts").findOne({
                _id: String(req.params.id)
            });
            if (!yacht) {
                rep.callNotFound();
                return rep.code(204);
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
            // Render
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        yacht: true,
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
                        engine: yacht.engine,
                        length: yacht.length,
                        beam: yacht.beam,
                        equipment: yacht.equipment
                    },
                    ...site.getGlobals()
                },
            });
            return rep.sendHTML(rep, render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
