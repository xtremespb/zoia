import {
    createStore,
    applyMiddleware,
    compose
} from 'redux';
import logger from 'redux-logger';
import thunk from 'redux-thunk';
import {
    CookieStorage
} from 'redux-persist-cookie-storage';
import cookies from 'zoia-cookies';
import {
    persistStore,
    persistCombineReducers
} from 'redux-persist';
import {
    createBrowserHistory
} from 'history';
import {
    routerMiddleware
} from 'connected-react-router';

import rootReducer from '../reducers';

export const history = createBrowserHistory();

export default (preloadedState, config) => {
    const persistConfig = {
        key: `${config.id}_root`,
        storage: new CookieStorage(cookies, {
            expiration: {
                default: config.cookieOptions.expires
            },
            setCookieOptions: {
                path: config.cookieOptions.path,
                domain: config.cookieOptions.domain,
                secure: config.cookieOptions.secure,
                sameSite: config.cookieOptions.sameSite
            }
        }),
        whitelist: ['appData']
    };

    const middlewares = [thunk, routerMiddleware(history)];
    if (config.development) {
        middlewares.push(logger);
    }
    const persistedReducers = persistCombineReducers(persistConfig, rootReducer(history, config));
    const store = createStore(
        persistedReducers,
        preloadedState,
        compose(applyMiddleware(...middlewares))
    );
    const persistor = persistStore(store);
    return {
        store,
        persistor
    };
};
