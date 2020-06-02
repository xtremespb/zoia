export default {
    checkDatabaseDuplicates: async (rep, db, collection, query, errorKeyword, field) => {
        try {
            const item = await db.collection(collection).findOne(query);
            if (item) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Database error",
                    errorKeyword,
                    errorData: [{
                        keyword: errorKeyword,
                        dataPath: field ? `.${field}` : undefined
                    }]
                });
                return true;
            }
            return false;
        } catch (e) {
            rep.requestError(rep, {
                failed: true,
                error: e.message,
                errorKeyword: "general",
                errorData: []
            });
            return true;
        }
    },
    sortByName(a, b) {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    }
};
