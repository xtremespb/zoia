import {
    connectRouter
} from 'connected-react-router';

import appData from './appData';
import appDataRuntime from './appDataRuntime';
import appLingui from './appLingui';
import modules from '../../build/modules.json';

export default (history, config) => {
    let moduleReducers = {};
    // eslint-disable-next-line global-require
    Object.keys(modules).map(m => {
        try {
            const reducers = require(`../../../modules/${m}/admin/reducers/index.js`).default();
            moduleReducers = {
                ...moduleReducers,
                ...reducers
            };
        } catch (e) {
            // Ignore
        }
    });
    // Set defaults in reducers
    appData(null, null, config);
    appDataRuntime(null, null, config);
    // Return
    return {
        ...moduleReducers,
        router: connectRouter(history),
        appData,
        appDataRuntime,
        appLingui
    };
};
