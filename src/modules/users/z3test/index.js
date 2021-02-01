import auth from "./auth";
import edit from "./edit";
import addDelete from "./addDelete";
import logout from "./logout";
import Test from "../../../shared/lib/test";

export default async zoia => {
    const testResult = {
        total: 4,
        success: 0
    };
    let userData;
    let userDataAdmin;
    // Start tests
    const test = new Test(zoia);
    try {
        // Generate test data
        userData = await zoia.utils.insertRandomUser(false);
        userDataAdmin = await zoia.utils.insertRandomUser();
        // Authorize
        let result = await auth(test, zoia, userDataAdmin);
        if (!result.success || !result.page) {
            throw new Error();
        }
        testResult.success += 1;
        // Edit existing user
        result = await edit(zoia, test, result.page, userData);
        if (!result.success || !result.page) {
            throw new Error();
        }
        testResult.success += 1;
        // Add new user
        result = await addDelete(zoia, test, result.page, zoia.utils);
        if (!result.success || !result.page) {
            throw new Error();
        }
        testResult.success += 1;
        // Logout
        result = await logout(zoia, test, result.page);
        if (!result.success || !result.page) {
            throw new Error();
        }
        testResult.success += 1;
    } catch {
        // Ignore
    }
    test.close();
    // Clean up
    if (userData) {
        await zoia.utils.deleteRandomUser(userData);
        await zoia.utils.deleteRandomUser(userDataAdmin);
    }
    // Return
    return testResult;
};
