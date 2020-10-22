import Auth from "../../../../shared/lib/auth";
import template from "./template.marko";
import C from "../../../../shared/lib/constants";
import moduleData from "../../module.json";
import Mailer from "../../../../shared/lib/mailer";

export default routeId => ({
    async handler(req, rep) {
        try {
            const auth = new Auth(this.mongo.db, this, req, rep, C.USE_COOKIE_FOR_TOKEN);
            const site = new req.ZoiaSite(req, "pages", this.mongo.db);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                auth.clearAuthCookie();
                return rep.redirectToLogin(req, rep, site, req.zoiaModulesConfig["pages"].routes.admin);
            }
            const mailer = new Mailer(this, site.language);
            mailer.setRecepient("xtreme@rh1.ru");
            mailer.setSubject("Legacy");
            mailer.setPreheader("This is an awesome preheader");
            // HTML
            mailer.setHTML(`${this.mailTemplateComponentsHTML["header"]({ text: "That's a header" })}${this.mailTemplateComponentsHTML["subheader"]({ text: "And that's something what we call a sub-header" })}${this.mailTemplateComponentsHTML["paragraph"]({ text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Purus faucibus ornare suspendisse sed nisi lacus sed. Hendrerit gravida rutrum quisque non tellus orci." })}${this.mailTemplateComponentsHTML["button"]({ label: "Button", url: "https://re-hash.ru" })}${this.mailTemplateComponentsHTML["line"]({})}${this.mailTemplateComponentsHTML["paragraph"]({ text: "Gravida arcu ac tortor dignissim convallis. Sed adipiscing diam donec adipiscing tristique." })}${this.mailTemplateComponentsHTML["paragraph"]({ text: "" })}`);
            // Text
            mailer.setText(`${this.mailTemplateComponentsText["header"]({ text: "That's a header" })}${this.mailTemplateComponentsText["subheader"]({ text: "And that's something what we call a sub-header" })}${this.mailTemplateComponentsText["paragraph"]({ text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Purus faucibus ornare suspendisse sed nisi lacus sed. Hendrerit gravida rutrum quisque non tellus orci." })}${this.mailTemplateComponentsText["button"]({ label: "Button", url: "https://re-hash.ru" })}${this.mailTemplateComponentsText["line"]({})}${this.mailTemplateComponentsText["paragraph"]({ text: "Gravida arcu ac tortor dignissim convallis. Sed adipiscing diam donec adipiscing tristique." })}${this.mailTemplateComponentsText["paragraph"]({ text: "" })}`, false);
            mailer.addLogo();
            mailer.sendMail();
            site.setAuth(auth);
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        routeId: true,
                        routeParams: true,
                        routes: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "admin",
                    pageTitle: `${site.i18n.t("moduleTitle")} | ${site.i18n.t("adminPanel")}`,
                    routeId,
                    routeParams: req.params || {},
                    routes: {
                        ...req.zoiaModulesConfig["pages"].routes,
                        ...req.zoiaConfig.routes
                    },
                    ...await site.getGlobals()
                },
                modules: req.zoiaModules,
                moduleId: moduleData.id,
            });
            return rep.sendHTML(rep, render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
