export default async (zoia, test, page) => {
    const result = {
        success: true,
        page: null,
        test: null
    };
    try {
        zoia.log.warn(`Logout test starting`);
        await page.goto(`${zoia.config.url}${zoia.config.routes.logout}`);
        await page.waitForSelector(".z3-dt-logo", {
            visible: true,
            timeout: 15000
        });
        zoia.log.success(`Logout test success, running time: ${(test.getRunTimeMs() / 1000).toFixed(2)} second(s)`);
        result.page = page;
        result.test = test;
    } catch (e) {
        zoia.log.error(`Logout test failed: ${e.message}`);
        result.success = false;
    }
    return result;
};
