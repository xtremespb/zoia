import React, { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';

const Update = lazy(() => import(/*  webpackChunkName: "Update" */ './components/Update.jsx'));

const getSuspense = () => (<div className="uk-flex uk-flex-center uk-flex-middle" style={{ height: '100%' }}><span uk-spinner="ratio:2" /></div>);

const getUpdate = () => ((
    <Suspense fallback={getSuspense()}>
        <Update />
    </Suspense>
));

export default () => ([
    (<Route
        key="nav"
        path="/admin/update"
        component={getUpdate}
    />)
]);
