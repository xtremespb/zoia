import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { ConnectedRouter } from 'connected-react-router';
import { Route, Switch } from 'react-router-dom';
import Icons from 'uikit/dist/js/uikit-icons';
import axios from 'axios';
import UIkit from '../lib/uikit';
import '../styles/uikit.scss';
import modules from '../build/modules.json';
import configureStore, { history } from '../redux/store/configureStore';
import Error from './Error/Error.jsx';
import ErrorBoundary from './Error/ErrorBoundary.jsx';

(async () => {
    const errorMessage = (<div className="uk-flex uk-flex-center uk-flex-middle uk-flex-column" style={{ height: '100%' }}>
        <div className="uk-text-small">
            <div><svg height="128px" viewBox="0 0 512 512" width="128px" xmlns="http://www.w3.org/2000/svg"><path d="m0 96v384c0 17.679688 14.320312 32 32 32h448c17.679688 0 32-14.320312 32-32v-384zm0 0" fill="#e1eaf7" /><path d="m0 0h512v128h-512zm0 0" fill="#b0bec5" /><path d="m64 48h32v32h-32zm0 0" fill="#fff" /><path d="m128 48h32v32h-32zm0 0" fill="#fff" /><path d="m432 80h-224c-8.832031 0-16-7.167969-16-16s7.167969-16 16-16h224c8.832031 0 16 7.167969 16 16s-7.167969 16-16 16zm0 0" fill="#90a4ae" /><path d="m384 320c0 70.691406-57.308594 128-128 128s-128-57.308594-128-128 57.308594-128 128-128 128 57.308594 128 128zm0 0" fill="#e76e54" /><path d="m315.3125 283.3125-22.625-22.625-36.6875 36.6875-36.6875-36.6875-22.625 22.625 36.6875 36.6875-36.6875 36.6875 22.625 22.625 36.6875-36.6875 36.6875 36.6875 22.625-22.625-36.6875-36.6875zm0 0" /></svg></div>
        </div>
    </div>);
    try {
        ReactDOM.render(
            <div className="uk-flex uk-flex-center uk-flex-middle uk-flex-column" style={{ height: '100%' }}>
                <div className="uk-text-small">
                    <div className="uk-margin-small-right" uk-spinner="ratio:1.3" />
                </div>
            </div>,
            document.getElementById('app')
        );
        const config = (await axios.get('/etc/config.json')).data;
        const { store, persistor } = configureStore(undefined, config);
        store.dispatch({ type: 'APP_DATA_RUNTIME_SET_CONFIG', payload: config });
        if (UIkit) {
            UIkit.use(Icons);
        }
        const getNoMatchComponent = () => (<Error code="404" />);
        ReactDOM.render(
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <ErrorBoundary>
                        <ConnectedRouter history={history}>
                            <Switch>
                                {Object.keys(modules).map(m => require(`../../modules/${m}/admin/routes.jsx`).default()).flat()}
                                <Route
                                    component={getNoMatchComponent}
                                />
                            </Switch>
                        </ConnectedRouter>
                    </ErrorBoundary>
                </PersistGate>
            </Provider>,
            document.getElementById('app')
        );
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        ReactDOM.render(
            errorMessage,
            document.getElementById('app')
        );
    }
})();
