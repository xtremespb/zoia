import cookies from 'zoia-cookies';

import {
    APP_DATA_RUNTIME_SET_TOKEN,
    APP_DATA_RUNTIME_SET_CONFIG,
} from '../constants/core';

const initialState = {
    token: null,
    config: {
        siteTitle: {}
    },
    site: {},
    routes: []
};

export default ((state = initialState, action, config) => {
    if (!action && config) {
        initialState.token = cookies.get(`${config.id}_auth`) || null;
        return {};
    }
    switch (action.type) {
    case APP_DATA_RUNTIME_SET_TOKEN:
        return {
            ...state,
            token: action.payload
        };
    case APP_DATA_RUNTIME_SET_CONFIG:
        return {
            ...state,
            config: action.payload
        };
    default:
        return state;
    }
});
