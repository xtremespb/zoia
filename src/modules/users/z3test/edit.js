export default async (zoia, test, page, userData) => {
    const result = {
        success: true,
        page: null,
        test: null
    };
    try {
        zoia.log.warn(`User edit test starting`);
        zoia.log.step("Opening users admin page");
        await page.goto(`${zoia.config.url}${zoia.modulesConfig["users"].routes.users}`);
        await page.waitForSelector("#users_searchInput", {
            visible: true,
            timeout: 15000
        });
        zoia.log.step(`Searching for user: ${userData.username}`);
        await page.type("#users_searchInput", userData.username);
        await page.waitForSelector(`#users_btnEdit_${userData._id}`, {
            visible: true,
            timeout: 15000
        });
        zoia.log.step("Clicking on Edit button");
        await page.click(`#users_btnEdit_${userData._id}`);
        await page.waitForSelector("#userEditForm_username", {
            visible: true,
            timeout: 15000
        });
        zoia.log.step("Waiting for the form to load");
        await page.waitForFunction(`document.getElementById("userEditForm_username").value !== ""`);
        await page.waitForFunction(`document.getElementById("userEditForm_email").value === "${userData.email}"`);
        zoia.log.step(`Setting new e-mail address: edit.${userData.email}`);
        await page.evaluate(() => document.getElementById("userEditForm_email").value = "");
        await page.type("#userEditForm_email", `edit.${userData.email}`);
        zoia.log.step("Saving");
        await page.click("#userEditForm_btnSave");
        zoia.log.step("Waiting for the table to load");
        await page.waitForSelector(".z3-ap-head-thin", {
            visible: true,
            timeout: 15000
        });
        await page.waitForSelector(`#users_btnEdit_${userData._id}`, {
            visible: true,
            timeout: 15000
        });
        zoia.log.step("Clicking on Edit button");
        await page.click(`#users_btnEdit_${userData._id}`);
        await page.waitForSelector("#userEditForm_email", {
            visible: true,
            timeout: 15000
        });
        await page.waitForFunction(`document.getElementById("userEditForm_email").value !== ""`);
        zoia.log.step("Checking if e-mail is saved correctly");
        const currentEmail = await page.$eval("#userEditForm_email", el => el.value);
        test.assert.equal(currentEmail, `edit.${userData.email}`);
        await page.waitForFunction(`document.getElementById("userEditForm_email").value === "edit.${userData.email}"`);
        result.page = page;
        result.test = test;
        zoia.log.success(`User edit test success, running time: ${(test.getRunTimeMs() / 1000).toFixed(2)} second(s)`);
    } catch (e) {
        zoia.log.error(`User edit test failed: ${e.message}`);
        result.success = false;
    }
    return result;
};
