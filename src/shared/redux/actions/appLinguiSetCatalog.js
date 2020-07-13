import {
    APP_LINGUI_SET_CATALOG
} from '../constants/core';

export default (language, catalog) => ({
    type: APP_LINGUI_SET_CATALOG,
    payload: {
        language,
        catalog
    }
});
