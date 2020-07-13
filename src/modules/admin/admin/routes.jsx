import React, { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';

const AdminStub = lazy(() => import(/* webpackChunkName: "AdminStub" */ './components/AdminStub.jsx'));

const getSuspense = () => (<div className="uk-flex uk-flex-center uk-flex-middle" style={{ height: '100%' }}><span uk-spinner="ratio:2" /></div>);

const getAdminStub = () => ((
    <Suspense fallback={getSuspense()}>
        <AdminStub />
    </Suspense>
));

export default () => ([
    (<Route
        key="stubAdmin"
        exact
        path="/admin"
        component={getAdminStub}
    />)
]);
