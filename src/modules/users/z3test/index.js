import auth from "./auth";
import edit from "./edit";
import addDelete from "./addDelete";
import logout from "./logout";
import Utils from "./utils";

export default async zoia => {
    const utils = new Utils(zoia);
    const testResult = {
        total: 4,
        success: 0
    };
    let testObject;
    let userData;
    let userDataAdmin;
    // Start tests
    try {
        // Generate test data
        userData = await utils.insertRandomUser(false);
        userDataAdmin = await utils.insertRandomUser();
        // Authorize
        let result = await auth(zoia, userDataAdmin);
        if (!result.success || !result.page || !result.test) {
            throw new Error();
        }
        testObject = result.test;
        testResult.success += 1;
        // Edit existing user
        result = await edit(zoia, result.test, result.page, userData);
        if (!result.success || !result.page || !result.test) {
            throw new Error();
        }
        testResult.success += 1;
        // Add new user
        result = await addDelete(zoia, result.test, result.page, utils);
        if (!result.success || !result.page || !result.test) {
            throw new Error();
        }
        testResult.success += 1;
        // Logout
        result = await logout(zoia, result.test, result.page);
        if (!result.success || !result.page || !result.test) {
            throw new Error();
        }
        testResult.success += 1;
    } catch {
        // Ignore
    }
    // Close test object if it's open
    if (testObject) {
        testObject.close();
    }
    // Clean up
    if (userData) {
        await utils.deleteRandomUser(userData);
        await utils.deleteRandomUser(userDataAdmin);
    }
    // Return
    return testResult;
};
