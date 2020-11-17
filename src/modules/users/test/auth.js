import Test from "../../../shared/lib/test";

export default async (zoia, userData) => {
    const result = {
        success: true,
        page: null,
        test: null
    };
    try {
        const test = new Test(zoia);
        try {
            zoia.log.warn(`Auth test starting`);
            await test.init();
            const authPage = await test.browser.newPage();
            zoia.log.step("Opening authentication page");
            await authPage.goto(`${zoia.config.siteOptions.url}${zoia.config.routes.login}?redirect=${zoia.modulesConfig["core"].routes.admin}`);
            zoia.log.step("Setting username and password");
            await authPage.type("#username", userData.username);
            await authPage.type("#password", userData.password);
            zoia.log.step("Clicking on a login button");
            await authPage.click("#btnLogin");
            zoia.log.step("Wating for admin panel");
            await authPage.waitForSelector(".z3-ap-head-thin", {
                visible: true,
                timeout: 15000
            });
            zoia.log.success(`Auth test success, running time: ${(test.getRunTimeMs() / 1000).toFixed(2)} second(s)`);
            result.page = authPage;
            result.test = test;
        } catch (e) {
            zoia.log.error(`Auth test failed: ${e.message}`);
            result.success = false;
        }
    } catch (e) {
        zoia.log.error(e);
        result.success = false;
    }
    return result;
};
