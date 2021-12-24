export default async (zoia, test, page, utils) => {
    const result = {
        success: true,
        page: null,
        test: null
    };
    try {
        zoia.log.warn(`User add/delete test starting`);
        zoia.log.step("Opening users admin page");
        await page.goto(`${zoia.config.url}${zoia.modulesConfig["users"].routes.users}`);
        await page.waitForSelector("#users_btnAdd", {
            visible: true,
            timeout: 15000
        });
        zoia.log.step("Clicking on Add button");
        await page.click("#users_btnAdd");
        await page.waitForSelector("#userEditForm_username", {
            visible: true,
            timeout: 15000
        });
        const username = utils.getRandomString();
        const password = utils.getRandomString();
        zoia.log.step(`Adding user with username=${username} and password=${password}`);
        await page.type("#userEditForm_username", username);
        await page.type("#userEditForm_password", password);
        await page.type("#userEditForm_passwordRepeat", password);
        await page.type("#userEditForm_email", `${username}@zoiajs.org`);
        await page.evaluate(() => document.getElementById("userEditForm_status_active").click());
        await page.evaluate(() => document.getElementById("userEditForm_status_admin").click());
        zoia.log.step("Saving");
        await page.click("#userEditForm_btnSave");
        await page.waitForSelector("#users_btnAdd", {
            visible: true,
            timeout: 15000
        });
        await page.waitForSelector("#users_searchInput", {
            visible: true,
            timeout: 15000
        });
        zoia.log.step("Searching for the new user");
        await page.evaluate(() => document.getElementById("users_searchInput").value = "");
        await page.type("#users_searchInput", utils.getRandomString());
        await page.waitForFunction(`document.querySelectorAll('[data-action="btnEdit"]').length === 0`);
        await page.evaluate(() => document.getElementById("users_searchInput").value = "");
        await page.type("#users_searchInput", username);
        await page.waitForFunction(`document.querySelectorAll('[data-action="btnEdit"]').length > 0`);
        zoia.log.step("Clicking on Edit button");
        await page.evaluate(() => document.querySelectorAll(`[data-action="btnEdit"]`)[0].click());
        zoia.log.step("Waiting for a form to load");
        await page.waitForFunction(`document.getElementById("userEditForm_username").value !== ""`);
        const currentUsername = await page.$eval("#userEditForm_username", el => el.value);
        const currentEmail = await page.$eval("#userEditForm_email", el => el.value);
        // const currentGroups = await page.$eval("#userEditForm_groups", el => el.value);
        const currentPassword = await page.$eval("#userEditForm_password", el => el.value);
        const currentPasswordRepeat = await page.$eval("#userEditForm_passwordRepeat", el => el.value);
        const currentActive = await page.$eval("#userEditForm_status_active", check => check.checked);
        const currentAdmin = await page.$eval("#userEditForm_status_admin", check => check.checked);
        zoia.log.step("Asserting username");
        test.assert.equal(currentUsername, username);
        zoia.log.step("Asserting e-mail");
        test.assert.equal(currentEmail, `${username}@zoiajs.org`);
        // zoia.log.step("Asserting groups");
        // test.assert.equal(currentGroups, "");
        zoia.log.step("Asserting password and passwordRepeat");
        test.assert.equal(currentPassword, "");
        test.assert.equal(currentPasswordRepeat, "");
        zoia.log.step("Asserting status");
        test.assert.equal(currentActive, false);
        test.assert.equal(currentAdmin, true);
        zoia.log.step("Saving");
        await page.click("#userEditForm_btnSave");
        await page.waitForSelector("#users_btnAdd", {
            visible: true,
            timeout: 15000
        });
        zoia.log.step("Waiting for table to load");
        await page.waitForFunction(`document.querySelectorAll('[data-action="btnDeleteGeneric"]').length > 0`);
        zoia.log.step("Clicking on a Delete button");
        await page.evaluate(() => document.querySelectorAll(`[data-action="btnDeleteGeneric"]`)[0].click());
        zoia.log.step("Waiting for confirmation dialog");
        await page.waitForSelector("#users_deleteConfirmButton", {
            visible: true,
            timeout: 15000
        });
        zoia.log.step("Confirming");
        await page.click("#users_deleteConfirmButton");
        zoia.log.step("Checking for user to be deleted");
        await page.waitForFunction(`document.querySelectorAll('[data-action="btnDeleteGeneric"]').length === 0`);
        result.page = page;
        result.test = test;
        zoia.log.success(`User add/delete success, running time: ${(test.getRunTimeMs() / 1000).toFixed(2)} second(s)`);
    } catch (e) {
        zoia.log.error(`User add/delete failed: ${e.message}`);
        result.success = false;
    }
    return result;
};
