import React, { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';

const Nav = lazy(() => import(/*  webpackChunkName: "Nav" */ './components/Nav.jsx'));

const getSuspense = () => (<div className="uk-flex uk-flex-center uk-flex-middle" style={{ height: '100%' }}><span uk-spinner="ratio:2" /></div>);

const getNav = () => ((
    <Suspense fallback={getSuspense()}>
        <Nav />
    </Suspense>
));

export default () => ([
    (<Route
        key="nav"
        path="/admin/nav"
        component={getNav}
    />)
]);
