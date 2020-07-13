import {
    APP_LINGUI_SET_CATALOG
} from '../constants/core';

const initialState = {
    catalogs: {}
};

export default ((state = initialState, action) => {
    switch (action.type) {
    case APP_LINGUI_SET_CATALOG:
        const {
            language, catalog
        } = action.payload;
        const catalogs = {
            state
        };
        catalogs[language] = catalog;
        return {
            ...state,
            catalogs
        };
    default:
        return state;
    }
});
